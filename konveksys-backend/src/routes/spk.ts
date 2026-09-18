import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const spkRoutes = new Hono();
spkRoutes.use('*', authMiddleware, adminOnly);

// Helper auto-generate SPK number: SPK-YYYYMM-01
async function generateNextSpkNumber(yearMonth?: string): Promise<string> {
  const now = new Date();
  const ym = yearMonth || `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `SPK-${ym}-`;

  const existingSpks = await prisma.spkCutting.findMany({
    where: {
      spkNumber: {
        startsWith: prefix,
      },
    },
    select: {
      spkNumber: true,
    },
  });

  if (!existingSpks || existingSpks.length === 0) {
    return `${prefix}01`;
  }

  const seqs = existingSpks.map((s) => {
    const parts = s.spkNumber.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    return isNaN(num) ? 0 : num;
  });

  const nextSeq = (seqs.length > 0 ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${String(nextSeq).padStart(2, '0')}`;
}

spkRoutes.get('/', async (c) => {
  const spkList = await prisma.spkCutting.findMany({
    include: { rolsDigunakan: { include: { rol: true } }, suratJalanList: true },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(spkList);
});

spkRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { rollIds, ...spkData } = body;

    // Determine unique spkNumber
    let finalSpkNumber = spkData.spkNumber ? String(spkData.spkNumber).trim() : '';
    if (!finalSpkNumber) {
      finalSpkNumber = await generateNextSpkNumber();
    } else {
      const existing = await prisma.spkCutting.findUnique({
        where: { spkNumber: finalSpkNumber },
      });
      if (existing) {
        // If the number already exists, extract yearMonth if possible, or fallback to current
        const parts = finalSpkNumber.split('-');
        const ym = parts.length >= 2 ? parts[1] : undefined;
        finalSpkNumber = await generateNextSpkNumber(ym);
      }
    }

    // Verify valid rollIds
    let validRollIds: string[] = [];
    if (rollIds && Array.isArray(rollIds) && rollIds.length > 0) {
      const existingRolls = await prisma.inboundRoll.findMany({
        where: { id: { in: rollIds } },
        select: { id: true },
      });
      validRollIds = existingRolls.map((r) => r.id);
    }

    const tanggalSPKDate = spkData.tanggalSPK && !isNaN(new Date(spkData.tanggalSPK).getTime())
      ? new Date(spkData.tanggalSPK)
      : new Date();

    const targetSelesaiDate = spkData.targetSelesai && !isNaN(new Date(spkData.targetSelesai).getTime())
      ? new Date(spkData.targetSelesai)
      : null;

    let spk: any = null;
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      try {
        spk = await prisma.spkCutting.create({
          data: {
            ...spkData,
            spkNumber: finalSpkNumber,
            tanggalSPK: tanggalSPKDate,
            targetSelesai: targetSelesaiDate,
            rolsDigunakan: validRollIds.length > 0 ? {
              create: validRollIds.map((rolId: string) => ({ rolId })),
            } : undefined,
          },
          include: { rolsDigunakan: true },
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && attempts < 3) {
          finalSpkNumber = await generateNextSpkNumber();
        } else {
          throw err;
        }
      }
    }

    // Update status rol yang digunakan
    if (validRollIds.length > 0) {
      await prisma.inboundRoll.updateMany({
        where: { id: { in: validRollIds } },
        data: { status: 'DIPROSES' },
      });
    }

    return c.json(spk, 201);
  } catch (error: any) {
    console.error('Error creating SPK:', error);
    return c.json({ error: error?.message || 'Terjadi kesalahan saat membuat SPK.' }, 500);
  }
});

spkRoutes.put('/:id/status', async (c) => {
  const { id } = c.req.param();
  const { status } = await c.req.json();
  const spk = await prisma.spkCutting.update({ where: { id }, data: { status } });
  return c.json(spk);
});

