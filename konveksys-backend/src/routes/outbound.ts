// Helper auto-generate Surat Jalan number: SJ/YYYYMM/001
async function generateNextSjNumber(yearMonth?: string): Promise<string> {
  const now = new Date();
  const ym = yearMonth || `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `SJ/${ym}/`;

  const existingSJs = await prisma.suratJalan.findMany({
    where: {
      noSuratJalan: {
        startsWith: prefix,
      },
    },
    select: {
      noSuratJalan: true,
    },
  });

  if (!existingSJs || existingSJs.length === 0) {
    return `${prefix}001`;
  }

  const seqs = existingSJs.map((s) => {
    const parts = s.noSuratJalan.split('/');
    const num = parseInt(parts[parts.length - 1], 10);
    return isNaN(num) ? 0 : num;
  });

  const nextSeq = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

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
  try {
    const body = await c.req.json();
    const { items, ...restData } = body;

    // 1. Determine unique noSuratJalan
    let finalNoSj = restData.noSuratJalan ? String(restData.noSuratJalan).trim() : '';
    if (!finalNoSj) {
      finalNoSj = await generateNextSjNumber();
    } else {
      const existing = await prisma.suratJalan.findUnique({
        where: { noSuratJalan: finalNoSj },
      });
      if (existing) {
        const parts = finalNoSj.split('/');
        const ym = parts.length >= 2 ? parts[1] : undefined;
        finalNoSj = await generateNextSjNumber(ym);
      }
    }

    // 2. Validate spkId (nullable support for 100% Non-SPK / Manual PO)
    let validSpkId: string | null = null;
    if (restData.spkId && String(restData.spkId).trim() !== '') {
      const spkExists = await prisma.spkCutting.findUnique({
        where: { id: String(restData.spkId).trim() },
        select: { id: true },
      });
      if (spkExists) {
        validSpkId = spkExists.id;
      }
    }

    // Fallback: If restData.spkId wasn't found or null, check if any item has a valid spkId
    if (!validSpkId && Array.isArray(items)) {
      for (const it of items) {
        if (it.spkId && !it.isManual) {
          const spkExists = await prisma.spkCutting.findUnique({
            where: { id: String(it.spkId).trim() },
            select: { id: true },
          });
          if (spkExists) {
            validSpkId = spkExists.id;
            break;
          }
        }
      }
    }

    const totalPcs =
      restData.totalPcs ||
      (restData.qtySML || 0) + (restData.qtyM || 0) + (restData.qtyL || 0) +
      (restData.qtyXL || 0) + (restData.qtyXXL || 0) +
      (restData.qtyAnak2 || 0) + (restData.qtyAnak4 || 0) + (restData.qtyAnak6 || 0) + (restData.qtyAnak8 || 0) +
      (restData.qtyAnak10 || 0) + (restData.qtyAnak12 || 0) + (restData.qtyAnak14 || 0) + (restData.qtyAnak16 || 0);

    let sj: any = null;
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        sj = await prisma.suratJalan.create({
          data: {
            noSuratJalan: finalNoSj,
            spkId: validSpkId,
            brand: restData.brand,
            produk: restData.produk,
            vendor: restData.vendor,
            tanggal: restData.tanggal ? new Date(restData.tanggal) : new Date(),
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
            qtyAnak2: restData.qtyAnak2 || 0,
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
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && attempts < 3) {
          finalNoSj = await generateNextSjNumber();
        } else {
          throw err;
        }
      }
    }

    // 3. Update delivered qty di SPK (Hanya untuk item yang terhubung dengan SPK nyata)
    const itemsToUpdate = Array.isArray(items) && items.length > 0
      ? items.filter((it: any) => Boolean(it.spkId) && !it.isManual)
      : validSpkId
      ? [
          {
            spkId: validSpkId,
            qtyDelivered: {
              s: restData.qtySML || 0,
              m: restData.qtyM || 0,
              l: restData.qtyL || 0,
              xl: restData.qtyXL || 0,
              xxl: restData.qtyXXL || 0,
              anak2: restData.qtyAnak2 || 0,
              anak4: restData.qtyAnak4 || 0,
              anak6: restData.qtyAnak6 || 0,
              anak8: restData.qtyAnak8 || 0,
              anak10: restData.qtyAnak10 || 0,
              anak12: restData.qtyAnak12 || 0,
              anak14: restData.qtyAnak14 || 0,
              anak16: restData.qtyAnak16 || 0,
            },
          },
        ]
      : [];

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
          deliveredAnak2: { increment: deliv.anak2 || 0 },
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
        (updatedSpk.targetAnak2 || 0) + (updatedSpk.targetAnak4 || 0) + (updatedSpk.targetAnak6 || 0) + (updatedSpk.targetAnak8 || 0) +
        (updatedSpk.targetAnak10 || 0) + (updatedSpk.targetAnak12 || 0) + (updatedSpk.targetAnak14 || 0) + (updatedSpk.targetAnak16 || 0);

      const deliveredTotal =
        (updatedSpk.deliveredS || 0) + (updatedSpk.deliveredM || 0) + (updatedSpk.deliveredL || 0) +
        (updatedSpk.deliveredXL || 0) + (updatedSpk.deliveredXXL || 0) +
        (updatedSpk.deliveredAnak2 || 0) + (updatedSpk.deliveredAnak4 || 0) + (updatedSpk.deliveredAnak6 || 0) + (updatedSpk.deliveredAnak8 || 0) +
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

    return c.json(sj, 201);
  } catch (error: any) {
    console.error('Error creating Surat Jalan:', error);
    return c.json({ error: error?.message || 'Terjadi kesalahan saat membuat Surat Jalan.' }, 500);
  }
});

outboundRoutes.put('/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');
  const body = await c.req.json();

  const sj = await prisma.suratJalan.findUnique({
    where: { id },
  });

  if (!sj) return c.json({ error: 'Surat Jalan tidak ditemukan' }, 404);

  // If user is BRAND, ensure they own this Surat Jalan
  if (user.role === 'BRAND') {
    const allowed = Array.isArray(user.accessibleBrands) && user.accessibleBrands.length > 0
      ? user.accessibleBrands.map((b: string) => b.trim().toUpperCase())
      : (user.brandName ? [user.brandName.trim().toUpperCase()] : []);
    const match = allowed.some((b: string) => sj.brand.toUpperCase().includes(b));
    if (!match) {
      return c.json({ error: 'Akses ditolak: Anda tidak memiliki akses ke Surat Jalan brand ini' }, 403);
    }
  }

  const newItems = body.items || [];
  let oldItems: any[] = [];
  if (typeof sj.items === 'string') {
    try {
      oldItems = JSON.parse(sj.items);
    } catch {}
  } else if (Array.isArray(sj.items)) {
    oldItems = sj.items as any[];
  }

  // 1. Calculate SPK deltas (newQty - oldQty per size)
  const affectedSpkIds = new Set<string>();

  for (let idx = 0; idx < newItems.length; idx++) {
    const newItem = newItems[idx];
    const spkId = newItem.spkId || sj.spkId;
    if (!spkId) continue;
    affectedSpkIds.add(spkId);

    const oldItem = oldItems.find((o) => (newItem.id && o.id === newItem.id) || (newItem.spkId && o.spkId === newItem.spkId && o.produk === newItem.produk)) || oldItems[idx] || {};

    const newDeliv = newItem.qtyDelivered || {};
    const oldDeliv = oldItem.qtyDelivered || {
      s: (oldItem.qtySML || sj.qtySML || 0),
      m: oldItem.qtyM || sj.qtyM || 0,
      l: oldItem.qtyL || sj.qtyL || 0,
      xl: oldItem.qtyXL || sj.qtyXL || 0,
      xxl: oldItem.qtyXXL || sj.qtyXXL || 0,
      anak2: oldItem.qtyAnak2 || sj.qtyAnak2 || 0,
      anak4: oldItem.qtyAnak4 || sj.qtyAnak4 || 0,
      anak6: oldItem.qtyAnak6 || sj.qtyAnak6 || 0,
      anak8: oldItem.qtyAnak8 || sj.qtyAnak8 || 0,
      anak10: oldItem.qtyAnak10 || sj.qtyAnak10 || 0,
      anak12: oldItem.qtyAnak12 || sj.qtyAnak12 || 0,
      anak14: oldItem.qtyAnak14 || sj.qtyAnak14 || 0,
      anak16: oldItem.qtyAnak16 || sj.qtyAnak16 || 0,
    };

    const deltaS = (newDeliv.s || 0) - (oldDeliv.s || 0);
    const deltaM = (newDeliv.m || 0) - (oldDeliv.m || 0);
    const deltaL = (newDeliv.l || 0) - (oldDeliv.l || 0);
    const deltaXL = (newDeliv.xl || 0) - (oldDeliv.xl || 0);
    const deltaXXL = (newDeliv.xxl || 0) - (oldDeliv.xxl || 0);
    const deltaAnak2 = (newDeliv.anak2 || 0) - (oldDeliv.anak2 || 0);
    const deltaAnak4 = (newDeliv.anak4 || 0) - (oldDeliv.anak4 || 0);
    const deltaAnak6 = (newDeliv.anak6 || 0) - (oldDeliv.anak6 || 0);
    const deltaAnak8 = (newDeliv.anak8 || 0) - (oldDeliv.anak8 || 0);
    const deltaAnak10 = (newDeliv.anak10 || 0) - (oldDeliv.anak10 || 0);
    const deltaAnak12 = (newDeliv.anak12 || 0) - (oldDeliv.anak12 || 0);
    const deltaAnak14 = (newDeliv.anak14 || 0) - (oldDeliv.anak14 || 0);
    const deltaAnak16 = (newDeliv.anak16 || 0) - (oldDeliv.anak16 || 0);

    await prisma.spkCutting.update({
      where: { id: spkId },
      data: {
        deliveredS: { increment: deltaS },
        deliveredM: { increment: deltaM },
        deliveredL: { increment: deltaL },
        deliveredXL: { increment: deltaXL },
        deliveredXXL: { increment: deltaXXL },
        deliveredAnak2: { increment: deltaAnak2 },
        deliveredAnak4: { increment: deltaAnak4 },
        deliveredAnak6: { increment: deltaAnak6 },
        deliveredAnak8: { increment: deltaAnak8 },
        deliveredAnak10: { increment: deltaAnak10 },
        deliveredAnak12: { increment: deltaAnak12 },
        deliveredAnak14: { increment: deltaAnak14 },
        deliveredAnak16: { increment: deltaAnak16 },
      },
    }).catch((err: any) => console.warn(`Failed adjusting SPK ${spkId}:`, err));
  }

  // Recalculate status of affected SPKs
  for (const spkId of affectedSpkIds) {
    const updatedSpk = await prisma.spkCutting.findUnique({ where: { id: spkId } });
    if (!updatedSpk) continue;

    const targetTotal =
      (updatedSpk.targetS || 0) + (updatedSpk.targetM || 0) + (updatedSpk.targetL || 0) +
      (updatedSpk.targetXL || 0) + (updatedSpk.targetXXL || 0) +
      (updatedSpk.targetAnak2 || 0) + (updatedSpk.targetAnak4 || 0) + (updatedSpk.targetAnak6 || 0) + (updatedSpk.targetAnak8 || 0) +
      (updatedSpk.targetAnak10 || 0) + (updatedSpk.targetAnak12 || 0) + (updatedSpk.targetAnak14 || 0) + (updatedSpk.targetAnak16 || 0);

    const deliveredTotal =
      (updatedSpk.deliveredS || 0) + (updatedSpk.deliveredM || 0) + (updatedSpk.deliveredL || 0) +
      (updatedSpk.deliveredXL || 0) + (updatedSpk.deliveredXXL || 0) +
      (updatedSpk.deliveredAnak2 || 0) + (updatedSpk.deliveredAnak4 || 0) + (updatedSpk.deliveredAnak6 || 0) + (updatedSpk.deliveredAnak8 || 0) +
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

  // 2. Compute totalPcs & size breakdowns from newItems
  const firstItem = newItems[0] || {};
  const firstDeliv = firstItem.qtyDelivered || {};
  const totalPcs = newItems.reduce((acc: number, it: any) => acc + (Number(it.totalPcs) || 0), 0);

  const updatedSJ = await prisma.suratJalan.update({
    where: { id },
    data: {
      items: newItems,
      totalPcs,
      status: body.status || 'VERIFIED',
      catatan: body.catatan !== undefined ? body.catatan : sj.catatan,
      driverName: body.driverName !== undefined ? body.driverName : sj.driverName,
      nomorKendaraan: body.nomorKendaraan !== undefined ? body.nomorKendaraan : sj.nomorKendaraan,
      qtySML: (firstDeliv.s || 0) + (firstDeliv.m || 0) + (firstDeliv.l || 0),
      qtyM: firstDeliv.m || 0,
      qtyL: firstDeliv.l || 0,
      qtyXL: firstDeliv.xl || 0,
      qtyXXL: firstDeliv.xxl || 0,
      qtyAnak2: firstDeliv.anak2 || 0,
      qtyAnak4: firstDeliv.anak4 || 0,
      qtyAnak6: firstDeliv.anak6 || 0,
      qtyAnak8: firstDeliv.anak8 || 0,
      qtyAnak10: firstDeliv.anak10 || 0,
      qtyAnak12: firstDeliv.anak12 || 0,
      qtyAnak14: firstDeliv.anak14 || 0,
      qtyAnak16: firstDeliv.anak16 || 0,
    },
  });

  return c.json({ ...updatedSJ, items: newItems });
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
  let parsedItems: any[] = [];
  if (typeof sj.items === 'string') {
    try {
      parsedItems = JSON.parse(sj.items);
    } catch {}
  } else if (Array.isArray(sj.items)) {
    parsedItems = sj.items as any[];
  }

  const itemsToRevert = Array.isArray(parsedItems) && parsedItems.length > 0
    ? parsedItems
    : [
        {
          spkId: sj.spkId,
          qtyDelivered: {
            s: sj.qtySML || 0,
            m: sj.qtyM || 0,
            l: sj.qtyL || 0,
            xl: sj.qtyXL || 0,
            xxl: sj.qtyXXL || 0,
            anak2: sj.qtyAnak2 || 0,
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
    const spkIdentifier = it.spkId || it.spkNumber || sj.spkId;
    if (!spkIdentifier) continue;

    const targetSpk = await prisma.spkCutting.findFirst({
      where: {
        OR: [{ id: spkIdentifier }, { spkNumber: spkIdentifier }],
      },
    });
    if (!targetSpk) continue;

    affectedSpkIds.add(targetSpk.id);
    const deliv = it.qtyDelivered || {};

    await prisma.spkCutting.update({
      where: { id: targetSpk.id },
      data: {
        deliveredS: Math.max(0, (targetSpk.deliveredS || 0) - ((deliv.s || 0) + (deliv.qtySML || 0))),
        deliveredM: Math.max(0, (targetSpk.deliveredM || 0) - (deliv.m || 0)),
        deliveredL: Math.max(0, (targetSpk.deliveredL || 0) - (deliv.l || 0)),
        deliveredXL: Math.max(0, (targetSpk.deliveredXL || 0) - (deliv.xl || 0)),
        deliveredXXL: Math.max(0, (targetSpk.deliveredXXL || 0) - (deliv.xxl || 0)),
        deliveredAnak2: Math.max(0, (targetSpk.deliveredAnak2 || 0) - (deliv.anak2 || 0)),
        deliveredAnak4: Math.max(0, (targetSpk.deliveredAnak4 || 0) - (deliv.anak4 || 0)),
        deliveredAnak6: Math.max(0, (targetSpk.deliveredAnak6 || 0) - (deliv.anak6 || 0)),
        deliveredAnak8: Math.max(0, (targetSpk.deliveredAnak8 || 0) - (deliv.anak8 || 0)),
        deliveredAnak10: Math.max(0, (targetSpk.deliveredAnak10 || 0) - (deliv.anak10 || 0)),
        deliveredAnak12: Math.max(0, (targetSpk.deliveredAnak12 || 0) - (deliv.anak12 || 0)),
        deliveredAnak14: Math.max(0, (targetSpk.deliveredAnak14 || 0) - (deliv.anak14 || 0)),
        deliveredAnak16: Math.max(0, (targetSpk.deliveredAnak16 || 0) - (deliv.anak16 || 0)),
      },
    }).catch((err: any) => console.warn(`Failed reverting SPK ${targetSpk.id}:`, err));
  }

  // Recalculate status of all affected SPKs
  for (const spkId of affectedSpkIds) {
    const updatedSpk = await prisma.spkCutting.findUnique({ where: { id: spkId } });
    if (!updatedSpk) continue;

    const targetTotal =
      (updatedSpk.targetS || 0) + (updatedSpk.targetM || 0) + (updatedSpk.targetL || 0) +
      (updatedSpk.targetXL || 0) + (updatedSpk.targetXXL || 0) +
      (updatedSpk.targetAnak2 || 0) + (updatedSpk.targetAnak4 || 0) + (updatedSpk.targetAnak6 || 0) + (updatedSpk.targetAnak8 || 0) +
      (updatedSpk.targetAnak10 || 0) + (updatedSpk.targetAnak12 || 0) + (updatedSpk.targetAnak14 || 0) + (updatedSpk.targetAnak16 || 0);

    const deliveredTotal =
      (updatedSpk.deliveredS || 0) + (updatedSpk.deliveredM || 0) + (updatedSpk.deliveredL || 0) +
      (updatedSpk.deliveredXL || 0) + (updatedSpk.deliveredXXL || 0) +
      (updatedSpk.deliveredAnak2 || 0) + (updatedSpk.deliveredAnak4 || 0) + (updatedSpk.deliveredAnak6 || 0) + (updatedSpk.deliveredAnak8 || 0) +
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
