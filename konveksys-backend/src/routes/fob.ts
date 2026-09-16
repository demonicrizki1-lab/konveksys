import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const fobRoutes = new Hono();
fobRoutes.use('*', authMiddleware);

// ============================================================
// 1. HPP CALCULATION RECORDS
// ============================================================

// GET /api/fob/hpp - List all HPP records
fobRoutes.get('/hpp', async (c) => {
  try {
    const brand = c.req.query('brand');
    const kategori = c.req.query('kategori');
    const search = c.req.query('search');

    const where: any = {};
    if (brand && brand !== 'ALL') {
      where.brand = brand;
    }
    if (kategori && kategori !== 'ALL') {
      where.kategori = kategori;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { noHpp: { contains: q, mode: 'insensitive' } },
        { namaProduk: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { kodeProduk: { contains: q, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.fobHppRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return c.json(records);
  } catch (err: any) {
    console.error('[FOB-HPP-GET-ERROR]', err);
    return c.json({ error: 'Gagal mengambil data HPP: ' + err.message }, 500);
  }
});

// GET /api/fob/hpp/:id - Detail 1 HPP record
fobRoutes.get('/hpp/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const record = await prisma.fobHppRecord.findUnique({
      where: { id },
    });
    if (!record) {
      return c.json({ error: 'Data HPP tidak ditemukan' }, 404);
    }
    return c.json(record);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data HPP: ' + err.message }, 500);
  }
});

// Helper auto-generate No HPP: HPP/YYYY/0001
async function generateNextHppNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `HPP/${currentYear}/`;
  const lastRecord = await prisma.fobHppRecord.findFirst({
    where: {
      noHpp: {
        startsWith: prefix,
      },
    },
    orderBy: {
      noHpp: 'desc',
    },
  });

  if (!lastRecord) {
    return `${prefix}0001`;
  }

  const parts = lastRecord.noHpp.split('/');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// POST /api/fob/hpp - Create HPP calculation
fobRoutes.post('/hpp', async (c) => {
  try {
    const body = await c.req.json();
    let noHpp = body.noHpp;
    if (!noHpp || noHpp.trim() === '' || noHpp.includes('AUTO')) {
      noHpp = await generateNextHppNumber();
    }

    const created = await prisma.fobHppRecord.create({
      data: {
        noHpp,
        tanggal: body.tanggal ? new Date(body.tanggal) : new Date(),
        namaProduk: body.namaProduk || 'Untitled Product',
        kodeProduk: body.kodeProduk || null,
        size: body.size || 'ALL SIZE',
        kategori: body.kategori || 'Kaos',
        brand: body.brand || 'UMUM',
        vendorCmt: body.vendorCmt || null,
        batchQty: Number(body.batchQty) || 100,

        targetLabaPercent: Number(body.targetLabaPercent) || 30,
        rejectPercent: Number(body.rejectPercent) || 3,
        ppnPercent: Number(body.ppnPercent) || 0,
        zakatPercent: Number(body.zakatPercent) || 0,
        affiliatePercent: Number(body.affiliatePercent) || 0,

        hppBahanTotal: Number(body.hppBahanTotal) || 0,
        hppCmtTotal: Number(body.hppCmtTotal) || 0,
        totalSebelumReject: Number(body.totalSebelumReject) || 0,
        nilaiReject: Number(body.nilaiReject) || 0,
        hppFinalPerPcs: Number(body.hppFinalPerPcs) || 0,
        hargaJualRekomendasi: Number(body.hargaJualRekomendasi) || 0,
        labaBersihPerPcs: Number(body.labaBersihPerPcs) || 0,

        totalBiayaBatch: Number(body.totalBiayaBatch) || 0,
        totalOmzetBatch: Number(body.totalOmzetBatch) || 0,
        totalLabaBatch: Number(body.totalLabaBatch) || 0,
        catatan: body.catatan || null,

        components: body.components || [],
      },
    });

    return c.json({ success: true, message: 'Kalkulasi HPP berhasil disimpan', data: created }, 201);
  } catch (err: any) {
    console.error('[FOB-HPP-CREATE-ERROR]', err);
    return c.json({ error: 'Gagal menyimpan kalkulasi HPP: ' + err.message }, 500);
  }
});

