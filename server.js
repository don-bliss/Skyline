import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const PORT = process.env.PORT || 3000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || '';
const JWT_SECRET = process.env.SKYLINE_JWT_SECRET || '';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn('WARNING: Set SKYLINE_JWT_SECRET to a random secret of at least 32 characters before production.');
}

fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: WEB_ORIGIN || true, credentials: true }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

const readUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]');
const writeUsers = users => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
const id = () => crypto.randomUUID();
const accountNumber = () => {
  const users = readUsers();
  let n;
  do n = String(Math.floor(1000000000 + Math.random() * 9000000000));
  while (users.some(u => u.accountNumber === n));
  return n;
};
const hashPassword = async password => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, d) => e ? reject(e) : resolve(d.toString('hex'))));
  return `${salt}:${hash}`;
};
const verifyPassword = async (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const derived = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, d) => e ? reject(e) : resolve(d.toString('hex'))));
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
};
const b64u = value => Buffer.from(value).toString('base64url');
const signJwt = (payload, ttlSeconds = 3600) => {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const data = `${head}.${b64u(JSON.stringify(body))}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET || 'CHANGE_ME').update(data).digest('base64url');
  return `${data}.${sig}`;
};
const verifyJwt = token => {
  const [head, body, sig] = String(token || '').split('.');
  if (!head || !body || !sig) throw new Error('Invalid token');
  const data = `${head}.${body}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET || 'CHANGE_ME').update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
};
const publicUser = u => ({ id:u.id, name:u.name, email:u.email, phone:u.phone || '', accountNumber:u.accountNumber, username:u.username, avatar:u.avatar || '', balance:Number(u.balance || 0), createdAt:u.createdAt });
const issueTokens = user => ({ accessToken: signJwt({ sub:user.id, type:'access' }, 60 * 60), refreshToken: signJwt({ sub:user.id, type:'refresh', nonce:id() }, 60 * 60 * 24 * 30) });

const requireAuth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const claims = verifyJwt(token);
    if (claims.type !== 'access') throw new Error('Invalid access token');
    const user = readUsers().find(u => u.id === claims.sub);
    if (!user) return res.status(401).json({ message:'Account not found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message:'Your SkyLine session has expired. Please sign in again.' });
  }
};

app.get('/', (_req,res)=>res.json({ok:true,service:'skyline-api',message:'SkyLine API is live. Use /api/v1/health for health checks.'}));

app.get('/api/v1/health', (_req,res)=>res.json({ok:true,service:'skyline-api',version:'v1'}));

app.post('/api/v1/auth/signup', async (req,res) => {
  try {
    const { name, email, phone, password, avatar='' } = req.body || {};
    if (!name || !email || !password || String(password).length < 8) return res.status(400).json({message:'Name, email and a password of at least 8 characters are required.'});
    const normalizedEmail = String(email).trim().toLowerCase();
    const users = readUsers();
    if (users.some(u => u.email === normalizedEmail)) return res.status(409).json({message:'An account already exists with that email.'});
    const user = { id:id(), name:String(name).trim(), email:normalizedEmail, phone:String(phone || '').trim(), accountNumber:accountNumber(), username:'', avatar:typeof avatar === 'string' ? avatar : '', balance:0, passwordHash:await hashPassword(password), createdAt:new Date().toISOString() };
    user.username = user.accountNumber;
    users.push(user); writeUsers(users);
    const tokens = issueTokens(user);
    res.status(201).json({ user:publicUser(user), ...tokens });
  } catch (e) { console.error(e); res.status(500).json({message:'Unable to create the account.'}); }
});

app.post('/api/v1/auth/login', async (req,res) => {
  try {
    const { email, password } = req.body || {};
    const user = readUsers().find(u => u.email === String(email || '').trim().toLowerCase());
    if (!user || !(await verifyPassword(password || '', user.passwordHash))) return res.status(401).json({message:'Incorrect email or password.'});
    res.json({ user:publicUser(user), ...issueTokens(user) });
  } catch (e) { console.error(e); res.status(500).json({message:'Unable to sign in right now.'}); }
});

app.post('/api/v1/auth/refresh', (req,res) => {
  try {
    const claims = verifyJwt(req.body?.refreshToken);
    if (claims.type !== 'refresh') throw new Error('Invalid refresh token');
    const user = readUsers().find(u => u.id === claims.sub);
    if (!user) return res.status(401).json({message:'Account not found.'});
    res.json({ user:publicUser(user), ...issueTokens(user) });
  } catch { res.status(401).json({message:'Refresh token expired. Please sign in again.'}); }
});

app.post('/api/v1/auth/logout', (_req,res)=>res.json({ok:true}));
app.get('/api/v1/me', requireAuth, (req,res)=>res.json({user:publicUser(req.user)}));
app.get('/api/v1/profile', requireAuth, (req,res)=>res.json({user:publicUser(req.user)}));
app.patch('/api/v1/profile', requireAuth, (req,res)=>{
  const users=readUsers(); const u=users.find(x=>x.id===req.user.id);
  if (typeof req.body?.name === 'string') u.name=req.body.name.trim();
  if (typeof req.body?.phone === 'string') u.phone=req.body.phone.trim();
  if (typeof req.body?.avatar === 'string') u.avatar=req.body.avatar;
  writeUsers(users); res.json({user:publicUser(u)});
});

for (const route of ['/timeline','/timeline/posts','/notifications','/wallet','/transfers/quote','/transfers','/transactions']) {
  app.get('/api/v1'+route, requireAuth, (_req,res)=>res.status(501).json({message:'This SkyLine service is reserved for the secure production backend.'}));
  app.post('/api/v1'+route, requireAuth, (_req,res)=>res.status(501).json({message:'This SkyLine service is reserved for the secure production backend.'}));
  app.patch('/api/v1'+route, requireAuth, (_req,res)=>res.status(501).json({message:'This SkyLine service is reserved for the secure production backend.'}));
}
for (const route of ['/feed/trends','/feed/mutuals','/feed/explore','/marketplace','/crypto/markets']) app.get('/api/v1'+route, requireAuth, (_req,res)=>res.status(501).json({message:'Service not connected yet.'}));
app.post('/api/v1/crypto/orders', requireAuth, (_req,res)=>res.status(501).json({message:'Trading service not connected yet.'}));
app.post('/api/v1/wallet/:action', requireAuth, (_req,res)=>res.status(501).json({message:'Wallet service not connected yet.'}));

app.listen(PORT,()=>console.log(`SkyLine API listening on ${PORT}`));
