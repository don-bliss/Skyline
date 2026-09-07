import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const PORT = process.env.PORT || 3000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'https://don-bliss.github.io';
const DATABASE_URL = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.SKYLINE_JWT_SECRET || '';
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'SkyLine <onboarding@resend.dev>';
const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'SkyLine';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || '';
const DEFAULT_PHONE_COUNTRY = process.env.DEFAULT_PHONE_COUNTRY || 'NG';

if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) throw new Error('SKYLINE_JWT_SECRET must be set to a random value of at least 32 characters.');
if (isProduction && !DATABASE_URL) throw new Error('DATABASE_URL is required in production. Connect this service to a Render Postgres database.');
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 }) : null;
const app = express(); app.set('trust proxy', 1); app.disable('x-powered-by');
app.use(helmet()); app.use(express.json({ limit: '4mb' }));
app.use(cors({ origin:(origin,cb)=>{ if(!origin) return cb(null,true); const allowed=WEB_ORIGIN.split(',').map(v=>v.trim()).filter(Boolean); return allowed.includes('*')||allowed.includes(origin)?cb(null,true):cb(new Error('CORS origin not allowed')); }, credentials:false }));
app.use('/api/', rateLimit({ windowMs:60_000, limit:120, standardHeaders:true, legacyHeaders:false }));

const id=()=>crypto.randomUUID();
const localReadUsers=()=>JSON.parse(fs.readFileSync(usersFile,'utf8')||'[]');
const localWriteUsers=users=>fs.writeFileSync(usersFile,JSON.stringify(users,null,2));
const hashSecret=v=>crypto.createHash('sha256').update(String(v)).digest('hex');
const otp=()=>String(crypto.randomInt(100000,1000000));
const normalizeEmail=v=>String(v||'').trim().toLowerCase();
function normalizePhone(input, country){
  const raw=String(input||'').trim();
  const parsed=parsePhoneNumberFromString(raw, country || DEFAULT_PHONE_COUNTRY);
  if(!parsed || !parsed.isValid()) throw new Error('Enter a valid mobile number with the correct country or international format.');
  return { e164: parsed.number, nationalDigits: String(parsed.nationalNumber), country: parsed.country || country || DEFAULT_PHONE_COUNTRY };
}
const identityFromPhone=phone=>normalizePhone(phone.e164 || phone, phone.country).nationalDigits;
async function makePhoneIdentity(phone){
  const base=identityFromPhone(phone);
  let candidate=base, n=0;
  while(await findUserByUsername(candidate) || await findUserByAccountNumber(candidate)){
    n++; candidate=`${base}${n}`;
    if(candidate.length>24) candidate=`${base.slice(0,24-String(n).length)}${n}`;
  }
  return { username:candidate, accountNumber:candidate, base };
}
const hashPassword=async password=>{const salt=crypto.randomBytes(16).toString('hex');const hash=await new Promise((r,j)=>crypto.scrypt(password,salt,64,(e,d)=>e?j(e):r(d.toString('hex'))));return `${salt}:${hash}`;};
const verifyPassword=async(password,stored)=>{const [salt,hash]=String(stored||'').split(':');if(!salt||!hash)return false;const d=await new Promise((r,j)=>crypto.scrypt(password,salt,64,(e,x)=>e?j(e):r(x.toString('hex'))));const a=Buffer.from(hash,'hex'),b=Buffer.from(d,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b);};
const b64u=v=>Buffer.from(v).toString('base64url');
const signJwt=(payload,ttl=3600)=>{const now=Math.floor(Date.now()/1000),body={...payload,iat:now,exp:now+ttl},head=b64u(JSON.stringify({alg:'HS256',typ:'JWT'})),data=`${head}.${b64u(JSON.stringify(body))}`,sig=crypto.createHmac('sha256',JWT_SECRET||'development-only-secret').update(data).digest('base64url');return `${data}.${sig}`;};
const verifyJwt=token=>{const [h,b,s]=String(token||'').split('.');if(!h||!b||!s)throw Error('Invalid token');const data=`${h}.${b}`,exp=crypto.createHmac('sha256',JWT_SECRET||'development-only-secret').update(data).digest('base64url');const a=Buffer.from(s),c=Buffer.from(exp);if(a.length!==c.length||!crypto.timingSafeEqual(a,c))throw Error('Invalid token');const p=JSON.parse(Buffer.from(b,'base64url').toString('utf8'));if(!p.exp||p.exp<Math.floor(Date.now()/1000))throw Error('Token expired');return p;};

