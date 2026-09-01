import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const inboundRoutes = new Hono();
inboundRoutes.use('*', authMiddleware);

inboundRoutes.get('/', async (c) => {
  const user = c.get('user');
  const where = user.role === 'BRAND' ? { brand: user.brandName } : {};
  const rolls = await prisma.inboundRoll.findMany({
    where,
    orderBy: { tanggalMasuk: 'desc' },
  });
  return c.json(rolls);
});

inboundRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();
  const roll = await prisma.inboundRoll.create({
    data: {
      ...body,
      meterLength: parseFloat(body.meterLength),
      meterUsed: parseFloat(body.meterUsed || '0'),
      hargaModalMeter: parseFloat(body.hargaModalMeter),
      tanggalMasuk: new Date(body.tanggalMasuk),
    },
  });
  return c.json(roll, 201);
});

inboundRoutes.put('/:id/status', adminOnly, async (c) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();
  const roll = await prisma.inboundRoll.update({ where: { id }, data: { status } });
  return c.json(roll);
});

inboundRoutes.put('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const roll = await prisma.inboundRoll.update({
    where: { id },
    data: {
      ...body,
      meterLength: body.meterLength ? parseFloat(body.meterLength) : undefined,
      meterUsed: body.meterUsed !== undefined ? parseFloat(body.meterUsed) : undefined,
      hargaModalMeter: body.hargaModalMeter ? parseFloat(body.hargaModalMeter) : undefined,
      tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : undefined,
    },
  });
  return c.json(roll);
});

inboundRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.inboundRoll.delete({ where: { id } });
  return c.json({ message: 'Rol kain dihapus' });
});
