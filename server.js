import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const PORT = process.env.PORT || 3000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'https://don-bliss.github.io';
const DATABASE_URL = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.SKYLINE_JWT_SECRET || '';
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('SKYLINE_JWT_SECRET must be set to a random value of at least 32 characters.');
}
if (!JWT_SECRET) console.warn('Development only: SKYLINE_JWT_SECRET is not set.');
if (isProduction && !DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production. Connect this service to a Render Postgres database.');
}

fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })
  : null;

const app = express();

// Render runs this service behind a reverse proxy. Trust the first proxy hop so
// express-rate-limit can safely read the forwarded client address.
app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '4mb' }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = WEB_ORIGIN.split(',').map(v => v.trim()).filter(Boolean);
    if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: false
}));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

const id = () => crypto.randomUUID();
const localReadUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]');
const localWriteUsers = users => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

const hashPassword = async password => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, d) => e ? reject(e) : resolve(d.toString('hex'))));
  return `${salt}:${hash}`;
};
const verifyPassword = async (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const derived = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (e, d) => e ? reject(e) : resolve(d.toString('hex'))));
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(derived, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const b64u = value => Buffer.from(value).toString('base64url');
const signJwt = (payload, ttlSeconds = 3600) => {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const data = `${head}.${b64u(JSON.stringify(body))}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET || 'development-only-secret').update(data).digest('base64url');
  return `${data}.${sig}`;
};
const verifyJwt = token => {
  const [head, body, sig] = String(token || '').split('.');
  if (!head || !body || !sig) throw new Error('Invalid token');
  const data = `${head}.${body}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET || 'development-only-secret').update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
};

const publicUser = u => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  accountNumber: u.accountNumber,
  username: u.username,
  avatar: u.avatar || '',
  balance: Number(u.balance || 0),
  createdAt: u.createdAt
});
const issueTokens = user => ({
  accessToken: signJwt({ sub: user.id, type: 'access' }, 60 * 60),
  refreshToken: signJwt({ sub: user.id, type: 'refresh', nonce: id() }, 60 * 60 * 24 * 30)
});

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skyline_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      account_number TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '',
      balance NUMERIC(20,2) NOT NULL DEFAULT 0,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // One-time migration for any users created by the previous JSON backend.
  const localUsers = localReadUsers();
  if (localUsers.length) {
    for (const u of localUsers) {
      await pool.query(`
        INSERT INTO skyline_users
          (id,name,email,phone,account_number,username,avatar,balance,password_hash,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (email) DO NOTHING
      `, [u.id || id(), u.name || 'SkyLine User', String(u.email || '').toLowerCase(), u.phone || '', u.accountNumber || await generateAccountNumber(), u.username || u.accountNumber || '', u.avatar || '', Number(u.balance || 0), u.passwordHash || '', u.createdAt || new Date().toISOString()]);
    }
  }
}

async function generateAccountNumber() {
  for (;;) {
    const n = String(Math.floor(1000000000 + Math.random() * 9000000000));
    if (pool) {
      const result = await pool.query('SELECT 1 FROM skyline_users WHERE account_number=$1 LIMIT 1', [n]);
      if (!result.rowCount) return n;
    } else if (!localReadUsers().some(u => u.accountNumber === n)) return n;
  }
}

async function findUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!pool) return localReadUsers().find(u => u.email === normalized) || null;
  const { rows } = await pool.query('SELECT * FROM skyline_users WHERE email=$1 LIMIT 1', [normalized]);
  return rows[0] ? dbUser(rows[0]) : null;
}
async function findUserById(userId) {
  if (!pool) return localReadUsers().find(u => u.id === userId) || null;
  const { rows } = await pool.query('SELECT * FROM skyline_users WHERE id=$1 LIMIT 1', [userId]);
  return rows[0] ? dbUser(rows[0]) : null;
}
function dbUser(row) {
  return {
    id: row.id, name: row.name, email: row.email, phone: row.phone,
    accountNumber: row.account_number, username: row.username, avatar: row.avatar,
    balance: Number(row.balance || 0), passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString()
  };
}
async function insertUser(user) {
  if (!pool) {
    const users = localReadUsers();
    users.push(user);
    localWriteUsers(users);
    return;
  }
  await pool.query(`
    INSERT INTO skyline_users
      (id,name,email,phone,account_number,username,avatar,balance,password_hash,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `, [user.id,user.name,user.email,user.phone,user.accountNumber,user.username,user.avatar,Number(user.balance || 0),user.passwordHash,user.createdAt]);
}
async function updateUser(user) {
  if (!pool) {
    const users = localReadUsers();
    const index = users.findIndex(x => x.id === user.id);
    if (index >= 0) users[index] = user;
    localWriteUsers(users);
    return;
  }
  await pool.query(`UPDATE skyline_users SET name=$1, phone=$2, avatar=$3 WHERE id=$4`, [user.name,user.phone,user.avatar,user.id]);
}

