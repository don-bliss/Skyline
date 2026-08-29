import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(helmet());
app.use(express.json({limit:'1mb'}));
app.use(cors({origin: process.env.WEB_ORIGIN || false, credentials:true}));
app.use('/api/', rateLimit({windowMs:60_000, limit:120, standardHeaders:true, legacyHeaders:false}));

app.get('/api/v1/health', (_req,res)=>res.json({ok:true,service:'skyline-api',version:'v1'}));
const notConnected = (_req,res)=>res.status(501).json({message:'Backend service not connected. Implement authentication, database and payment-provider adapters before enabling this endpoint.'});
for (const route of ['/me','/profile','/timeline','/timeline/posts','/notifications','/wallet','/transfers/quote','/transfers','/transactions']) {
  app.get('/api/v1'+route, notConnected);
  app.post('/api/v1'+route, notConnected);
  app.patch('/api/v1'+route, notConnected);
}
const port = process.env.PORT || 3000;

app.get('/api/v1/feed/trends', (_,res)=>res.status(501).json({message:'Trends API not connected.'}));
app.get('/api/v1/feed/mutuals', (_,res)=>res.status(501).json({message:'Mutuals API not connected.'}));
app.get('/api/v1/feed/explore', (_,res)=>res.status(501).json({message:'Explore API not connected.'}));
app.get('/api/v1/marketplace', (_,res)=>res.status(501).json({message:'Marketplace API not connected.'}));
app.get('/api/v1/crypto/markets', (_,res)=>res.status(501).json({message:'Crypto market service not connected.'}));
app.post('/api/v1/crypto/orders', (_,res)=>res.status(501).json({message:'Trading service not connected.'}));
app.post('/api/v1/wallet/:action', (_,res)=>res.status(501).json({message:'Wallet service not connected.'}));

app.listen(port,()=>console.log(`SkyLine API listening on ${port}`));
