import { ensureBrandsExist } from './auth.js';
import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const inboundRoutes = new Hono();
inboundRoutes.use('*', authMiddleware);

// GET /api/inbound - List inbound rolls (filtered by brand for BRAND role)
inboundRoutes.get('/', async (c) => {
  const user = c.get('user') as any;
  const queryBrand = c.req.query('brand');

  let where: any = {};
  if (user.role === 'BRAND') {
    const allowed = [
      ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
      ...(user.brandName ? [user.brandName] : []),
    ]
      .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
      .map((b: string) => b.trim().toUpperCase())
      .filter(Boolean);

    if (queryBrand && allowed.includes(queryBrand.toUpperCase())) {
      where = { brand: queryBrand.toUpperCase() };
    } else {
      where = { brand: { in: allowed } };
    }
  } else if (queryBrand && queryBrand !== 'ALL') {
    where = { brand: queryBrand.toUpperCase() };
  }

  const rolls = await prisma.inboundRoll.findMany({
    where,
    orderBy: { tanggalMasuk: 'desc' },
  });
  return c.json(rolls);
});

// POST /api/inbound - Create inbound roll (allowed for both ADMIN and BRAND)
inboundRoutes.post('/', async (c) => {
  const user = c.get('user') as any;
  const body = await c.req.json();

  const allowed = [
    ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
    ...(user.brandName ? [user.brandName] : []),
  ]
    .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
    .map((b: string) => b.trim().toUpperCase())
    .filter(Boolean);

  let brand = body.brand ? String(body.brand).trim().toUpperCase() : undefined;
  if (user.role === 'BRAND') {
    if (brand && allowed.includes(brand)) {
      // Brand valid dari accessibleBrands
    } else {
      brand = allowed[0] || user.brandName || 'UNKNOWN';
    }
  } else {
    brand = brand || 'UNKNOWN';
  }

  // Jaminan relasi tabel Brand: pastikan brand terdaftar agar tidak terjadi foreign key violation
  if (brand && brand !== 'UNKNOWN') {
    await ensureBrandsExist([brand], user.name, user.phone);
  }

  const status = user.role === 'BRAND' ? 'MENUNGGU_FISIK' : (body.status || 'DI_GUDANG');

  const roll = await prisma.inboundRoll.create({
    data: {
      rollCode: body.rollCode.trim().toUpperCase(),
      brand: brand || 'UNKNOWN',
      jenisKain: body.jenisKain,
      meterLength: Number(body.meterLength),
      meterUsed: Number(body.meterUsed || 0),
      hargaModalMeter: Number(body.hargaModalMeter || 0),
      status,
      tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : new Date(),
      keterangan: body.keterangan || null,
    },
  });

  return c.json(roll, 201);
});

// PATCH & PUT /api/inbound/:id/status - Update roll status (Admin only - e.g. Terima Fisik)
const handleStatusUpdate = async (c: any) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();
  const roll = await prisma.inboundRoll.update({ where: { id }, data: { status } });
  return c.json(roll);
};
inboundRoutes.patch('/:id/status', adminOnly, handleStatusUpdate);
inboundRoutes.put('/:id/status', adminOnly, handleStatusUpdate);

// PUT & PATCH /api/inbound/:id - Update roll details (Admin only)
const handleRollUpdate = async (c: any) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const roll = await prisma.inboundRoll.update({
    where: { id },
    data: {
      ...body,
      meterLength: body.meterLength !== undefined ? parseFloat(body.meterLength) : undefined,
      meterUsed: body.meterUsed !== undefined ? parseFloat(body.meterUsed) : undefined,
      hargaModalMeter: body.hargaModalMeter !== undefined ? parseFloat(body.hargaModalMeter) : undefined,
      tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : undefined,
    },
  });
  return c.json(roll);
};
inboundRoutes.put('/:id', adminOnly, handleRollUpdate);
inboundRoutes.patch('/:id', adminOnly, handleRollUpdate);

// DELETE /api/inbound/:id - Delete roll (Admin or Brand if pending)
inboundRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as any;
  const { id } = c.req.param();

  const roll = await prisma.inboundRoll.findUnique({
    where: { id },
    include: { spkRols: { include: { spk: { select: { spkNumber: true } } } } },
  });

  if (!roll) {
    return c.json({ error: 'Rol kain tidak ditemukan' }, 404);
  }

  // If role is BRAND, only allowed to delete if status is MENUNGGU_FISIK and roll belongs to brand
  if (user.role === 'BRAND') {
    const allowed = [
      ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
      ...(user.brandName ? [user.brandName] : []),
    ]
      .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
      .map((b: string) => b.trim().toUpperCase())
      .filter(Boolean);
    if (!allowed.includes(roll.brand.toUpperCase())) {
      return c.json({ error: 'Tidak memiliki hak akses untuk menghapus rol ini' }, 403);
    }
    if (roll.status !== 'MENUNGGU_FISIK') {
      return c.json({ error: 'Kain yang sudah diterima fisik di gudang tidak dapat dihapus oleh Brand' }, 400);
    }
  }

  // If used in SPK
  if (roll.spkRols && roll.spkRols.length > 0) {
    const spkNums = roll.spkRols.map((sr: any) => sr.spk.spkNumber).join(', ');
    return c.json({ error: `Kain tidak dapat dihapus karena sedang digunakan pada ${spkNums}. Hapus SPK terkait terlebih dahulu.` }, 400);
  }

  await prisma.inboundRoll.delete({ where: { id } });
  return c.json({ success: true, message: 'Rol kain berhasil dihapus' });
});
