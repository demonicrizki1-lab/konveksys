import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const operationalExpenseRoutes = new Hono();
operationalExpenseRoutes.use('*', authMiddleware);

// GET /api/operational-expenses - List with filter
operationalExpenseRoutes.get('/', async (c) => {
  try {
    const { month, startDate, endDate, kategori, jenis, akunKas, search } = c.req.query();
    const where: any = {};

    if (month && month !== 'ALL') {
      const [year, m] = month.split('-');
      const start = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
      const end = new Date(parseInt(year, 10), parseInt(m, 10), 0, 23, 59, 59, 999);
      where.tanggal = { gte: start, lte: end };
    } else if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) where.tanggal.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggal.lte = end;
      }
    }

    if (kategori && kategori !== 'ALL') {
      where.kategori = kategori;
    }

    if (jenis && jenis !== 'ALL') {
      where.jenis = jenis;
    }

    if (akunKas && akunKas !== 'ALL') {
      where.akunKas = akunKas;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { deskripsi: { contains: q, mode: 'insensitive' } },
        { penerimaPenyetor: { contains: q, mode: 'insensitive' } },
        { referensiNomor: { contains: q, mode: 'insensitive' } },
        { kategori: { contains: q, mode: 'insensitive' } },
      ];
    }

    const list = await prisma.operationalExpense.findMany({
      where,
      orderBy: { tanggal: 'desc' },
    });

    return c.json(list);
  } catch (error: any) {
    console.error('[OPEX_GET_ERROR]', error);
    return c.json({ error: 'Gagal memuat kas operasional', detail: error.message }, 500);
  }
});

// GET /api/operational-expenses/summary
operationalExpenseRoutes.get('/summary', async (c) => {
  try {
    const { month } = c.req.query();
    const where: any = {};
    if (month && month !== 'ALL') {
      const [year, m] = month.split('-');
      const start = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
      const end = new Date(parseInt(year, 10), parseInt(m, 10), 0, 23, 59, 59, 999);
      where.tanggal = { gte: start, lte: end };
    }

    const items = await prisma.operationalExpense.findMany({ where });

    let totalKasMasuk = 0;
    let totalKasKeluar = 0;
    const categoryTotals: Record<string, number> = {};
    const accountTotals: Record<string, { masuk: number; keluar: number; balance: number }> = {};

    for (const item of items) {
      const nom = Number(item.nominal);
      const akun = item.akunKas || 'BCA Perusahaan';
      if (!accountTotals[akun]) {
        accountTotals[akun] = { masuk: 0, keluar: 0, balance: 0 };
      }

      if (item.jenis === 'KAS_MASUK') {
        totalKasMasuk += nom;
        accountTotals[akun].masuk += nom;
        accountTotals[akun].balance += nom;
      } else {
        totalKasKeluar += nom;
        categoryTotals[item.kategori] = (categoryTotals[item.kategori] || 0) + nom;
        accountTotals[akun].keluar += nom;
        accountTotals[akun].balance -= nom;
      }
    }

    return c.json({
      totalKasMasuk,
      totalKasKeluar,
      netCashFlow: totalKasMasuk - totalKasKeluar,
      categoryTotals,
      accountTotals,
      count: items.length,
    });
  } catch (error: any) {
    console.error('[OPEX_SUMMARY_ERROR]', error);
    return c.json({ error: 'Gagal memuat ringkasan kas operasional', detail: error.message }, 500);
  }
});

