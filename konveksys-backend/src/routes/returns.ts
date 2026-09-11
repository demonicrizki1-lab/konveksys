import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const returnRoutes = new Hono();
returnRoutes.use('*', authMiddleware);

// GET /api/returns - List all returns (filtered for BRAND)
returnRoutes.get('/', async (c) => {
  const user = c.get('user');
  const queryBrand = c.req.query('brand');

  let where: any = {};
  if (user.role === 'BRAND') {
    const allowed = Array.isArray(user.accessibleBrands) && user.accessibleBrands.length > 0
      ? user.accessibleBrands.map((b: string) => b.trim().toUpperCase())
      : (user.brandName ? [user.brandName.trim().toUpperCase()] : []);

    if (queryBrand && allowed.includes(queryBrand.toUpperCase())) {
      where = { brand: queryBrand.toUpperCase() };
    } else {
      where = { brand: { in: allowed } };
    }
  } else if (queryBrand && queryBrand !== 'ALL') {
    where = { brand: queryBrand.toUpperCase() };
  }

  const list = await prisma.returnItem.findMany({
    where,
    include: {
      spk: { select: { spkNumber: true } },
      suratJalan: { select: { noSuratJalan: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(list);
});

// POST /api/returns - Create new return ticket
returnRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  // If role is BRAND, enforce brandName
  let brand = body.brand ? String(body.brand).trim().toUpperCase() : undefined;
  if (user.role === 'BRAND') {
    const allowed = Array.isArray(user.accessibleBrands) && user.accessibleBrands.length > 0
      ? user.accessibleBrands.map((b: string) => b.trim().toUpperCase())
      : (user.brandName ? [user.brandName.trim().toUpperCase()] : []);
    if (brand && allowed.includes(brand)) {
      // valid
    } else {
      brand = user.brandName || allowed[0] || 'UNKNOWN';
    }
  } else {
    brand = brand || 'UNKNOWN';
  }

  const totalPcs =
    (body.qtyS || 0) +
    (body.qtyM || 0) +
    (body.qtyL || 0) +
    (body.qtyXL || 0) +
    (body.qtyXXL || 0) +
    (body.qtyAnak4 || 0) +
    (body.qtyAnak6 || 0) +
    (body.qtyAnak8 || 0) +
    (body.qtyAnak10 || 0) +
    (body.qtyAnak12 || 0) +
    (body.qtyAnak14 || 0) +
    (body.qtyAnak16 || 0);

  if (totalPcs <= 0) {
    return c.json({ error: 'Jumlah barang retur harus lebih dari 0 pcs' }, 400);
  }

  // Auto-generate No Retur if not provided: RET-YYYYMM-XXX
  let noRetur = body.noRetur;
  if (!noRetur) {
    const today = new Date();
    const prefix = `RET-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await prisma.returnItem.count({
      where: { noRetur: { startsWith: prefix } },
    });
    noRetur = `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }

  const created = await prisma.returnItem.create({
    data: {
      noRetur,
      sumber: body.sumber || (user.role === 'BRAND' ? 'BRAND_COMPLAINT' : 'INTERNAL_QC'),
      spkId: body.spkId || null,
      suratJalanId: body.suratJalanId || null,
      brand,
      produk: body.produk,
      vendor: body.vendor,
      tanggalRetur: new Date(body.tanggalRetur || new Date()),
      alasanCacat: body.alasanCacat,
      kategoriCacat: body.kategoriCacat || 'JAHITAN',
      catatan: body.catatan || null,
      status: body.status || 'DIAJUKAN',
      qtyS: body.qtyS || 0,
      qtyM: body.qtyM || 0,
      qtyL: body.qtyL || 0,
      qtyXL: body.qtyXL || 0,
      qtyXXL: body.qtyXXL || 0,
      qtyAnak4: body.qtyAnak4 || 0,
      qtyAnak6: body.qtyAnak6 || 0,
      qtyAnak8: body.qtyAnak8 || 0,
      qtyAnak10: body.qtyAnak10 || 0,
      qtyAnak12: body.qtyAnak12 || 0,
      qtyAnak14: body.qtyAnak14 || 0,
      qtyAnak16: body.qtyAnak16 || 0,
      totalPcs,
      qtyReworked: 0,
      qtyRejectTotal: 0,
    },
    include: {
      spk: { select: { spkNumber: true } },
      suratJalan: { select: { noSuratJalan: true } },
    },
  });

  return c.json(created, 201);
});

// PATCH /api/returns/:id/status - Update status & rework quantities
returnRoutes.patch('/:id/status', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { status, qtyReworked, qtyRejectTotal, catatan } = body;

  const existing = await prisma.returnItem.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: 'Data retur tidak ditemukan' }, 404);
  }

  const dataToUpdate: any = { status };

  if (catatan !== undefined) {
    dataToUpdate.catatan = catatan;
  }

  if (status === 'SELESAI_REWORK' || status === 'REJECT_TOTAL') {
    dataToUpdate.tanggalSelesai = new Date();
    if (qtyReworked !== undefined) dataToUpdate.qtyReworked = Number(qtyReworked);
    if (qtyRejectTotal !== undefined) dataToUpdate.qtyRejectTotal = Number(qtyRejectTotal);
  }

  const updated = await prisma.returnItem.update({
    where: { id },
    data: dataToUpdate,
    include: {
      spk: { select: { spkNumber: true } },
      suratJalan: { select: { noSuratJalan: true } },
    },
  });

  return c.json(updated);
});

// GET /api/returns/:id - Single return detail
returnRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const item = await prisma.returnItem.findUnique({
    where: { id },
    include: {
      spk: true,
      suratJalan: true,
    },
  });
  if (!item) return c.json({ error: 'Data retur tidak ditemukan' }, 404);
  return c.json(item);
});

// DELETE /api/returns/:id - Delete return (Admin only)
returnRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.returnItem.delete({ where: { id } });
  return c.json({ success: true, message: 'Data retur berhasil dihapus' });
});