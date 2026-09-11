import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const arusKasRoutes = new Hono();
arusKasRoutes.use('*', authMiddleware);

arusKasRoutes.get('/', async (c) => {
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
  const list = await prisma.pembayaranBrand.findMany({ where, orderBy: { tanggal: 'desc' } });
  return c.json(list);
});

arusKasRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const brands = await prisma.brand.findMany({
    where: user.role === 'BRAND' ? {
      name: {
        in: Array.isArray(user.accessibleBrands) && user.accessibleBrands.length > 0
          ? user.accessibleBrands.map((b: string) => b.trim().toUpperCase())
          : (user.brandName ? [user.brandName.trim().toUpperCase()] : []),
      }
    } : {},
  });
  const summary = await Promise.all(brands.map(async (brand) => {
    const invoice = await prisma.suratJalan.aggregate({
      where: { brand: brand.name },
      _sum: { totalPcs: true },
    });
    const pembayaran = await prisma.pembayaranBrand.aggregate({
      where: { brand: brand.name },
      _sum: { jumlah: true },
    });
    const totalTerbayar = Number(pembayaran._sum.jumlah || 0);
    return { brand: brand.name, totalTerbayar, totalPcsKirim: invoice._sum.totalPcs || 0 };
  }));
  return c.json(summary);
});

arusKasRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();
  const data = await prisma.pembayaranBrand.create({
    data: { ...body, jumlah: parseFloat(body.jumlah), tanggal: new Date(body.tanggal) },
  });
  return c.json(data, 201);
});

arusKasRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.pembayaranBrand.delete({ where: { id } });
  return c.json({ message: 'Pembayaran dihapus' });
});
