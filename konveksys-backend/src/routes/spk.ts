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