// PUT /api/spk/:id - Update SPK Cutting (Admin only)
spkRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { rollIds, ...spkData } = body;

    const existingSpk = await prisma.spkCutting.findUnique({
      where: { id },
      include: { rolsDigunakan: true, suratJalanList: true },
    });

    if (!existingSpk) {
      return c.json({ error: 'SPK tidak ditemukan' }, 404);
    }

    const tanggalSPKDate = spkData.tanggalSPK && !isNaN(new Date(spkData.tanggalSPK).getTime())
      ? new Date(spkData.tanggalSPK)
      : existingSpk.tanggalSPK;

    const targetSelesaiDate = spkData.targetSelesai && !isNaN(new Date(spkData.targetSelesai).getTime())
      ? new Date(spkData.targetSelesai)
      : (spkData.targetSelesai === null ? null : existingSpk.targetSelesai);

    const targetS = spkData.targetS !== undefined ? Number(spkData.targetS) : existingSpk.targetS;
    const targetM = spkData.targetM !== undefined ? Number(spkData.targetM) : existingSpk.targetM;
    const targetL = spkData.targetL !== undefined ? Number(spkData.targetL) : existingSpk.targetL;
    const targetXL = spkData.targetXL !== undefined ? Number(spkData.targetXL) : existingSpk.targetXL;
    const targetXXL = spkData.targetXXL !== undefined ? Number(spkData.targetXXL) : existingSpk.targetXXL;
    const targetAnak4 = spkData.targetAnak4 !== undefined ? Number(spkData.targetAnak4) : existingSpk.targetAnak4;
    const targetAnak6 = spkData.targetAnak6 !== undefined ? Number(spkData.targetAnak6) : existingSpk.targetAnak6;
    const targetAnak8 = spkData.targetAnak8 !== undefined ? Number(spkData.targetAnak8) : existingSpk.targetAnak8;
    const targetAnak10 = spkData.targetAnak10 !== undefined ? Number(spkData.targetAnak10) : existingSpk.targetAnak10;
    const targetAnak12 = spkData.targetAnak12 !== undefined ? Number(spkData.targetAnak12) : existingSpk.targetAnak12;
    const targetAnak14 = spkData.targetAnak14 !== undefined ? Number(spkData.targetAnak14) : existingSpk.targetAnak14;
    const targetAnak16 = spkData.targetAnak16 !== undefined ? Number(spkData.targetAnak16) : existingSpk.targetAnak16;

    // Calculate total target vs total delivered to auto-adjust status
    const targetTotal =
      targetS + targetM + targetL + targetXL + targetXXL +
      targetAnak4 + targetAnak6 + targetAnak8 + targetAnak10 + targetAnak12 + targetAnak14 + targetAnak16;

    const deliveredTotal =
      (existingSpk.deliveredS || 0) + (existingSpk.deliveredM || 0) + (existingSpk.deliveredL || 0) +
      (existingSpk.deliveredXL || 0) + (existingSpk.deliveredXXL || 0) +
      (existingSpk.deliveredAnak4 || 0) + (existingSpk.deliveredAnak6 || 0) + (existingSpk.deliveredAnak8 || 0) +
      (existingSpk.deliveredAnak10 || 0) + (existingSpk.deliveredAnak12 || 0) + (existingSpk.deliveredAnak14 || 0) +
      (existingSpk.deliveredAnak16 || 0);

    let status = existingSpk.status;
    if (deliveredTotal > 0) {
      if (deliveredTotal > targetTotal) {
        status = 'OVER_DELIVERY';
      } else if (deliveredTotal >= targetTotal && targetTotal > 0) {
        status = 'COMPLETED';
      } else {
        status = 'PARTIAL_DELIVERED';
      }
    } else if (status !== 'DRAFT') {
      status = 'IN_PRODUCTION';
    }

    // Sync fabric rolls if rollIds provided
    if (rollIds !== undefined && Array.isArray(rollIds)) {
      const currentRollIds = existingSpk.rolsDigunakan.map((r) => r.rolId);
      const toRemove = currentRollIds.filter((id) => !rollIds.includes(id));
      const toAdd = rollIds.filter((id) => !currentRollIds.includes(id));

      if (toRemove.length > 0) {
        await prisma.spkRol.deleteMany({
          where: {
            spkId: id,
            rolId: { in: toRemove },
          },
        });
        await prisma.inboundRoll.updateMany({
          where: { id: { in: toRemove } },
          data: { status: 'DI_GUDANG', meterUsed: 0 },
        });
      }

      if (toAdd.length > 0) {
        const existingRolls = await prisma.inboundRoll.findMany({
          where: { id: { in: toAdd } },
          select: { id: true },
        });
        const validToAdd = existingRolls.map((r) => r.id);
        if (validToAdd.length > 0) {
          await prisma.spkRol.createMany({
            data: validToAdd.map((rolId) => ({ spkId: id, rolId })),
            skipDuplicates: true,
          });
          await prisma.inboundRoll.updateMany({
            where: { id: { in: validToAdd } },
            data: { status: 'DIPROSES' },
          });
        }
      }
    }

    const updatedSpk = await prisma.spkCutting.update({
      where: { id },
      data: {
        brand: spkData.brand ? String(spkData.brand).trim() : existingSpk.brand,
        produk: spkData.produk ? String(spkData.produk).trim() : existingSpk.produk,
        vendor: spkData.vendor ? String(spkData.vendor).trim() : existingSpk.vendor,
        tanggalSPK: tanggalSPKDate,
        targetSelesai: targetSelesaiDate,
        catatan: spkData.catatan !== undefined ? spkData.catatan : existingSpk.catatan,
        targetS,
        targetM,
        targetL,
        targetXL,
        targetXXL,
        targetAnak4,
        targetAnak6,
        targetAnak8,
        targetAnak10,
        targetAnak12,
        targetAnak14,
        targetAnak16,
        status,
      },
      include: { rolsDigunakan: { include: { rol: true } }, suratJalanList: true },
    });

    return c.json(updatedSpk);
  } catch (error) {
    console.error('Error updating SPK:', error);
    return c.json({ error: error?.message || 'Terjadi kesalahan saat memperbarui SPK.' }, 500);
  }
});

spkRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const spk = await prisma.spkCutting.findUnique({
    where: { id },
    include: { rolsDigunakan: { include: { rol: true } }, suratJalanList: true },
  });
  if (!spk) return c.json({ error: 'SPK tidak ditemukan' }, 404);
  return c.json(spk);
});

// DELETE /api/spk/:id - Delete SPK (Admin only)
spkRoutes.delete('/:id', async (c) => {
  const { id } = c.req.param();

  const spk = await prisma.spkCutting.findUnique({
    where: { id },
    include: {
      suratJalanList: true,
      rolsDigunakan: true,
      returnList: true,
    },
  });

  if (!spk) {
    return c.json({ error: 'SPK tidak ditemukan' }, 404);
  }

  if (spk.suratJalanList && spk.suratJalanList.length > 0) {
    return c.json({
      error: `SPK ${spk.spkNumber} sudah memiliki ${spk.suratJalanList.length} Surat Jalan pengiriman. Hapus semua Surat Jalan terkait terlebih dahulu.`,
    }, 400);
  }

  if (spk.returnList && spk.returnList.length > 0) {
    return c.json({
      error: `SPK ${spk.spkNumber} memiliki ${spk.returnList.length} tiket retur terkait. Hapus atau selesaikan tiket retur terlebih dahulu.`,
    }, 400);
  }

  // Restore fabric rolls back to DI_GUDANG and reset meterUsed
  if (spk.rolsDigunakan && spk.rolsDigunakan.length > 0) {
    const rollIds = spk.rolsDigunakan.map((r: any) => r.rolId);
    await prisma.inboundRoll.updateMany({
      where: { id: { in: rollIds } },
      data: { status: 'DI_GUDANG', meterUsed: 0 },
    });
  }

  // Delete SPK (SpkRol relation is deleted via Cascade onDelete)
  await prisma.spkCutting.delete({ where: { id } });

  return c.json({ success: true, message: `SPK ${spk.spkNumber} berhasil dihapus` });
});