const publicUser=u=>({id:u.id,name:u.name,email:u.email,phone:u.phone||'',accountNumber:u.accountNumber,username:u.username,avatar:u.avatar||'',balance:Number(u.balance||0),bio:u.bio||'',location:u.location||'',website:u.website||'',emailVerified:Boolean(u.emailVerified),phoneVerified:Boolean(u.phoneVerified),createdAt:u.createdAt});
const issueTokens=user=>({accessToken:signJwt({sub:user.id,type:'access'},3600),refreshToken:signJwt({sub:user.id,type:'refresh',nonce:id()},60*60*24*30)});

async function initDb(){if(!pool)return; await pool.query(`CREATE TABLE IF NOT EXISTS skyline_users (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,phone TEXT NOT NULL DEFAULT '',account_number TEXT NOT NULL UNIQUE,username TEXT NOT NULL UNIQUE,avatar TEXT NOT NULL DEFAULT '',balance NUMERIC(20,2) NOT NULL DEFAULT 0,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
for(const sql of [
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT ''`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS email_verification_hash TEXT`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS phone_verification_hash TEXT`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS phone_verification_expires TIMESTAMPTZ`,
`ALTER TABLE skyline_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`]) await pool.query(sql);
await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS skyline_users_phone_unique_nonempty ON skyline_users(phone) WHERE phone <> ''`);
await pool.query(`CREATE TABLE IF NOT EXISTS skyline_transactions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES skyline_users(id) ON DELETE CASCADE,type TEXT NOT NULL,amount NUMERIC(20,2) NOT NULL,status TEXT NOT NULL DEFAULT 'completed',description TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}
function dbUser(r){return{id:r.id,name:r.name,email:r.email,phone:r.phone,accountNumber:r.account_number,username:r.username,avatar:r.avatar,balance:Number(r.balance||0),passwordHash:r.password_hash,bio:r.bio||'',location:r.location||'',website:r.website||'',emailVerified:r.email_verified,phoneVerified:r.phone_verified,emailVerificationHash:r.email_verification_hash,emailVerificationExpires:r.email_verification_expires,phoneVerificationHash:r.phone_verification_hash,phoneVerificationExpires:r.phone_verification_expires,createdAt:new Date(r.created_at).toISOString()};}
async function findUserByEmail(email){const e=normalizeEmail(email);if(!pool)return localReadUsers().find(u=>u.email===e)||null;const {rows}=await pool.query('SELECT * FROM skyline_users WHERE email=$1 LIMIT 1',[e]);return rows[0]?dbUser(rows[0]):null;}
async function findUserByPhone(phone,country){const p=typeof phone==='object'?phone.e164:normalizePhone(phone,country).e164;if(!pool)return localReadUsers().find(u=>u.phone===p)||null;const {rows}=await pool.query('SELECT * FROM skyline_users WHERE phone=$1 LIMIT 1',[p]);return rows[0]?dbUser(rows[0]):null;}
async function findUserByAccountNumber(accountNumber){const x=String(accountNumber||'').trim();if(!x)return null;if(!pool)return localReadUsers().find(u=>String(u.accountNumber)===x)||null;const {rows}=await pool.query('SELECT * FROM skyline_users WHERE account_number=$1 LIMIT 1',[x]);return rows[0]?dbUser(rows[0]):null;}
async function findUserById(uid){if(!pool)return localReadUsers().find(u=>u.id===uid)||null;const {rows}=await pool.query('SELECT * FROM skyline_users WHERE id=$1 LIMIT 1',[uid]);return rows[0]?dbUser(rows[0]):null;}
async function findUserByUsername(username){const x=String(username||'').replace(/^@/,'').trim().toLowerCase();if(!pool)return localReadUsers().find(u=>String(u.username).toLowerCase()===x)||null;const {rows}=await pool.query('SELECT * FROM skyline_users WHERE LOWER(username)=LOWER($1) LIMIT 1',[x]);return rows[0]?dbUser(rows[0]):null;}
async function insertUser(u){if(!pool){localWriteUsers([...localReadUsers(),u]);return;}await pool.query(`INSERT INTO skyline_users(id,name,email,phone,account_number,username,avatar,balance,password_hash,bio,location,website,email_verified,phone_verified,email_verification_hash,email_verification_expires,phone_verification_hash,phone_verification_expires,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())`,[u.id,u.name,u.email,u.phone,u.accountNumber,u.username,u.avatar,Number(u.balance||0),u.passwordHash,u.bio||'',u.location||'',u.website||'',!!u.emailVerified,!!u.phoneVerified,u.emailVerificationHash||null,u.emailVerificationExpires||null,u.phoneVerificationHash||null,u.phoneVerificationExpires||null,u.createdAt]);}
async function updateUser(u){if(!pool){const xs=localReadUsers(),i=xs.findIndex(x=>x.id===u.id);if(i>=0){xs[i]=u;localWriteUsers(xs);}return;}await pool.query(`UPDATE skyline_users SET name=$1,phone=$2,username=$3,avatar=$4,bio=$5,location=$6,website=$7,email_verified=$8,phone_verified=$9,email_verification_hash=$10,email_verification_expires=$11,phone_verification_hash=$12,phone_verification_expires=$13,updated_at=NOW() WHERE id=$14`,[u.name,u.phone,u.username,u.avatar,u.bio||'',u.location||'',u.website||'',!!u.emailVerified,!!u.phoneVerified,u.emailVerificationHash||null,u.emailVerificationExpires||null,u.phoneVerificationHash||null,u.phoneVerificationExpires||null,u.id]);}

async function sendEmailCode(email,code){if(!RESEND_API_KEY)return {sent:false,reason:'RESEND_API_KEY is not configured'};const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:EMAIL_FROM,to:[email],subject:'Your SkyLine verification code',html:`<div style="font-family:Arial"><h2>Verify your SkyLine email</h2><p>Your code is <b style="font-size:24px;letter-spacing:4px">${code}</b></p><p>This code expires in 10 minutes.</p><p>If you did not request this code, you can safely ignore this email.</p></div>`})});if(!r.ok){const detail=await r.text().catch(()=>'' );throw Error(`Email delivery failed${detail?`: ${detail.slice(0,240)}`:''}`);}return {sent:true,provider:'resend'};}
async function sendPhoneCode(phone,code){
if(TWILIO_ACCOUNT_SID&&TWILIO_AUTH_TOKEN&&TWILIO_VERIFY_SERVICE_SID){const auth=Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');const body=new URLSearchParams({To:phone,Channel:'sms'});const r=await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw Error('SMS verification delivery failed');return {sent:true,provider:'twilio-verify'};}
if(!TERMII_API_KEY)return {sent:false,reason:'SMS provider not configured'};const to=phone.replace(/^\+/,'');const r=await fetch('https://api.ng.termii.com/api/sms/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to,from:TERMII_SENDER_ID,sms:`Your SkyLine verification code is ${code}. It expires in 10 minutes.`,type:'plain',channel:'generic',api_key:TERMII_API_KEY})});if(!r.ok)throw Error('SMS delivery failed');return {sent:true};}
async function createVerification(user,kind){const code=otp(),expires=new Date(Date.now()+10*60*1000).toISOString();if(kind==='email'){user.emailVerificationHash=hashSecret(code);user.emailVerificationExpires=expires;}else if(TWILIO_ACCOUNT_SID&&TWILIO_AUTH_TOKEN&&TWILIO_VERIFY_SERVICE_SID){user.phoneVerificationHash='twilio';user.phoneVerificationExpires=expires;}else{user.phoneVerificationHash=hashSecret(code);user.phoneVerificationExpires=expires;}await updateUser(user);const result=kind==='email'?await sendEmailCode(user.email,code):await sendPhoneCode(user.phone,code);if(!isProduction&&!result.sent) console.log(`[DEV] ${kind} verification for ${user.id}: ${code}`);return result;}
async function confirmTwilioPhone(phone,code){const auth=Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');const body=new URLSearchParams({To:phone,Code:code});const r=await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body});if(!r.ok)return false;const d=await r.json();return d.status==='approved';}
const requireAuth=async(req,res,next)=>{try{const claims=verifyJwt((req.headers.authorization||'').replace(/^Bearer\s+/i,''));if(claims.type!=='access')throw Error();const u=await findUserById(claims.sub);if(!u)return res.status(401).json({message:'Account not found.'});req.user=u;next();}catch{return res.status(401).json({message:'Your SkyLine session has expired. Please sign in again.'});}};

app.get('/',(_q,res)=>res.json({ok:true,service:'skyline-api',message:'SkyLine API is live. Use /api/v1/health for health checks.'}));
app.get('/api/v1/health',async(_q,res)=>{try{if(pool)await pool.query('SELECT 1');res.json({ok:true,service:'skyline-api',version:'v1',database:pool?'postgres':'local'});}catch{res.status(503).json({ok:false,message:'Database unavailable.'});}});

app.post('/api/v1/auth/signup',async(req,res)=>{try{const{name,email,phone,country,password,avatar=''}=req.body||{};if(!name||!email||!phone||!password||String(password).length<8)return res.status(400).json({message:'Name, email, phone number and a password of at least 8 characters are required.'});const normalizedEmail=normalizeEmail(email),phoneInfo=normalizePhone(phone,country);if(await findUserByEmail(normalizedEmail))return res.status(409).json({message:'An account already exists with that email.'});if(await findUserByPhone(phoneInfo))return res.status(409).json({message:'An account already exists with that phone number.'});const identity=await makePhoneIdentity(phoneInfo);const user={id:id(),name:String(name).trim(),email:normalizedEmail,phone:phoneInfo.e164,accountNumber:identity.accountNumber,username:identity.username,avatar:typeof avatar==='string'?avatar:'',balance:0,passwordHash:await hashPassword(password),bio:'',location:'',website:'',emailVerified:false,phoneVerified:false,createdAt:new Date().toISOString()};await insertUser(user);const delivery={};try{delivery.email=await createVerification(user,'email');delivery.phone=await createVerification(user,'phone');}catch(e){console.error('Verification delivery:',e.message);delivery.error=e.message;}res.status(201).json({user:publicUser(user),...issueTokens(user),verification:{emailRequired:true,phoneRequired:true,delivery,phoneIdentity:identity.base}});}catch(e){console.error(e);res.status(500).json({message:e.message?.includes('valid Nigerian')?e.message:'Unable to create the account.'});}});
app.post('/api/v1/auth/login',async(req,res)=>{try{const{email,password}=req.body||{};const loginId=String(email||'').trim();let u=await findUserByEmail(loginId);if(!u){try{u=await findUserByPhone(loginId);}catch{u=await findUserByUsername(loginId);}}if(!u)u=await findUserByUsername(loginId);if(!u||!(await verifyPassword(password||'',u.passwordHash)))return res.status(401).json({message:'Incorrect email or password.'});const verificationRequired=!u.emailVerified || !u.phoneVerified;res.json({user:{...publicUser(u),verificationRequired},...issueTokens(u),verification:{emailVerified:!!u.emailVerified,phoneVerified:!!u.phoneVerified,required:verificationRequired}});}catch(e){res.status(500).json({message:'Unable to sign in right now.'});}});
app.post('/api/v1/auth/refresh',async(req,res)=>{try{const c=verifyJwt(req.body?.refreshToken);if(c.type!=='refresh')throw Error();const u=await findUserById(c.sub);if(!u)return res.status(401).json({message:'Account not found.'});res.json({user:publicUser(u),...issueTokens(u)});}catch{res.status(401).json({message:'Refresh token expired. Please sign in again.'});}});
app.post('/api/v1/auth/logout',(_q,res)=>res.json({ok:true}));
app.get('/api/v1/me',requireAuth,(req,res)=>res.json({user:publicUser(req.user)}));
app.get('/api/v1/profile',requireAuth,(req,res)=>res.json({user:publicUser(req.user)}));
app.patch('/api/v1/profile',requireAuth,async(req,res)=>{try{const b=req.body||{},u=req.user;if(typeof b.name==='string'&&b.name.trim())u.name=b.name.trim().slice(0,80);if(typeof b.avatar==='string')u.avatar=b.avatar.slice(0,4_000_000);if(typeof b.bio==='string')u.bio=b.bio.trim().slice(0,300);if(typeof b.location==='string')u.location=b.location.trim().slice(0,80);if(typeof b.website==='string')u.website=b.website.trim().slice(0,200);if(typeof b.username==='string'){const un=b.username.replace(/^@/,'').trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(un))return res.status(400).json({message:'Username must be 3–24 characters using letters, numbers or underscores.'});const existing=await findUserByUsername(un);if(existing&&existing.id!==u.id)return res.status(409).json({message:'That username is already taken.'});u.username=un;}await updateUser(u);res.json({user:publicUser(u)});}catch(e){res.status(500).json({message:'Unable to update profile.'});}});
app.get('/api/v1/verification/status',requireAuth,(req,res)=>res.json({email:{configured:Boolean(RESEND_API_KEY),provider:RESEND_API_KEY?'resend':null},phone:{configured:Boolean((TWILIO_ACCOUNT_SID&&TWILIO_AUTH_TOKEN&&TWILIO_VERIFY_SERVICE_SID)||TERMII_API_KEY),provider:(TWILIO_ACCOUNT_SID&&TWILIO_AUTH_TOKEN&&TWILIO_VERIFY_SERVICE_SID)?'twilio-verify':(TERMII_API_KEY?'termii':null)},user:{emailVerified:!!req.user.emailVerified,phoneVerified:!!req.user.phoneVerified}}));
app.post('/api/v1/verification/:kind/send',requireAuth,async(req,res)=>{try{const kind=req.params.kind;if(!['email','phone'].includes(kind))return res.status(404).end();const result=await createVerification(req.user,kind);res.json({ok:true,...result,message:result.sent?`Verification code sent to your ${kind}.`:`Verification provider is not configured yet.`});}catch(e){res.status(500).json({message:e.message||'Unable to send verification code.'});}});
app.post('/api/v1/verification/:kind/confirm',requireAuth,async(req,res)=>{try{const kind=req.params.kind,code=String(req.body?.code||'');if(!['email','phone'].includes(kind)||!/^\d{6}$/.test(code))return res.status(400).json({message:'Enter the 6-digit verification code.'});const u=req.user,hash=kind==='email'?u.emailVerificationHash:u.phoneVerificationHash,expires=kind==='email'?u.emailVerificationExpires:u.phoneVerificationExpires;if(!hash||!expires||Date.parse(expires)<Date.now())return res.status(400).json({message:'This verification code has expired. Request a new code.'});if(kind==='phone'&&hash==='twilio'){if(!(await confirmTwilioPhone(u.phone,code)))return res.status(400).json({message:'Incorrect or expired verification code.'});}else if(hashSecret(code)!==hash)return res.status(400).json({message:'Incorrect verification code.'});if(kind==='email'){u.emailVerified=true;u.emailVerificationHash=null;u.emailVerificationExpires=null;}else{u.phoneVerified=true;u.phoneVerificationHash=null;u.phoneVerificationExpires=null;}await updateUser(u);res.json({ok:true,user:publicUser(u)});}catch{res.status(500).json({message:'Unable to verify this code.'});}});
app.get('/api/v1/wallet',requireAuth,async(req,res)=>{try{const tx=pool?(await pool.query('SELECT id,type,amount,status,description,created_at FROM skyline_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',[req.user.id])).rows.map(r=>({id:r.id,type:r.type,amount:Number(r.amount),status:r.status,description:r.description,createdAt:r.created_at})):[];res.json({wallet:{accountNumber:req.user.accountNumber,accountName:req.user.name,balance:Number(req.user.balance||0),currency:'NGN'},transactions:tx});}catch{res.status(500).json({message:'Unable to load wallet.'});}});
app.get('/api/v1/transactions',requireAuth,async(req,res)=>{if(!pool)return res.json({transactions:[]});const{rows}=await pool.query('SELECT id,type,amount,status,description,created_at FROM skyline_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id]);res.json({transactions:rows.map(r=>({id:r.id,type:r.type,amount:Number(r.amount),status:r.status,description:r.description,createdAt:r.created_at}))});});
for(const route of ['/timeline','/timeline/posts','/notifications','/transfers/quote','/transfers']){app.get('/api/v1'+route,requireAuth,(_q,res)=>res.status(501).json({message:'This SkyLine service is reserved for the secure production backend.'}));app.post('/api/v1'+route,requireAuth,(_q,res)=>res.status(501).json({message:'This SkyLine service is reserved for the secure production backend.'}));app.patch('/api/v1'+route,requireAuth,(_q,res)=>res.status(501).json({message:'This SkyLine service is reserved for the secure production backend.'}));}
for(const route of ['/feed/trends','/feed/mutuals','/feed/explore','/marketplace','/crypto/markets'])app.get('/api/v1'+route,requireAuth,(_q,res)=>res.status(501).json({message:'Service not connected yet.'}));
app.post('/api/v1/crypto/orders',requireAuth,(_q,res)=>res.status(501).json({message:'Trading service not connected yet.'}));
app.post('/api/v1/wallet/:action',requireAuth,(_q,res)=>res.status(501).json({message:'This financial action requires a licensed payment backend and provider integration.'}));
async function start(){if(pool)await initDb();app.listen(PORT,()=>console.log(`SkyLine API listening on ${PORT}`));} start().catch(e=>{console.error('SkyLine API startup failed:',e);process.exit(1);});
