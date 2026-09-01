import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const vendorRoutes = new Hono();
vendorRoutes.use('*', authMiddleware, adminOnly);

vendorRoutes.get('/', async (c) => {
  const vendors = await prisma.vendor.findMany({
    include: { kasbonList: { select: { jumlah: true, tipe: true } } },
    orderBy: { name: 'asc' }
  });
  return c.json(vendors);
});

vendorRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const vendor = await prisma.vendor.create({ data: body });
  return c.json(vendor, 201);
});

vendorRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const vendor = await prisma.vendor.update({ where: { id }, data: body });
  return c.json(vendor);
});

vendorRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await prisma.vendor.delete({ where: { id } });
  return c.json({ message: 'Vendor dihapus' });
});
