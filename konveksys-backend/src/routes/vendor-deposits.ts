import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const vendorDepositRoutes = new Hono();
vendorDepositRoutes.use('*', authMiddleware);

// ============================================================
// SALDO TITIPAN KAIN DI KONVEKSI & SURAT JALAN OPER KAIN
// ============================================================

// GET /api/vendor-fabric-deposits - Ambil semua list saldo titipan
vendorDepositRoutes.get('/', async (c) => {
  try {
    const brand = c.req.query('brand');
    const targetVendor = c.req.query('targetVendor');
    const status = c.req.query('status');
    const search = c.req.query('search');

    const where: any = {};

    if (brand && brand !== 'ALL') {
      where.brand = brand;
    }

    if (targetVendor && targetVendor !== 'ALL') {
      where.targetVendor = targetVendor;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { jenisKain: { contains: q, mode: 'insensitive' } },
        { warna: { contains: q, mode: 'insensitive' } },
        { sourcePONumber: { contains: q, mode: 'insensitive' } },
        { sourceVendor: { contains: q, mode: 'insensitive' } },
        { targetVendor: { contains: q, mode: 'insensitive' } },
      ];
    }

    const deposits = await prisma.vendorFabricDeposit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = deposits.map((d: any) => ({
      ...d,
      panjangAwal: Number(d.panjangAwal),
      panjangSisa: Number(d.panjangSisa),
      tanggalTitip: d.tanggalTitip ? new Date(d.tanggalTitip).toISOString().split('T')[0] : '',
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
      updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
    }));

    return c.json(formatted);
  } catch (err: any) {
    console.error('[VENDOR-DEPOSIT-GET-ERROR]', err);
    return c.json({ error: 'Gagal mengambil data saldo titipan: ' + err.message }, 500);
  }
});

// GET /api/vendor-fabric-deposits/transfer-notes - Ambil semua surat jalan transfer kain
vendorDepositRoutes.get('/transfer-notes', async (c) => {
  try {
    const notes = await prisma.fabricTransferNote.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formatted = notes.map((n: any) => ({
      ...n,
      panjang: Number(n.panjang),
      tanggal: n.tanggal ? new Date(n.tanggal).toISOString().split('T')[0] : '',
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : '',
    }));

    return c.json(formatted);
  } catch (err: any) {
    console.error('[TRANSFER-NOTES-GET-ERROR]', err);
    return c.json({ error: 'Gagal mengambil surat jalan transfer: ' + err.message }, 500);
  }
});

// GET /api/vendor-fabric-deposits/:id - Detail 1 deposit
vendorDepositRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deposit = await prisma.vendorFabricDeposit.findUnique({
      where: { id },
      include: { transferNotes: true },
    });

    if (!deposit) {
      return c.json({ error: 'Data titipan tidak ditemukan' }, 404);
    }

    return c.json({
      ...deposit,
      panjangAwal: Number(deposit.panjangAwal),
      panjangSisa: Number(deposit.panjangSisa),
      tanggalTitip: deposit.tanggalTitip ? new Date(deposit.tanggalTitip).toISOString().split('T')[0] : '',
    });
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil detail titipan: ' + err.message }, 500);
  }
});

