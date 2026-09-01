import { createMiddleware } from 'hono/factory';
import { verifyJWT, JWTPayload } from '../lib/jwt.js';

type Variables = { user: JWTPayload };

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Token tidak ditemukan' }, 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = await verifyJWT(token);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized: Token tidak valid atau kadaluarsa' }, 401);
  }
});

export const adminOnly = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: Hanya admin yang dapat mengakses' }, 403);
  }
  await next();
});

export const brandFilter = createMiddleware<{ Variables: Variables & { brandWhere: object } }>(async (c, next) => {
  const user = c.get('user');
  if (user.role === 'BRAND') {
    c.set('brandWhere', { brand: user.brandName });
  } else {
    c.set('brandWhere', {});
  }
  await next();
});
