import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const outboundRoutes = new Hono();
outboundRoutes.use('*', authMiddleware);

outboundRoutes.get('/', async (c) => {
  const user = c.get('user');
  const where = user.role === 'BRAND' ? { brand: user.brandName } : {};
  const list = await prisma.suratJalan.findMany({
    where,
    include: { spk: { select: { spkNumber: true, vendor: true } } },
    orderBy: { tanggal: 'desc' },
  });
  return c.json(list);
});

outboundRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();
  const totalPcs =
    (body.qtySML || 0) + (body.qtyM || 0) + (body.qtyL || 0) +
    (body.qtyXL || 0) + (body.qtyXXL || 0) +
    (body.qtyAnak4_10 || 0) + (body.qtyAnak12_16 || 0);

  const sj = await prisma.suratJalan.create({
    data: { ...body, tanggal: new Date(body.tanggal), totalPcs },
  });

  // Update delivered qty di SPK (bisa melebihi target cut / over-delivery)
  const updatedSpk = await prisma.spkCutting.update({
    where: { id: body.spkId },
    data: {
      deliveredS: { increment: body.qtySML || 0 },
      deliveredM: { increment: body.qtyM || 0 },
      deliveredL: { increment: body.qtyL || 0 },
      deliveredXL: { increment: body.qtyXL || 0 },
      deliveredXXL: { increment: body.qtyXXL || 0 },
      deliveredAnak4_10: { increment: body.qtyAnak4_10 || 0 },
      deliveredAnak12_16: { increment: body.qtyAnak12_16 || 0 },
    },
  });

  // Hitung status: OVER_DELIVERY jika terkirim > target, COMPLETED jika pas, PARTIAL jika kurang
  const targetTotal =
    (updatedSpk.targetS || 0) + (updatedSpk.targetM || 0) + (updatedSpk.targetL || 0) +
    (updatedSpk.targetXL || 0) + (updatedSpk.targetXXL || 0) +
    (updatedSpk.targetAnak4_10 || 0) + (updatedSpk.targetAnak12_16 || 0);

  const deliveredTotal =
    (updatedSpk.deliveredS || 0) + (updatedSpk.deliveredM || 0) + (updatedSpk.deliveredL || 0) +
    (updatedSpk.deliveredXL || 0) + (updatedSpk.deliveredXXL || 0) +
    (updatedSpk.deliveredAnak4_10 || 0) + (updatedSpk.deliveredAnak12_16 || 0);

  const newStatus =
    targetTotal > 0 && deliveredTotal > targetTotal
      ? 'OVER_DELIVERY'
      : targetTotal > 0 && deliveredTotal === targetTotal
      ? 'COMPLETED'
      : deliveredTotal > 0
      ? 'PARTIAL_DELIVERED'
      : updatedSpk.status;

  if (newStatus !== updatedSpk.status) {
    await prisma.spkCutting.update({
      where: { id: updatedSpk.id },
      data: { status: newStatus },
    });
  }

  return c.json(sj, 201);
});

outboundRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const sj = await prisma.suratJalan.findUnique({
    where: { id },
    include: { spk: true },
  });
  if (!sj) return c.json({ error: 'Surat jalan tidak ditemukan' }, 404);
  return c.json(sj);
});