// POST /api/vendor-fabric-deposits - Catat sisa / transfer kain baru
vendorDepositRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      id?: string;
      sourcePOId: string;
      sourcePONumber: string;
      sourceVendor: string;
      targetVendor: string;
      brand: string;
      jenisKain: string;
      warna?: string;
      panjang: number;
      satuan?: 'METER' | 'YARD';
      driverName?: string;
      kondisiKain?: string;
      catatan?: string;
    }>();

    if (!body.targetVendor || !body.panjang || Number(body.panjang) <= 0) {
      return c.json({ error: 'Vendor tujuan dan panjang kain (> 0) wajib diisi.' }, 400);
    }

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const isSameVendor = Boolean(
      body.sourceVendor &&
      body.targetVendor &&
      body.sourceVendor.trim().toLowerCase() === body.targetVendor.trim().toLowerCase()
    );
    const prefix = isSameVendor ? 'BA-STB' : 'SJ-TRF';
    const transferNumber = `${prefix}-${dateStr}-${rand}`;
    const panjangVal = Number(body.panjang);

    const depositData: any = {
      sourcePOId: body.sourcePOId || '',
      sourcePONumber: body.sourcePONumber || '',
      sourceVendor: body.sourceVendor || '',
      targetVendor: body.targetVendor,
      brand: body.brand || '',
      jenisKain: body.jenisKain || 'Bahan Kain Sisa',
      warna: body.warna || null,
      panjangAwal: panjangVal,
      panjangSisa: panjangVal,
      satuan: body.satuan || 'METER',
      status: 'TERSEDIA',
      measuredBy: body.driverName || 'Tim Logistik',
      catatan: body.catatan || null,
      tanggalTitip: new Date(),
    };

    if (body.id) {
      depositData.id = body.id;
    }

    const newDeposit = await prisma.vendorFabricDeposit.create({
      data: depositData,
    });

    const newTransferNote = await prisma.fabricTransferNote.create({
      data: {
        transferNumber,
        depositId: newDeposit.id,
        sourcePOId: body.sourcePOId || '',
        sourcePONumber: body.sourcePONumber || '',
        sourceVendor: body.sourceVendor || '',
        targetVendor: body.targetVendor,
        brand: body.brand || '',
        jenisKain: body.jenisKain || 'Bahan Kain Sisa',
        warna: body.warna || null,
        panjang: panjangVal,
        satuan: body.satuan || 'METER',
        driverName: body.driverName || 'Tim Logistik',
        kondisiKain: body.kondisiKain || null,
        tanggal: new Date(),
        catatan: body.catatan || null,
      },
    });

    return c.json({
      success: true,
      message: isSameVendor
        ? `Sisa kain berhasil dicatat standby di ${body.targetVendor} (${transferNumber}).`
        : `Sisa kain berhasil dititipkan ke ${body.targetVendor} (${transferNumber}).`,
      deposit: {
        ...newDeposit,
        panjangAwal: Number(newDeposit.panjangAwal),
        panjangSisa: Number(newDeposit.panjangSisa),
        tanggalTitip: newDeposit.tanggalTitip ? new Date(newDeposit.tanggalTitip).toISOString().split('T')[0] : '',
        createdAt: newDeposit.createdAt ? new Date(newDeposit.createdAt).toISOString() : '',
        updatedAt: newDeposit.updatedAt ? new Date(newDeposit.updatedAt).toISOString() : '',
      },
      transferNote: {
        ...newTransferNote,
        panjang: Number(newTransferNote.panjang),
        tanggal: newTransferNote.tanggal ? new Date(newTransferNote.tanggal).toISOString().split('T')[0] : '',
        createdAt: newTransferNote.createdAt ? new Date(newTransferNote.createdAt).toISOString() : '',
      },
    }, 201);
  } catch (err: any) {
    console.error('[VENDOR-DEPOSIT-POST-ERROR]', err);
    return c.json({ error: 'Gagal mencatat titipan bahan: ' + err.message }, 500);
  }
});

// PUT /api/vendor-fabric-deposits/:id - Update saldo / status / alokasi PO
vendorDepositRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      panjangSisa?: number;
      status?: 'TERSEDIA' | 'TERPAKAI' | 'DITARIK';
      allocatedPOId?: string | null;
      allocatedPONumber?: string | null;
      allocatedSPKId?: string | null;
      allocatedSPKNumber?: string | null;
      catatan?: string | null;
    }>();

    const dataToUpdate: any = {};
    if (body.panjangSisa !== undefined) dataToUpdate.panjangSisa = Number(body.panjangSisa);
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.allocatedPOId !== undefined) dataToUpdate.allocatedPOId = body.allocatedPOId;
    if (body.allocatedPONumber !== undefined) dataToUpdate.allocatedPONumber = body.allocatedPONumber;
    if (body.allocatedSPKId !== undefined) dataToUpdate.allocatedSPKId = body.allocatedSPKId;
    if (body.allocatedSPKNumber !== undefined) dataToUpdate.allocatedSPKNumber = body.allocatedSPKNumber;
    if (body.catatan !== undefined) dataToUpdate.catatan = body.catatan;

    const updated = await prisma.vendorFabricDeposit.update({
      where: { id },
      data: dataToUpdate,
    });

    return c.json({
      success: true,
      data: {
        ...updated,
        panjangAwal: Number(updated.panjangAwal),
        panjangSisa: Number(updated.panjangSisa),
        tanggalTitip: updated.tanggalTitip ? new Date(updated.tanggalTitip).toISOString().split('T')[0] : '',
        createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : '',
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : '',
      },
    });
  } catch (err: any) {
    return c.json({ error: 'Gagal memperbarui saldo titipan: ' + err.message }, 500);
  }
});

// DELETE /api/vendor-fabric-deposits/:id - Hapus titipan
vendorDepositRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.vendorFabricDeposit.delete({
      where: { id },
    });
    return c.json({ success: true, message: 'Data titipan berhasil dihapus.' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus data titipan: ' + err.message }, 500);
  }
});