// PUT /api/fob/hpp/:id - Update HPP calculation
fobRoutes.put('/hpp/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const updated = await prisma.fobHppRecord.update({
      where: { id },
      data: {
        ...(body.namaProduk && { namaProduk: body.namaProduk }),
        ...(body.kodeProduk !== undefined && { kodeProduk: body.kodeProduk }),
        ...(body.size && { size: body.size }),
        ...(body.kategori && { kategori: body.kategori }),
        ...(body.brand && { brand: body.brand }),
        ...(body.vendorCmt !== undefined && { vendorCmt: body.vendorCmt }),
        ...(body.batchQty !== undefined && { batchQty: Number(body.batchQty) }),

        ...(body.targetLabaPercent !== undefined && { targetLabaPercent: Number(body.targetLabaPercent) }),
        ...(body.rejectPercent !== undefined && { rejectPercent: Number(body.rejectPercent) }),
        ...(body.ppnPercent !== undefined && { ppnPercent: Number(body.ppnPercent) }),
        ...(body.zakatPercent !== undefined && { zakatPercent: Number(body.zakatPercent) }),
        ...(body.affiliatePercent !== undefined && { affiliatePercent: Number(body.affiliatePercent) }),

        ...(body.hppBahanTotal !== undefined && { hppBahanTotal: Number(body.hppBahanTotal) }),
        ...(body.hppCmtTotal !== undefined && { hppCmtTotal: Number(body.hppCmtTotal) }),
        ...(body.totalSebelumReject !== undefined && { totalSebelumReject: Number(body.totalSebelumReject) }),
        ...(body.nilaiReject !== undefined && { nilaiReject: Number(body.nilaiReject) }),
        ...(body.hppFinalPerPcs !== undefined && { hppFinalPerPcs: Number(body.hppFinalPerPcs) }),
        ...(body.hargaJualRekomendasi !== undefined && { hargaJualRekomendasi: Number(body.hargaJualRekomendasi) }),
        ...(body.labaBersihPerPcs !== undefined && { labaBersihPerPcs: Number(body.labaBersihPerPcs) }),

        ...(body.totalBiayaBatch !== undefined && { totalBiayaBatch: Number(body.totalBiayaBatch) }),
        ...(body.totalOmzetBatch !== undefined && { totalOmzetBatch: Number(body.totalOmzetBatch) }),
        ...(body.totalLabaBatch !== undefined && { totalLabaBatch: Number(body.totalLabaBatch) }),
        ...(body.catatan !== undefined && { catatan: body.catatan }),
        ...(body.components !== undefined && { components: body.components }),
      },
    });

    return c.json({ success: true, message: 'Kalkulasi HPP berhasil diperbarui', data: updated });
  } catch (err: any) {
    console.error('[FOB-HPP-UPDATE-ERROR]', err);
    return c.json({ error: 'Gagal memperbarui kalkulasi HPP: ' + err.message }, 500);
  }
});

// DELETE /api/fob/hpp/:id - Delete HPP calculation
fobRoutes.delete('/hpp/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.fobHppRecord.delete({ where: { id } });
    return c.json({ success: true, message: 'Kalkulasi HPP berhasil dihapus' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus kalkulasi HPP: ' + err.message }, 500);
  }
});

// ============================================================
// 2. SURAT PENAWARAN HARGA (SPH)
// ============================================================

