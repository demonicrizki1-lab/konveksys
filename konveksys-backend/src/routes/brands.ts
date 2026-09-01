import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const brandRoutes = new Hono();
brandRoutes.use('*', authMiddleware);

brandRoutes.get('/', async (c) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  return c.json(brands);
});

brandRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();
  const brand = await prisma.brand.create({ data: body });
  return c.json(brand, 201);
});

brandRoutes.put('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const brand = await prisma.brand.update({ where: { id }, data: body });
  return c.json(brand);
});

brandRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.brand.delete({ where: { id } });
  return c.json({ message: 'Brand dihapus' });
});
