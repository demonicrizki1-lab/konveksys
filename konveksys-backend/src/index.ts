import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { brandRoutes } from './routes/brands.js';
import { vendorRoutes } from './routes/vendors.js';
import { hargaRoutes } from './routes/harga.js';
import { inboundRoutes } from './routes/inbound.js';
import { spkRoutes } from './routes/spk.js';
import { outboundRoutes } from './routes/outbound.js';
import { financeRoutes } from './routes/finance.js';
import { arusKasRoutes } from './routes/arus-kas.js';
import { returnRoutes } from './routes/returns.js';
import { accessoryRoutes } from './routes/accessories.js';

const app = new Hono();

// Middleware global
app.use('*', logger());
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', app: 'KonvekSys API', version: '1.0.0' }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/brands', brandRoutes);
app.route('/api/vendors', vendorRoutes);
app.route('/api/harga', hargaRoutes);
app.route('/api/inbound', inboundRoutes);
app.route('/api/spk', spkRoutes);
app.route('/api/outbound', outboundRoutes);
app.route('/api/returns', returnRoutes);
app.route('/api/accessories', accessoryRoutes);
app.route('/api/finance', financeRoutes);
app.route('/api/arus-kas', arusKasRoutes);

// 404
app.notFound((c) => c.json({ error: 'Endpoint tidak ditemukan' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('[ERROR]', err);
  return c.json({ error: 'Terjadi kesalahan server', detail: err.message }, 500);
});

const port = parseInt(process.env.PORT || '3001');
console.log('KonvekSys API berjalan di http://localhost:' + port);

serve({ fetch: app.fetch, port });