import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const inboundRoutes = new Hono();
inboundRoutes.use('*', authMiddleware);

// GET /api/inbound - List inbound rolls (filtered by brand for BRAND role)
inboundRoutes.get('/', async (c) => {
  const user = c.get('user');
  const where = user.role === 'BRAND' ? { brand: user.brandName } : {};
  const rolls = await prisma.inboundRoll.findMany({
    where,
    orderBy: { tanggalMasuk: 'desc' },
  });
  return c.json(rolls);
});

// POST /api/inbound - Create inbound roll (allowed for both ADMIN and BRAND)
inboundRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  // If role is BRAND, enforce brandName and default status to MENUNGGU_FISIK
  const brand = user.role === 'BRAND' ? user.brandName : (body.brand || 'UNKNOWN');
  const status = user.role === 'BRAND' ? 'MENUNGGU_FISIK' : (body.status || 'DI_GUDANG');

  const roll = await prisma.inboundRoll.create({
    data: {
      rollCode: body.rollCode,
      brand,
      jenisKain: body.jenisKain,
      meterLength: parseFloat(body.meterLength),
      meterUsed: parseFloat(body.meterUsed || '0'),
      hargaModalMeter: parseFloat(body.hargaModalMeter || '0'),
      status,
      tanggalMasuk: new Date(body.tanggalMasuk || new Date()),
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

// DELETE /api/inbound/:id - Delete roll (Admin only)
inboundRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.inboundRoll.delete({ where: { id } });
  return c.json({ message: 'Rol kain dihapus' });
});
