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
