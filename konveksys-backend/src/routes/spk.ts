import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const spkRoutes = new Hono();
spkRoutes.use('*', authMiddleware, adminOnly);

spkRoutes.get('/', async (c) => {
  const spkList = await prisma.spkCutting.findMany({
    include: { rolsDigunakan: { include: { rol: true } }, suratJalanList: true },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(spkList);
});

spkRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { rollIds, ...spkData } = body;
  const spk = await prisma.spkCutting.create({
    data: {
      ...spkData,
      tanggalSPK: new Date(spkData.tanggalSPK),
      targetSelesai: spkData.targetSelesai ? new Date(spkData.targetSelesai) : null,
      rolsDigunakan: rollIds ? {
        create: rollIds.map((rolId: string) => ({ rolId })),
      } : undefined,
    },
    include: { rolsDigunakan: true },
  });
  // Update status rol yang digunakan
  if (rollIds?.length) {
    await prisma.inboundRoll.updateMany({
      where: { id: { in: rollIds } },
      data: { status: 'DIPROSES' },
    });
  }
  return c.json(spk, 201);
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