// POST /api/operational-expenses - Create
operationalExpenseRoutes.post('/', adminOnly, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    if (!body.tanggal || !body.nominal || !body.deskripsi || !body.kategori) {
      return c.json({ error: 'Field tanggal, kategori, nominal, dan deskripsi wajib diisi' }, 400);
    }

    const created = await prisma.operationalExpense.create({
      data: {
        tanggal: new Date(body.tanggal),
        jenis: body.jenis || 'KAS_KELUAR',
        kategori: body.kategori,
        nominal: parseFloat(body.nominal),
        akunKas: body.akunKas || 'BCA Perusahaan',
        deskripsi: body.deskripsi,
        penerimaPenyetor: body.penerimaPenyetor || null,
        referensiNomor: body.referensiNomor || null,
        lampiranUrl: body.lampiranUrl || null,
        createdBy: (user as any)?.name || user?.email || 'ADMIN',
      },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.userId || 'ADMIN',
          userName: user?.email?.split('@')[0] || 'ADMIN',
          userRole: 'ADMIN',
          module: 'ARUS_KAS',
          action: 'CREATE',
          severity: 'INFO',
          entityId: created.id,
          entityName: `${created.jenis} - ${created.kategori} - Rp ${Number(created.nominal).toLocaleString('id-ID')}`,
          details: `Pencatatan kas operasional: ${created.deskripsi} (${created.akunKas})`,
          newData: created as any,
          ipAddress: c.req.header('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
        },
      });
    } catch (auditErr) {
      console.warn('Gagal mencatat audit log opex:', auditErr);
    }

    return c.json(created, 201);
  } catch (error: any) {
    console.error('[OPEX_POST_ERROR]', error);
    return c.json({ error: 'Gagal menyimpan transaksi kas operasional', detail: error.message }, 500);
  }
});

// PUT /api/operational-expenses/:id - Update
operationalExpenseRoutes.put('/:id', adminOnly, async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const body = await c.req.json();

    const existing = await prisma.operationalExpense.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Data transaksi tidak ditemukan' }, 404);
    }

    const updated = await prisma.operationalExpense.update({
      where: { id },
      data: {
        tanggal: body.tanggal ? new Date(body.tanggal) : undefined,
        jenis: body.jenis !== undefined ? body.jenis : undefined,
        kategori: body.kategori !== undefined ? body.kategori : undefined,
        nominal: body.nominal !== undefined ? parseFloat(body.nominal) : undefined,
        akunKas: body.akunKas !== undefined ? body.akunKas : undefined,
        deskripsi: body.deskripsi !== undefined ? body.deskripsi : undefined,
        penerimaPenyetor: body.penerimaPenyetor !== undefined ? body.penerimaPenyetor : undefined,
        referensiNomor: body.referensiNomor !== undefined ? body.referensiNomor : undefined,
        lampiranUrl: body.lampiranUrl !== undefined ? body.lampiranUrl : undefined,
      },
    });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.userId || 'ADMIN',
          userName: user?.email?.split('@')[0] || 'ADMIN',
          userRole: 'ADMIN',
          module: 'ARUS_KAS',
          action: 'UPDATE',
          severity: 'INFO',
          entityId: updated.id,
          entityName: `${updated.jenis} - ${updated.kategori}`,
          details: `Update kas operasional ID ${id}: ${updated.deskripsi}`,
          previousData: existing as any,
          newData: updated as any,
          ipAddress: c.req.header('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
        },
      });
    } catch (auditErr) {
      console.warn('Gagal mencatat audit log opex update:', auditErr);
    }

    return c.json(updated);
  } catch (error: any) {
    console.error('[OPEX_PUT_ERROR]', error);
    return c.json({ error: 'Gagal memperbarui transaksi kas operasional', detail: error.message }, 500);
  }
});

// DELETE /api/operational-expenses/:id - Delete
operationalExpenseRoutes.delete('/:id', adminOnly, async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const existing = await prisma.operationalExpense.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Data transaksi tidak ditemukan' }, 404);
    }

    await prisma.operationalExpense.delete({ where: { id } });

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.userId || 'ADMIN',
          userName: user?.email?.split('@')[0] || 'ADMIN',
          userRole: 'ADMIN',
          module: 'ARUS_KAS',
          action: 'DELETE',
          severity: 'WARNING',
          entityId: id,
          entityName: `${existing.jenis} - ${existing.kategori} (Rp ${Number(existing.nominal).toLocaleString('id-ID')})`,
          details: `Hapus kas operasional: ${existing.deskripsi}`,
          previousData: existing as any,
          ipAddress: c.req.header('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
        },
      });
    } catch (auditErr) {
      console.warn('Gagal mencatat audit log opex delete:', auditErr);
    }

    return c.json({ message: 'Transaksi kas operasional berhasil dihapus' });
  } catch (error: any) {
    console.error('[OPEX_DELETE_ERROR]', error);
    return c.json({ error: 'Gagal menghapus transaksi kas operasional', detail: error.message }, 500);
  }
});
