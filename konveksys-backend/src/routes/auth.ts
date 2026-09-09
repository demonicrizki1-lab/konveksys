import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { signJWT } from '../lib/jwt.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const authRoutes = new Hono();

// Daftar fallback user preset
const DEMO_USERS = [
  { id: 'u-admin', name: 'Admin Maison Rayyan', email: 'admin@konveksys.com', password: 'admin', role: 'ADMIN' as const, brandName: undefined, accessibleBrands: [] },
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
        error: 'Akun kemitraan ditolak atau dinonaktifkan oleh Admin. Silakan hubungi Maison Rayyan untuk info lebih lanjut.',
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

// ============================================================
// USER MANAGEMENT ENDPOINTS (Admin Only)
// ============================================================

// GET /api/auth/users - List all users
authRoutes.get('/users', authMiddleware, adminOnly, async (c) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        brandName: true,
        accessibleBrands: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return c.json(users);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data pengguna: ' + err?.message }, 500);
  }
});

// POST /api/auth/users - Create user directly by Admin
authRoutes.post('/users', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      email: string;
      password: string;
      phone?: string;
      role?: 'ADMIN' | 'BRAND';
      status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED';
      brandName?: string;
      accessibleBrands?: string[];
    }>();

    if (!body.name || !body.email || !body.password) {
      return c.json({ error: 'Nama, email, dan kata sandi wajib diisi.' }, 400);
    }

    const emailClean = body.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: emailClean } });
    if (existing) {
      return c.json({ error: 'Alamat email sudah terdaftar.' }, 400);
    }

    const accessible = Array.isArray(body.accessibleBrands) && body.accessibleBrands.length > 0
      ? body.accessibleBrands.map(b => b.trim().toUpperCase())
      : body.brandName ? [body.brandName.trim().toUpperCase()] : [];

    const activeBrand = body.brandName ? body.brandName.trim().toUpperCase() : accessible[0] || null;

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: emailClean,
        password: body.password,
        phone: body.phone?.trim() || null,
        role: body.role || 'BRAND',
        status: (body.status === 'SUSPENDED' ? 'REJECTED' : body.status || 'ACTIVE') as any,
        brandName: activeBrand,
        accessibleBrands: accessible,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        brandName: true,
        accessibleBrands: true,
        createdAt: true,
      },
    });

    return c.json({ success: true, message: 'Pengguna berhasil dibuat.', user }, 201);
  } catch (err: any) {
    return c.json({ error: 'Gagal membuat pengguna: ' + err?.message }, 500);
  }
});

// PUT /api/auth/users/:id - Update user (Ganti Brand, Status, Profil, Password)
authRoutes.put('/users/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json<{
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: 'ADMIN' | 'BRAND';
      status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REJECTED';
      brandName?: string;
      accessibleBrands?: string[];
    }>();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Pengguna tidak ditemukan.' }, 404);
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.password && body.password.trim().length > 0) updateData.password = body.password.trim();
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = (body.status === 'SUSPENDED' ? 'REJECTED' : body.status) as any;

    if (body.accessibleBrands !== undefined) {
      updateData.accessibleBrands = body.accessibleBrands.map(b => b.trim().toUpperCase());
    }
    if (body.brandName !== undefined) {
      updateData.brandName = body.brandName ? body.brandName.trim().toUpperCase() : null;
    }

    // Pastikan brandName tercakup dalam accessibleBrands jika brandName diset
    if (updateData.brandName && updateData.accessibleBrands && !updateData.accessibleBrands.includes(updateData.brandName)) {
      updateData.accessibleBrands.push(updateData.brandName);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        brandName: true,
        accessibleBrands: true,
        updatedAt: true,
      },
    });

    return c.json({ success: true, message: 'Data pengguna berhasil diperbarui.', user: updated });
  } catch (err: any) {
    return c.json({ error: 'Gagal memperbarui data pengguna: ' + err?.message }, 500);
  }
});

// DELETE /api/auth/users/:id - Delete user
authRoutes.delete('/users/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const { id } = c.req.param();
    const tokenUser = c.get('user');

    if (tokenUser.userId === id) {
      return c.json({ error: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' }, 400);
    }

    await prisma.user.delete({ where: { id } });
    return c.json({ success: true, message: 'Pengguna berhasil dihapus dari sistem.' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus pengguna: ' + err?.message }, 500);
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', (c) => {
  return c.json({ message: 'Logout berhasil' });
});
