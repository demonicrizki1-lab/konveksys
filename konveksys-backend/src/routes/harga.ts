import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const hargaRoutes = new Hono();
hargaRoutes.use('*', authMiddleware);

// Harga Konveksi (Ongkos Jahit Vendor)
hargaRoutes.get('/konveksi', adminOnly, async (c) => {
  const data = await prisma.hargaKonveksi.findMany({ orderBy: [{ vendor: 'asc' }, { brand: 'asc' }] });
  return c.json(data);
});
hargaRoutes.post('/konveksi', adminOnly, async (c) => {
  const body = await c.req.json();
  const data = await prisma.hargaKonveksi.create({ data: { ...body, harga: parseFloat(body.harga) } });
  return c.json(data, 201);
});
hargaRoutes.put('/konveksi/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = await prisma.hargaKonveksi.update({ where: { id }, data: { ...body, harga: parseFloat(body.harga) } });
  return c.json(data);
});
hargaRoutes.delete('/konveksi/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.hargaKonveksi.delete({ where: { id } });
  return c.json({ message: 'Harga konveksi dihapus' });
});

// Harga Buyer (Invoice per Brand)
hargaRoutes.get('/buyer', async (c) => {
  const user = c.get('user');
  let where: any = {};
  if (user.role === 'BRAND') {
    const allowed = [
      ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
      ...(user.brandName ? [user.brandName] : []),
    ]
      .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
      .map((b: string) => b.trim().toUpperCase())
      .filter(Boolean);
    where = { brand: { in: allowed } };
  }
  const data = await prisma.hargaBuyer.findMany({ where, orderBy: [{ brand: 'asc' }, { produk: 'asc' }] });
  return c.json(data);
});
hargaRoutes.post('/buyer', adminOnly, async (c) => {
  const body = await c.req.json();
  const data = await prisma.hargaBuyer.create({ data: body });
  return c.json(data, 201);
});
hargaRoutes.put('/buyer/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const data = await prisma.hargaBuyer.update({ where: { id }, data: body });
  return c.json(data);
});
hargaRoutes.delete('/buyer/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.hargaBuyer.delete({ where: { id } });
  return c.json({ message: 'Harga buyer dihapus' });
});
