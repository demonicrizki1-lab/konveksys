import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const productionPoRoutes = new Hono();
productionPoRoutes.use('*', authMiddleware);

// ============================================================
// PRODUCTION PURCHASE ORDER (PO / SPK RESTOCK KONVEKSI)
// ============================================================

// GET /api/production-po - Ambil semua list PO
productionPoRoutes.get('/', async (c) => {
  try {
    const brand = c.req.query('brand');
    const status = c.req.query('status');
    const search = c.req.query('search');

    const where: any = {};

    if (brand && brand !== 'ALL') {
      where.brand = brand;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { noPO: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { vendorTujuan: { contains: q, mode: 'insensitive' } },
        { items: { some: { namaProduk: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const pos = await prisma.productionPO.findMany({
      where,
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return c.json(pos);
  } catch (err: any) {
    console.error('[PO-GET-ERROR]', err);
    return c.json({ error: 'Gagal mengambil data PO Produksi: ' + err.message }, 500);
  }
});

// GET /api/production-po/:id - Detail 1 PO
productionPoRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const po = await prisma.productionPO.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!po) {
      return c.json({ error: 'Surat PO tidak ditemukan' }, 404);
    }

    return c.json(po);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil detail PO: ' + err.message }, 500);
  }
});

// POST /api/production-po - Buat PO Baru
productionPoRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      noPO: string;
      brand: string;
      vendorTujuan: string;
      tanggalPO: string;
      targetDeadline: string;
      catatan?: string;
      status?: string;
      items: {
        namaProduk: string;
        warna?: string;
        ukuran?: string;
        qty: number;
        bahanKain?: string;
        catatan?: string;
      }[];
    }>();

    if (!body.noPO || !body.brand) {
      return c.json({ error: 'Nomor PO dan Brand pemesan wajib diisi.' }, 400);
    }

    if (!body.items || body.items.length === 0) {
      return c.json({ error: 'Minimal harus ada 1 item produk dalam PO.' }, 400);
    }

    // Cek duplikasi noPO
    const existing = await prisma.productionPO.findUnique({
      where: { noPO: body.noPO.trim() },
    });
    if (existing) {
      return c.json({ error: `Nomor PO "${body.noPO}" sudah digunakan sebelumnya.` }, 400);
    }

    const totalPcs = body.items.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0);

    const newPO = await prisma.productionPO.create({
      data: {
        noPO: body.noPO.trim(),
        brand: body.brand.trim(),
        vendorTujuan: body.vendorTujuan ? body.vendorTujuan.trim() : '',
        tanggalPO: new Date(body.tanggalPO || new Date().toISOString()),
        targetDeadline: new Date(body.targetDeadline || new Date().toISOString()),
        catatan: body.catatan || null,
        status: body.status || 'DRAFT',
        totalPcs,
        items: {
          create: body.items.map((item, idx) => ({
            namaProduk: item.namaProduk.trim(),
            warna: item.warna?.trim() || null,
            ukuran: item.ukuran?.trim() || null,
            qty: Math.max(0, Number(item.qty) || 0),
            bahanKain: item.bahanKain?.trim() || null,
            catatan: item.catatan?.trim() || null,
            sortOrder: typeof (item as any).sortOrder === 'number' ? (item as any).sortOrder : idx,
          })),
        },
      },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return c.json({
      success: true,
      message: 'Surat PO Produksi berhasil disimpan ke database.',
      data: newPO,
    }, 201);
  } catch (err: any) {
    console.error('[PO-CREATE-ERROR]', err);
    return c.json({ error: 'Gagal membuat Surat PO: ' + err.message }, 500);
  }
});

// PUT /api/production-po/:id - Edit PO & Items
productionPoRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      noPO?: string;
      brand?: string;
      vendorTujuan?: string;
      tanggalPO?: string;
      targetDeadline?: string;
      catatan?: string;
      status?: string;
      items?: {
        namaProduk: string;
        warna?: string;
        ukuran?: string;
        qty: number;
        bahanKain?: string;
        catatan?: string;
      }[];
    }>();

    const existing = await prisma.productionPO.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Surat PO tidak ditemukan.' }, 404);
    }

    // Jika nomor PO diubah, pastikan tidak duplikat dengan PO lain
    if (body.noPO && body.noPO.trim() !== existing.noPO) {
      const dup = await prisma.productionPO.findUnique({
        where: { noPO: body.noPO.trim() },
      });
      if (dup) {
        return c.json({ error: `Nomor PO "${body.noPO}" sudah digunakan.` }, 400);
      }
    }

    // Update via transaction jika ada items
    const updated = await prisma.$transaction(async (tx) => {
      let totalPcs = existing.totalPcs;

      if (body.items && body.items.length > 0) {
        totalPcs = body.items.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0);
        // Hapus item lama
        await tx.productionPOItem.deleteMany({ where: { poId: id } });
        // Buat item baru
        await tx.productionPOItem.createMany({
          data: body.items.map((item, idx) => ({
            poId: id,
            namaProduk: item.namaProduk.trim(),
            warna: item.warna?.trim() || null,
            ukuran: item.ukuran?.trim() || null,
            qty: Math.max(0, Number(item.qty) || 0),
            bahanKain: item.bahanKain?.trim() || null,
            catatan: item.catatan?.trim() || null,
            sortOrder: typeof (item as any).sortOrder === 'number' ? (item as any).sortOrder : idx,
          })),
        });
      }

      return tx.productionPO.update({
        where: { id },
        data: {
          noPO: body.noPO ? body.noPO.trim() : undefined,
          brand: body.brand ? body.brand.trim() : undefined,
          vendorTujuan: body.vendorTujuan !== undefined ? body.vendorTujuan.trim() : undefined,
          tanggalPO: body.tanggalPO ? new Date(body.tanggalPO) : undefined,
          targetDeadline: body.targetDeadline ? new Date(body.targetDeadline) : undefined,
          catatan: body.catatan !== undefined ? body.catatan : undefined,
          status: body.status || undefined,
          totalPcs,
        },
        include: {
          items: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      });
    });

    return c.json({
      success: true,
      message: 'Surat PO Produksi berhasil diperbarui.',
      data: updated,
    });
  } catch (err: any) {
    console.error('[PO-UPDATE-ERROR]', err);
    return c.json({ error: 'Gagal memperbarui Surat PO: ' + err.message }, 500);
  }
});

// PATCH /api/production-po/:id/status - Quick status update
productionPoRoutes.patch('/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json<{ status: string }>();

    const validStatuses = ['DRAFT', 'DIKIRIM', 'DALAM_PROSES', 'SELESAI'];
    if (!status || !validStatuses.includes(status)) {
      return c.json({ error: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}` }, 400);
    }

    const updated = await prisma.productionPO.update({
      where: { id },
      data: { status },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return c.json({
      success: true,
      message: `Status PO berhasil diubah menjadi ${status}.`,
      data: updated,
    });
  } catch (err: any) {
    return c.json({ error: 'Gagal mengubah status PO: ' + err.message }, 500);
  }
});

// DELETE /api/production-po/:id - Hapus PO
productionPoRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.productionPO.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: 'Surat PO Produksi berhasil dihapus.',
    });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus Surat PO: ' + err.message }, 500);
  }
});