const requireAuth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const claims = verifyJwt(token);
    if (claims.type !== 'access') throw new Error('Invalid access token');
    const user = await findUserById(claims.sub);
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your SkyLine session has expired. Please sign in again.' });
  }
};

app.get('/', (_req, res) => res.json({ ok: true, service: 'skyline-api', message: 'SkyLine API is live. Use /api/v1/health for health checks.' }));
app.get('/api/v1/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'skyline-api', version: 'v1', database: 'postgres' });
  } catch (e) {
    console.error('Health check failed:', e.message);
    res.status(503).json({ ok: false, message: 'Database unavailable.' });
  }
});

app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password, avatar = '' } = req.body || {};
    if (!name || !email || !password || String(password).length < 8) return res.status(400).json({ message: 'Name, email and a password of at least 8 characters are required.' });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await findUserByEmail(normalizedEmail)) return res.status(409).json({ message: 'An account already exists with that email.' });
    const acc = await generateAccountNumber();
    const user = {
      id: id(), name: String(name).trim(), email: normalizedEmail, phone: String(phone || '').trim(),
      accountNumber: acc, username: acc, avatar: typeof avatar === 'string' ? avatar : '',
      balance: 0, passwordHash: await hashPassword(password), createdAt: new Date().toISOString()
    };
    await insertUser(user);
    res.status(201).json({ user: publicUser(user), ...issueTokens(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Unable to create the account.' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password || '', user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ user: publicUser(user), ...issueTokens(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Unable to sign in right now.' });
  }
});

app.post('/api/v1/auth/refresh', async (req, res) => {
  try {
    const claims = verifyJwt(req.body?.refreshToken);
    if (claims.type !== 'refresh') throw new Error('Invalid refresh token');
    const user = await findUserById(claims.sub);
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    res.json({ user: publicUser(user), ...issueTokens(user) });
  } catch {
    res.status(401).json({ message: 'Refresh token expired. Please sign in again.' });
  }
});

app.post('/api/v1/auth/logout', (_req, res) => res.json({ ok: true }));
app.get('/api/v1/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.get('/api/v1/profile', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.patch('/api/v1/profile', requireAuth, async (req, res) => {
  try {
    if (typeof req.body?.name === 'string') req.user.name = req.body.name.trim();
    if (typeof req.body?.phone === 'string') req.user.phone = req.body.phone.trim();
    if (typeof req.body?.avatar === 'string') req.user.avatar = req.body.avatar;
    await updateUser(req.user);
    res.json({ user: publicUser(req.user) });
  } catch {
    res.status(500).json({ message: 'Unable to update profile.' });
  }
});

for (const route of ['/timeline','/timeline/posts','/notifications','/wallet','/transfers/quote','/transfers','/transactions']) {
  app.get('/api/v1' + route, requireAuth, (_req, res) => res.status(501).json({ message: 'This SkyLine service is reserved for the secure production backend.' }));
  app.post('/api/v1' + route, requireAuth, (_req, res) => res.status(501).json({ message: 'This SkyLine service is reserved for the secure production backend.' }));
  app.patch('/api/v1' + route, requireAuth, (_req, res) => res.status(501).json({ message: 'This SkyLine service is reserved for the secure production backend.' }));
}
for (const route of ['/feed/trends','/feed/mutuals','/feed/explore','/marketplace','/crypto/markets']) app.get('/api/v1' + route, requireAuth, (_req, res) => res.status(501).json({ message: 'Service not connected yet.' }));
app.post('/api/v1/crypto/orders', requireAuth, (_req, res) => res.status(501).json({ message: 'Trading service not connected yet.' }));
app.post('/api/v1/wallet/:action', requireAuth, (_req, res) => res.status(501).json({ message: 'Wallet service not connected yet.' }));

async function start() {
  if (pool) await initDb();
  app.listen(PORT, () => console.log(`SkyLine API listening on ${PORT} (PostgreSQL)`));
}
start().catch(err => { console.error('SkyLine API startup failed:', err); process.exit(1); });
