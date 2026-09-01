import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { signJWT } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

export const authRoutes = new Hono();

// Daftar user hardcoded (sementara, sebelum Supabase Auth diaktifkan)
const USERS = [
  { id: 'u-admin', name: 'Maison Rayyan (Admin)', email: 'admin@konveksys.com', password: 'admin', role: 'ADMIN' as const, brandName: undefined },
  { id: 'u-greywolf', name: 'Bpk. Adit (GREYWOLF)', email: 'greywolf@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'GREYWOLF' },
  { id: 'u-citacita', name: 'Ibu Sarah (CITA-CITA)', email: 'citacita@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'CITA-CITA' },
  { id: 'u-creadive', name: 'Bpk. Dimas (CREADIVE)', email: 'creadive@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'CREADIVE' },
  { id: 'u-jenaka', name: 'Ibu Rina (JENAKA KIDS)', email: 'jenakakids@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'JENAKA KIDS' },
];

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const user = USERS.find((u) => u.email === body.email && u.password === body.password);
  if (!user) {
    return c.json({ error: 'Email atau password salah' }, 401);
  }
  const token = await signJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    brandName: user.brandName,
  });
  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, brandName: user.brandName },
  });
});

// GET /api/auth/me
authRoutes.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// POST /api/auth/logout
authRoutes.post('/logout', (c) => {
  return c.json({ message: 'Logout berhasil' });
});