async function generateNextQuotationNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SPH/${currentYear}/`;
  const lastRecord = await prisma.fobQuotation.findFirst({
    where: {
      noSurat: {
        startsWith: prefix,
      },
    },
    orderBy: {
      noSurat: 'desc',
    },
  });

  if (!lastRecord) {
    return `${prefix}0001`;
  }

  const parts = lastRecord.noSurat.split('/');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// GET /api/fob/quotations - List quotations
fobRoutes.get('/quotations', async (c) => {
  try {
    const search = c.req.query('search');
    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { noSurat: { contains: q, mode: 'insensitive' } },
        { buyerName: { contains: q, mode: 'insensitive' } },
        { buyerCompany: { contains: q, mode: 'insensitive' } },
      ];
    }
    const quotations = await prisma.fobQuotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return c.json(quotations);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data SPH: ' + err.message }, 500);
  }
});

// GET /api/fob/quotations/:id - Detail 1 quotation
fobRoutes.get('/quotations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const quotation = await prisma.fobQuotation.findUnique({ where: { id } });
    if (!quotation) return c.json({ error: 'SPH tidak ditemukan' }, 404);
    return c.json(quotation);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data SPH: ' + err.message }, 500);
  }
});

// POST /api/fob/quotations - Create quotation
fobRoutes.post('/quotations', async (c) => {
  try {
    const body = await c.req.json();
    let noSurat = body.noSurat;
    if (!noSurat || noSurat.trim() === '' || noSurat.includes('AUTO')) {
      noSurat = await generateNextQuotationNumber();
    }

    const created = await prisma.fobQuotation.create({
      data: {
        noSurat,
        tanggal: body.tanggal ? new Date(body.tanggal) : new Date(),
        buyerName: body.buyerName || 'Buyer',
        buyerCompany: body.buyerCompany || null,
        buyerContact: body.buyerContact || null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        termsDPPercent: Number(body.termsDPPercent) || 50,
        totalQty: Number(body.totalQty) || 0,
        totalOrderNominal: Number(body.totalOrderNominal) || 0,
        nominalDP: Number(body.nominalDP) || 0,
        sisaPelunasan: Number(body.sisaPelunasan) || 0,
        paymentNotes: body.paymentNotes || null,
        productionLeadTime: body.productionLeadTime || null,
        companyProfile: body.companyProfile || null,
        items: body.items || [],
      },
    });

    return c.json({ success: true, message: 'Surat Penawaran Harga berhasil disimpan', data: created }, 201);
  } catch (err: any) {
    return c.json({ error: 'Gagal menyimpan SPH: ' + err.message }, 500);
  }
});

// DELETE /api/fob/quotations/:id - Delete quotation
fobRoutes.delete('/quotations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.fobQuotation.delete({ where: { id } });
    return c.json({ success: true, message: 'SPH berhasil dihapus' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus SPH: ' + err.message }, 500);
  }
});

// ============================================================
// 3. MASTER MATERIAL & MASTER PRODUK
// ============================================================

// GET /api/fob/materials
fobRoutes.get('/materials', async (c) => {
  try {
    const list = await prisma.fobMaterialMaster.findMany({ orderBy: { namaBahan: 'asc' } });
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil master material: ' + err.message }, 500);
  }
});

// POST /api/fob/materials
fobRoutes.post('/materials', async (c) => {
  try {
    const body = await c.req.json();
    const material = await prisma.fobMaterialMaster.upsert({
      where: { kodeMaterial: body.kodeMaterial },
      update: {
        namaBahan: body.namaBahan,
        kategori: body.kategori,
        satuan: body.satuan,
        hargaStandar: Number(body.hargaStandar) || 0,
        supplier: body.supplier || null,
        catatan: body.catatan || null,
      },
      create: {
        kodeMaterial: body.kodeMaterial,
        namaBahan: body.namaBahan,
        kategori: body.kategori,
        satuan: body.satuan,
        hargaStandar: Number(body.hargaStandar) || 0,
        supplier: body.supplier || null,
        catatan: body.catatan || null,
      },
    });
    return c.json({ success: true, data: material });
  } catch (err: any) {
    return c.json({ error: 'Gagal menyimpan master material: ' + err.message }, 500);
  }
});

// DELETE /api/fob/materials/:id
fobRoutes.delete('/materials/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.fobMaterialMaster.delete({ where: { id } });
    return c.json({ success: true, message: 'Material berhasil dihapus' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus material: ' + err.message }, 500);
  }
});

// GET /api/fob/products
fobRoutes.get('/products', async (c) => {
  try {
    const list = await prisma.fobProductMaster.findMany({ orderBy: { namaProduk: 'asc' } });
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil master produk: ' + err.message }, 500);
  }
});

// POST /api/fob/products
fobRoutes.post('/products', async (c) => {
  try {
    const body = await c.req.json();
    const product = await prisma.fobProductMaster.upsert({
      where: {
        kodeProduk_size: {
          kodeProduk: body.kodeProduk,
          size: body.size,
        },
      },
      update: {
        namaProduk: body.namaProduk,
        kategori: body.kategori,
        brand: body.brand || null,
        vendorCmt: body.vendorCmt || null,
        deskripsi: body.deskripsi || null,
      },
      create: {
        kodeProduk: body.kodeProduk,
        namaProduk: body.namaProduk,
        size: body.size,
        kategori: body.kategori,
        brand: body.brand || null,
        vendorCmt: body.vendorCmt || null,
        deskripsi: body.deskripsi || null,
      },
    });
    return c.json({ success: true, data: product });
  } catch (err: any) {
    return c.json({ error: 'Gagal menyimpan master produk: ' + err.message }, 500);
  }
});

// DELETE /api/fob/products/:id
fobRoutes.delete('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.fobProductMaster.delete({ where: { id } });
    return c.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus produk: ' + err.message }, 500);
  }
});
