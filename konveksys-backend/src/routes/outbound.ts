import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const outboundRoutes = new Hono();
outboundRoutes.use('*', authMiddleware);

outboundRoutes.get('/', async (c) => {
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
  const list = await prisma.suratJalan.findMany({
    where,
    include: { spk: { select: { spkNumber: true, vendor: true } } },
    orderBy: { tanggal: 'desc' },
  });
  return c.json(list);
});

outboundRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();
  const { items, ...restData } = body;

  const totalPcs =
    restData.totalPcs ||
    (restData.qtySML || 0) + (restData.qtyM || 0) + (restData.qtyL || 0) +
    (restData.qtyXL || 0) + (restData.qtyXXL || 0) +
    (restData.qtyAnak4 || 0) + (restData.qtyAnak6 || 0) + (restData.qtyAnak8 || 0) +
    (restData.qtyAnak10 || 0) + (restData.qtyAnak12 || 0) + (restData.qtyAnak14 || 0) + (restData.qtyAnak16 || 0);

  const sj = await prisma.suratJalan.create({
    data: {
      noSuratJalan: restData.noSuratJalan,
      spkId: restData.spkId,
      brand: restData.brand,
      produk: restData.produk,
      vendor: restData.vendor,
      tanggal: new Date(restData.tanggal),
      driverName: restData.driverName || null,
      nomorKendaraan: restData.nomorKendaraan || null,
      catatan: restData.catatan || null,
      status: restData.status || 'DELIVERED',
      items: items || null,
      qtySML: restData.qtySML || 0,
      qtyM: restData.qtyM || 0,
      qtyL: restData.qtyL || 0,
      qtyXL: restData.qtyXL || 0,
      qtyXXL: restData.qtyXXL || 0,
      qtyAnak4: restData.qtyAnak4 || 0,
      qtyAnak6: restData.qtyAnak6 || 0,
      qtyAnak8: restData.qtyAnak8 || 0,
      qtyAnak10: restData.qtyAnak10 || 0,
      qtyAnak12: restData.qtyAnak12 || 0,
      qtyAnak14: restData.qtyAnak14 || 0,
      qtyAnak16: restData.qtyAnak16 || 0,
      totalPcs,
    },
  });

  // Update delivered qty di SPK (Multi-Item or Single Item)
  const itemsToUpdate = Array.isArray(items) && items.length > 0
    ? items
    : [
        {
          spkId: restData.spkId,
          qtyDelivered: {
            s: restData.qtySML || 0,
            m: restData.qtyM || 0,
            l: restData.qtyL || 0,
            xl: restData.qtyXL || 0,
            xxl: restData.qtyXXL || 0,
            anak4: restData.qtyAnak4 || 0,
            anak6: restData.qtyAnak6 || 0,
            anak8: restData.qtyAnak8 || 0,
            anak10: restData.qtyAnak10 || 0,
            anak12: restData.qtyAnak12 || 0,
            anak14: restData.qtyAnak14 || 0,
            anak16: restData.qtyAnak16 || 0,
          },
        },
      ];

  const affectedSpkIds = new Set<string>();

  for (const it of itemsToUpdate) {
    if (!it.spkId) continue;
    affectedSpkIds.add(it.spkId);
    const deliv = it.qtyDelivered || {};

    await prisma.spkCutting.update({
      where: { id: it.spkId },
      data: {
        deliveredS: { increment: (deliv.s || 0) + (deliv.qtySML || 0) },
        deliveredM: { increment: deliv.m || 0 },
        deliveredL: { increment: deliv.l || 0 },
        deliveredXL: { increment: deliv.xl || 0 },
        deliveredXXL: { increment: deliv.xxl || 0 },
        deliveredAnak4: { increment: deliv.anak4 || 0 },
        deliveredAnak6: { increment: deliv.anak6 || 0 },
        deliveredAnak8: { increment: deliv.anak8 || 0 },
        deliveredAnak10: { increment: deliv.anak10 || 0 },
        deliveredAnak12: { increment: deliv.anak12 || 0 },
        deliveredAnak14: { increment: deliv.anak14 || 0 },
        deliveredAnak16: { increment: deliv.anak16 || 0 },
      },
    }).catch((err: any) => console.warn(`Failed updating SPK ${it.spkId}:`, err));
  }

  // Recalculate status for all affected SPKs
  for (const spkId of affectedSpkIds) {
    const updatedSpk = await prisma.spkCutting.findUnique({ where: { id: spkId } });
    if (!updatedSpk) continue;

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
  }

  return c.json({ ...sj, items }, 201);
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

  // Revert delivered qty on linked SPK (support Multi-Item & single item)
  const itemsToRevert = Array.isArray(sj.items) && (sj.items as any[]).length > 0
    ? (sj.items as any[])
    : [
        {
          spkId: sj.spkId,
          qtyDelivered: {
            s: sj.qtySML || 0,
            m: sj.qtyM || 0,
            l: sj.qtyL || 0,
            xl: sj.qtyXL || 0,
            xxl: sj.qtyXXL || 0,
            anak4: sj.qtyAnak4 || 0,
            anak6: sj.qtyAnak6 || 0,
            anak8: sj.qtyAnak8 || 0,
            anak10: sj.qtyAnak10 || 0,
            anak12: sj.qtyAnak12 || 0,
            anak14: sj.qtyAnak14 || 0,
            anak16: sj.qtyAnak16 || 0,
          },
        },
      ];

  const affectedSpkIds = new Set<string>();

  for (const it of itemsToRevert) {
    if (!it.spkId) continue;
    affectedSpkIds.add(it.spkId);
    const deliv = it.qtyDelivered || {};

    await prisma.spkCutting.update({
      where: { id: it.spkId },
      data: {
        deliveredS: { decrement: (deliv.s || 0) + (deliv.qtySML || 0) },
        deliveredM: { decrement: deliv.m || 0 },
        deliveredL: { decrement: deliv.l || 0 },
        deliveredXL: { decrement: deliv.xl || 0 },
        deliveredXXL: { decrement: deliv.xxl || 0 },
        deliveredAnak4: { decrement: deliv.anak4 || 0 },
        deliveredAnak6: { decrement: deliv.anak6 || 0 },
        deliveredAnak8: { decrement: deliv.anak8 || 0 },
        deliveredAnak10: { decrement: deliv.anak10 || 0 },
        deliveredAnak12: { decrement: deliv.anak12 || 0 },
        deliveredAnak14: { decrement: deliv.anak14 || 0 },
        deliveredAnak16: { decrement: deliv.anak16 || 0 },
      },
    }).catch((err: any) => console.warn(`Failed reverting SPK ${it.spkId}:`, err));
  }

  // Recalculate status of all affected SPKs
  for (const spkId of affectedSpkIds) {
    const updatedSpk = await prisma.spkCutting.findUnique({ where: { id: spkId } });
    if (!updatedSpk) continue;

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
  }

  return c.json({ success: true, message: `Surat Jalan ${sj.noSuratJalan} berhasil dihapus` });
});
