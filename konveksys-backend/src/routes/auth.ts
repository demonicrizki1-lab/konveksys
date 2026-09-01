import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { signJWT } from '../lib/jwt.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const authRoutes = new Hono();

// Daftar fallback user preset
const DEMO_USERS = [
  { id: 'u-admin', name: 'Maison Rayyan (Admin)', email: 'admin@konveksys.com', password: 'admin', role: 'ADMIN' as const, brandName: undefined, accessibleBrands: [] },
  { id: 'u-greywolf', name: 'Bpk. Adit (GREYWOLF)', email: 'greywolf@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'GREYWOLF', accessibleBrands: ['GREYWOLF'] },
  { id: 'u-citacita', name: 'Ibu Sarah (CITA-CITA)', email: 'citacita@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'CITA-CITA', accessibleBrands: ['CITA-CITA'] },
  { id: 'u-creadive', name: 'Bpk. Dimas (CREADIVE)', email: 'creadive@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'CREADIVE', accessibleBrands: ['CREADIVE'] },
  { id: 'u-jenaka', name: 'Ibu Rina (JENAKA KIDS)', email: 'jenakakids@brand.com', password: 'brand', role: 'BRAND' as const, brandName: 'JENAKA KIDS', accessibleBrands: ['JENAKA KIDS'] },
];

// POST /api/auth/register-brand (Publik)
authRoutes.post('/register-brand', async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      email: string;
      password: string;
      phone?: string;
      brands: string[]; // List brand yang diajukan (misal: ['CITA-CITA', 'GREYWOLF'])
    }>();

    if (!body.email || !body.password || !body.name) {
      return c.json({ error: 'Nama, email, dan kata sandi wajib diisi.' }, 400);
    }

    // Normalisasi email
    const emailClean = body.email.toLowerCase().trim();

    // Cek apakah user sudah terdaftar
    const existing = await prisma.user.findUnique({ where: { email: emailClean } });
    if (existing) {
      return c.json({ error: 'Alamat email sudah terdaftar di sistem.' }, 400);
    }

    const brandList = Array.isArray(body.brands) && body.brands.length > 0
      ? body.brands.map(b => b.trim().toUpperCase()).filter(Boolean)
      : ['UNASSIGNED'];

    const newUser = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: emailClean,
        password: body.password,
        phone: body.phone?.trim() || null,
        role: 'BRAND',
        status: 'PENDING_APPROVAL',
        accessibleBrands: brandList,
        brandName: brandList[0] || null,
      }
    });

    return c.json({
      success: true,
      message: 'Pendaftaran kemitraan berhasil dikirim! Akun Anda sedang menunggu persetujuan Admin Maison Rayyan.',
      userId: newUser.id,
    }, 201);
  } catch (err: any) {
    console.error('Error in /register-brand:', err);
    return c.json({ error: 'Gagal memproses pendaftaran: ' + (err?.message || 'Server error') }, 500);
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json<{ email: string; password: string }>();
    const emailClean = body.email.toLowerCase().trim();

    // 1. Cari di Database PostgreSQL
    let user = await prisma.user.findUnique({ where: { email: emailClean } });

    // 2. Fallback jika ada di DEMO_USERS dan belum di database
    if (!user) {
      const demo = DEMO_USERS.find(u => u.email.toLowerCase() === emailClean);
      if (demo && demo.password === body.password) {
        user = await prisma.user.upsert({
          where: { email: emailClean },
          update: {},
          create: {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            password: demo.password,
            role: demo.role,
            status: 'ACTIVE',
            accessibleBrands: demo.accessibleBrands,
            brandName: demo.brandName || null,
          }
        });
      }
    }

    if (!user || user.password !== body.password) {
      return c.json({ error: 'Email atau kata sandi tidak sesuai.' }, 401);
    }

    // Cek Status Akun
    if (user.status === 'PENDING_APPROVAL') {
      return c.json({
        error: 'Akun Anda sedang dalam proses verifikasi oleh Admin Maison Rayyan. Mohon menunggu persetujuan.',
        status: 'PENDING_APPROVAL'
      }, 403);
    }

    if (user.status === 'REJECTED') {
      return c.json({
        error: 'Pengajuan akun kemitraan ditolak oleh Admin. Silakan hubungi Maison Rayyan untuk info lebih lanjut.',
        status: 'REJECTED'
      }, 403);
    }

    // Generate JWT Token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      brandName: user.brandName || undefined,
      accessibleBrands: user.accessibleBrands || [],
    });

    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        brandName: user.brandName,
        accessibleBrands: user.accessibleBrands || [],
      },
    });
  } catch (err: any) {
    console.error('Error in /login:', err);
    return c.json({ error: 'Gagal memproses login: ' + (err?.message || 'Server error') }, 500);
  }
});

// GET /api/auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const tokenPayload = c.get('user');
  try {
    const userInDb = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, brandName: true, accessibleBrands: true, status: true }
    });
    if (userInDb) {
      return c.json({ user: userInDb });
    }
  } catch (err) {
    console.error('Error in /me:', err);
  }
  return c.json({ user: tokenPayload });
});

// GET /api/auth/pending-brands (Admin Only)
authRoutes.get('/pending-brands', authMiddleware, adminOnly, async (c) => {
  try {
    const pendingList = await prisma.user.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        accessibleBrands: true,
        brandName: true,
        createdAt: true,
      }
    });
    return c.json({ pending: pendingList });
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil antrean persetujuan: ' + err?.message }, 500);
  }
});

// POST /api/auth/approve-brand/:id (Admin Only)
authRoutes.post('/approve-brand/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json<{ accessibleBrands?: string[]; brandName?: string }>();

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return c.json({ error: 'Pengguna tidak ditemukan.' }, 404);
    }

    const brandsToAssign = body.accessibleBrands && body.accessibleBrands.length > 0
      ? body.accessibleBrands.map(b => b.trim().toUpperCase())
      : existing.accessibleBrands;

    const activeBrandName = body.brandName || brandsToAssign[0] || existing.brandName;

    // Pastikan brand-brand ini ada di tabel Brand jika belum
    for (const bName of brandsToAssign) {
      if (bName && bName !== 'UNASSIGNED') {
        const foundBrand = await prisma.brand.findUnique({ where: { name: bName } });
        if (!foundBrand) {
          const code = bName.substring(0, 3).toUpperCase();
          await prisma.brand.create({
            data: {
              name: bName,
              code: code + '-' + Math.floor(100 + Math.random() * 900),
              contactPerson: existing.name,
              phone: existing.phone,
            }
          }).catch(() => {});
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        accessibleBrands: brandsToAssign,
        brandName: activeBrandName,
      },
      select: { id: true, name: true, email: true, status: true, accessibleBrands: true, brandName: true }
    });

    return c.json({
      success: true,
      message: `Akun mitra ${updated.name} berhasil disetujui & diaktifkan!`,
      user: updated,
    });
  } catch (err: any) {
    return c.json({ error: 'Gagal menyetujui akun: ' + err?.message }, 500);
  }
});

// POST /api/auth/reject-brand/:id (Admin Only)
authRoutes.post('/reject-brand/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const userId = c.req.param('id');
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'REJECTED' }
    });
    return c.json({ success: true, message: 'Pendaftaran brand berhasil ditolak.' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menolak akun: ' + err?.message }, 500);
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', (c) => {
  return c.json({ message: 'Logout berhasil' });
});

