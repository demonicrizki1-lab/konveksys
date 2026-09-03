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
    (body.qtyAnak4 || 0) + (body.qtyAnak6 || 0) + (body.qtyAnak8 || 0) +
    (body.qtyAnak10 || 0) + (body.qtyAnak12 || 0) + (body.qtyAnak14 || 0) + (body.qtyAnak16 || 0);

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
      deliveredAnak4: { increment: body.qtyAnak4 || 0 },
      deliveredAnak6: { increment: body.qtyAnak6 || 0 },
      deliveredAnak8: { increment: body.qtyAnak8 || 0 },
      deliveredAnak10: { increment: body.qtyAnak10 || 0 },
      deliveredAnak12: { increment: body.qtyAnak12 || 0 },
      deliveredAnak14: { increment: body.qtyAnak14 || 0 },
      deliveredAnak16: { increment: body.qtyAnak16 || 0 },
    },
  });

  // Hitung status: OVER_DELIVERY jika terkirim > target, COMPLETED jika pas, PARTIAL jika kurang
  const targetTotal =
    (updatedSpk.targetS || 0) + (updatedSpk.targetM || 0) + (updatedSpk.targetL || 0) +
    (updatedSpk.targetXL || 0) + (updatedSpk.targetXXL || 0) +
    (updatedSpk.targetAnak4 || 0) + (updatedSpk.targetAnak6 || 0) + (updatedSpk.targetAnak8 || 0) +
    (updatedSpk.targetAnak10 || 0) + (updatedSpk.targetAnak12 || 0) + (updatedSpk.targetAnak14 || 0) + (updatedSpk.targetAnak16 || 0);

  const deliveredTotal =
    (updatedSpk.deliveredS || 0) + (updatedSpk.deliveredM || 0) + (updatedSpk.deliveredL || 0) +
    (updatedSpk.deliveredXL || 0) + (updatedSpk.deliveredXXL || 0) +
    (updatedSpk.deliveredAnak4 || 0) + (updatedSpk.deliveredAnak6 || 0) + (updatedSpk.deliveredAnak8 || 0) +
    (updatedSpk.deliveredAnak10 || 0) + (updatedSpk.deliveredAnak12 || 0) + (updatedSpk.deliveredAnak14 || 0) + (updatedSpk.deliveredAnak16 || 0);

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

// DELETE /api/outbound/:id - Delete Surat Jalan (Admin only)
outboundRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();

  const sj = await prisma.suratJalan.findUnique({
    where: { id },
    include: { returnList: true },
  });

  if (!sj) {
    return c.json({ error: 'Surat Jalan tidak ditemukan' }, 404);
  }

  if (sj.returnList && sj.returnList.length > 0) {
    return c.json({
      error: `Surat Jalan ${sj.noSuratJalan} memiliki ${sj.returnList.length} tiket retur. Hapus tiket retur terlebih dahulu.`,
    }, 400);
  }

  // Delete SJ
  await prisma.suratJalan.delete({ where: { id } });

  // Revert delivered qty on linked SPK
  const updatedSpk = await prisma.spkCutting.update({
    where: { id: sj.spkId },
    data: {
      deliveredS: { decrement: sj.qtySML || 0 },
      deliveredM: { decrement: sj.qtyM || 0 },
      deliveredL: { decrement: sj.qtyL || 0 },
      deliveredXL: { decrement: sj.qtyXL || 0 },
      deliveredXXL: { decrement: sj.qtyXXL || 0 },
      deliveredAnak4: { decrement: sj.qtyAnak4 || 0 },
      deliveredAnak6: { decrement: sj.qtyAnak6 || 0 },
      deliveredAnak8: { decrement: sj.qtyAnak8 || 0 },
      deliveredAnak10: { decrement: sj.qtyAnak10 || 0 },
      deliveredAnak12: { decrement: sj.qtyAnak12 || 0 },
      deliveredAnak14: { decrement: sj.qtyAnak14 || 0 },
      deliveredAnak16: { decrement: sj.qtyAnak16 || 0 },
    },
  });

  // Recalculate status of SPK
  const targetTotal =
    (updatedSpk.targetS || 0) + (updatedSpk.targetM || 0) + (updatedSpk.targetL || 0) +
    (updatedSpk.targetXL || 0) + (updatedSpk.targetXXL || 0) +
    (updatedSpk.targetAnak4 || 0) + (updatedSpk.targetAnak6 || 0) + (updatedSpk.targetAnak8 || 0) +
    (updatedSpk.targetAnak10 || 0) + (updatedSpk.targetAnak12 || 0) + (updatedSpk.targetAnak14 || 0) + (updatedSpk.targetAnak16 || 0);

  const deliveredTotal =
    (updatedSpk.deliveredS || 0) + (updatedSpk.deliveredM || 0) + (updatedSpk.deliveredL || 0) +
    (updatedSpk.deliveredXL || 0) + (updatedSpk.deliveredXXL || 0) +
    (updatedSpk.deliveredAnak4 || 0) + (updatedSpk.deliveredAnak6 || 0) + (updatedSpk.deliveredAnak8 || 0) +
    (updatedSpk.deliveredAnak10 || 0) + (updatedSpk.deliveredAnak12 || 0) + (updatedSpk.deliveredAnak14 || 0) + (updatedSpk.deliveredAnak16 || 0);

  const newStatus =
    deliveredTotal <= 0
      ? 'IN_PRODUCTION'
      : targetTotal > 0 && deliveredTotal > targetTotal
      ? 'OVER_DELIVERY'
      : targetTotal > 0 && deliveredTotal === targetTotal
      ? 'COMPLETED'
      : 'PARTIAL_DELIVERED';

  await prisma.spkCutting.update({
    where: { id: updatedSpk.id },
    data: { status: newStatus },
  });

  return c.json({ success: true, message: `Surat Jalan ${sj.noSuratJalan} berhasil dihapus` });
});
