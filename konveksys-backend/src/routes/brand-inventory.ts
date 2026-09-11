import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const brandInventoryRoutes = new Hono();
brandInventoryRoutes.use('*', authMiddleware);

// Helper function to resolve effective brand
function getEffectiveBrand(c: any, queryBrand?: string): string | null {
  const user = c.get('user');
  if (user.role === 'BRAND') {
    const allowed = [
      ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
      ...(user.brandName ? [user.brandName] : []),
    ]
      .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
      .map((b: string) => b.trim().toUpperCase())
      .filter(Boolean);

    if (queryBrand && allowed.includes(queryBrand.toUpperCase())) {
      return queryBrand.toUpperCase();
    }
    return allowed[0] || user.brandName || null;
  }
  return queryBrand && queryBrand !== 'ALL' ? queryBrand : null;
}

// ============================================================
// 1. PRODUCT SKUs (Master SKU & Stok Awal)
// ============================================================

// GET /api/brand-inventory/skus - Get SKUs
brandInventoryRoutes.get('/skus', async (c) => {
  try {
    const queryBrand = c.req.query('brand');
    const brand = getEffectiveBrand(c, queryBrand);

    const where: any = {};
    if (brand) {
      where.brand = brand;
    }

    const skus = await prisma.brandProductSKU.findMany({
      where,
      orderBy: [{ produk: 'asc' }, { sku: 'asc' }],
    });

    return c.json(skus);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data SKU: ' + err.message }, 500);
  }
});

// POST /api/brand-inventory/skus - Create new SKU
brandInventoryRoutes.post('/skus', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      brand?: string;
      produk: string;
      sku: string;
      warna?: string;
      ukuran?: string;
      hpp: number;
      stokAwal?: number;
      catatan?: string;
    }>();

    let targetBrand = body.brand ? String(body.brand).trim().toUpperCase() : undefined;
    if (user.role === 'BRAND') {
      const allowed = [
        ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
        ...(user.brandName ? [user.brandName] : []),
      ]
        .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
        .map((b: string) => b.trim().toUpperCase())
        .filter(Boolean);
      if (!targetBrand || !allowed.includes(targetBrand)) {
        targetBrand = allowed[0] || user.brandName;
      }
    } else {
      targetBrand = targetBrand || body.brand;
    }
    if (!targetBrand) {
      return c.json({ error: 'Brand wajib ditentukan.' }, 400);
    }

    if (!body.produk || !body.sku || body.hpp === undefined) {
      return c.json({ error: 'Nama produk, SKU, dan HPP wajib diisi.' }, 400);
    }

    const skuClean = body.sku.trim().toUpperCase();
    const existing = await prisma.brandProductSKU.findUnique({
      where: {
        brand_sku: {
          brand: targetBrand,
          sku: skuClean,
        },
      },
    });

    if (existing) {
      return c.json({ error: `SKU "${skuClean}" sudah terdaftar untuk brand ${targetBrand}.` }, 400);
    }

    const created = await prisma.brandProductSKU.create({
      data: {
        brand: targetBrand,
        produk: body.produk.trim().toUpperCase(),
        sku: skuClean,
        warna: body.warna?.trim() || null,
        ukuran: body.ukuran?.trim() || null,
        hpp: Number(body.hpp),
        stokAwal: Number(body.stokAwal || 0),
        catatan: body.catatan?.trim() || null,
      },
    });

    return c.json({ success: true, message: 'SKU berhasil ditambahkan.', data: created }, 201);
  } catch (err: any) {
    return c.json({ error: 'Gagal menambahkan SKU: ' + err.message }, 500);
  }
});

// PUT /api/brand-inventory/skus/:id - Update SKU
brandInventoryRoutes.put('/skus/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');
    const body = await c.req.json<{
      produk?: string;
      sku?: string;
      warna?: string;
      ukuran?: string;
      hpp?: number;
      stokAwal?: number;
      catatan?: string;
    }>();

    const existing = await prisma.brandProductSKU.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'SKU tidak ditemukan.' }, 404);
    }

    if (user.role === 'BRAND' && existing.brand !== user.brandName) {
      return c.json({ error: 'Akses ditolak.' }, 403);
    }

    const updateData: any = {};
    if (body.produk !== undefined) updateData.produk = body.produk.trim().toUpperCase();
    if (body.sku !== undefined) updateData.sku = body.sku.trim().toUpperCase();
    if (body.warna !== undefined) updateData.warna = body.warna.trim() || null;
    if (body.ukuran !== undefined) updateData.ukuran = body.ukuran.trim() || null;
    if (body.hpp !== undefined) updateData.hpp = Number(body.hpp);
    if (body.stokAwal !== undefined) updateData.stokAwal = Number(body.stokAwal);
    if (body.catatan !== undefined) updateData.catatan = body.catatan.trim() || null;

    const updated = await prisma.brandProductSKU.update({
      where: { id },
      data: updateData,
    });

    return c.json({ success: true, message: 'Data SKU berhasil diperbarui.', data: updated });
  } catch (err: any) {
    return c.json({ error: 'Gagal memperbarui SKU: ' + err.message }, 500);
  }
});

// DELETE /api/brand-inventory/skus/:id - Delete SKU
brandInventoryRoutes.delete('/skus/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const existing = await prisma.brandProductSKU.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'SKU tidak ditemukan.' }, 404);
    }

    if (user.role === 'BRAND' && existing.brand !== user.brandName) {
      return c.json({ error: 'Akses ditolak.' }, 403);
    }

    await prisma.brandProductSKU.delete({ where: { id } });
    return c.json({ success: true, message: 'SKU berhasil dihapus.' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus SKU: ' + err.message }, 500);
  }
});

// ============================================================
// 2. BRAND SALES (Penjualan Marketplace)
// ============================================================

// GET /api/brand-inventory/sales - Get Sales
brandInventoryRoutes.get('/sales', async (c) => {
  try {
    const queryBrand = c.req.query('brand');
    const brand = getEffectiveBrand(c, queryBrand);

    const where: any = {};
    if (brand) {
      where.brand = brand;
    }

    const sales = await prisma.brandSale.findMany({
      where,
      orderBy: { tanggal: 'desc' },
    });

    return c.json(sales);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data penjualan: ' + err.message }, 500);
  }
});

// POST /api/brand-inventory/sales - Create Sale Record
brandInventoryRoutes.post('/sales', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      brand?: string;
      tanggal: string;
      marketplace: string;
      toko?: string;
      noPesanan?: string;
      username?: string;
      skuId?: string;
      sku: string;
      qty: number;
      hpp?: number;
      omset: number;
      biayaIklan?: number;
      biayaOperasional?: number;
      catatan?: string;
    }>();

    let targetBrand = body.brand ? String(body.brand).trim().toUpperCase() : undefined;
    if (user.role === 'BRAND') {
      const allowed = [
        ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
        ...(user.brandName ? [user.brandName] : []),
      ]
        .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
        .map((b: string) => b.trim().toUpperCase())
        .filter(Boolean);
      if (!targetBrand || !allowed.includes(targetBrand)) {
        targetBrand = allowed[0] || user.brandName;
      }
    } else {
      targetBrand = targetBrand || body.brand;
    }
    if (!targetBrand) {
      return c.json({ error: 'Brand wajib ditentukan.' }, 400);
    }

    if (!body.tanggal || !body.marketplace || !body.sku || !body.qty || body.omset === undefined) {
      return c.json({ error: 'Tanggal, marketplace, SKU, QTY, dan Omset wajib diisi.' }, 400);
    }

    // Resolve HPP from SKU if not provided
    let finalHpp = body.hpp !== undefined ? Number(body.hpp) : 0;
    let resolvedSkuId = body.skuId || null;

    if (!finalHpp || !resolvedSkuId) {
      const skuDoc = await prisma.brandProductSKU.findFirst({
        where: { brand: targetBrand, sku: body.sku.trim().toUpperCase() },
      });
      if (skuDoc) {
        resolvedSkuId = skuDoc.id;
        if (!finalHpp) finalHpp = Number(skuDoc.hpp);
      }
    }

    const qty = Number(body.qty || 1);
    const omset = Number(body.omset || 0);
    const iklan = Number(body.biayaIklan || 0);
    const operasional = Number(body.biayaOperasional || 0);
    const totalHpp = finalHpp * qty;
    const profit = omset - totalHpp - iklan - operasional;

    const sale = await prisma.brandSale.create({
      data: {
        brand: targetBrand,
        tanggal: new Date(body.tanggal),
        marketplace: body.marketplace.toUpperCase().trim(),
        toko: body.toko?.trim() || null,
        noPesanan: body.noPesanan?.trim() || null,
        username: body.username?.trim() || null,
        skuId: resolvedSkuId,
        sku: body.sku.trim().toUpperCase(),
        qty,
        hpp: finalHpp,
        omset,
        biayaIklan: iklan,
        biayaOperasional: operasional,
        estimasiProfit: profit,
        catatan: body.catatan?.trim() || null,
      },
    });

    return c.json({ success: true, message: 'Transaksi penjualan berhasil dicatat.', data: sale }, 201);
  } catch (err: any) {
    return c.json({ error: 'Gagal mencatat penjualan: ' + err.message }, 500);
  }
});

// DELETE /api/brand-inventory/sales/:id - Delete Sale Record
brandInventoryRoutes.delete('/sales/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const existing = await prisma.brandSale.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Data penjualan tidak ditemukan.' }, 404);
    }

    if (user.role === 'BRAND' && existing.brand !== user.brandName) {
      return c.json({ error: 'Akses ditolak.' }, 403);
    }

    await prisma.brandSale.delete({ where: { id } });
    return c.json({ success: true, message: 'Data penjualan berhasil dihapus.' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus penjualan: ' + err.message }, 500);
  }
});

// ============================================================
// 3. BRAND STOCK EXITS (Barang Keluar: Sample / Endorse / Reject)
// ============================================================

// GET /api/brand-inventory/stock-exits - Get Stock Exits
brandInventoryRoutes.get('/stock-exits', async (c) => {
  try {
    const queryBrand = c.req.query('brand');
    const brand = getEffectiveBrand(c, queryBrand);

    const where: any = {};
    if (brand) {
      where.brand = brand;
    }

    const exits = await prisma.brandStockExit.findMany({
      where,
      orderBy: { tanggal: 'desc' },
    });

    return c.json(exits);
  } catch (err: any) {
    return c.json({ error: 'Gagal mengambil data barang keluar: ' + err.message }, 500);
  }
});

// POST /api/brand-inventory/stock-exits - Create Stock Exit Record
brandInventoryRoutes.post('/stock-exits', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{
      brand?: string;
      tanggal: string;
      skuId?: string;
      sku: string;
      qty: number;
      kategori: string;
      keterangan?: string;
    }>();

    let targetBrand = body.brand ? String(body.brand).trim().toUpperCase() : undefined;
    if (user.role === 'BRAND') {
      const allowed = [
        ...(Array.isArray(user.accessibleBrands) ? user.accessibleBrands : []),
        ...(user.brandName ? [user.brandName] : []),
      ]
        .flatMap((b: string) => (typeof b === 'string' ? b.split(/[,;\n]+/) : []))
        .map((b: string) => b.trim().toUpperCase())
        .filter(Boolean);
      if (!targetBrand || !allowed.includes(targetBrand)) {
        targetBrand = allowed[0] || user.brandName;
      }
    } else {
      targetBrand = targetBrand || body.brand;
    }
    if (!targetBrand) {
      return c.json({ error: 'Brand wajib ditentukan.' }, 400);
    }

    if (!body.tanggal || !body.sku || !body.qty || !body.kategori) {
      return c.json({ error: 'Tanggal, SKU, QTY, dan Kategori wajib diisi.' }, 400);
    }

    let resolvedSkuId = body.skuId || null;
    if (!resolvedSkuId) {
      const skuDoc = await prisma.brandProductSKU.findFirst({
        where: { brand: targetBrand, sku: body.sku.trim().toUpperCase() },
      });
      if (skuDoc) resolvedSkuId = skuDoc.id;
    }

    const exit = await prisma.brandStockExit.create({
      data: {
        brand: targetBrand,
        tanggal: new Date(body.tanggal),
        skuId: resolvedSkuId,
        sku: body.sku.trim().toUpperCase(),
        qty: Number(body.qty || 1),
        kategori: body.kategori.toUpperCase().trim(),
        keterangan: body.keterangan?.trim() || null,
      },
    });

    return c.json({ success: true, message: 'Barang keluar berhasil dicatat.', data: exit }, 201);
  } catch (err: any) {
    return c.json({ error: 'Gagal mencatat barang keluar: ' + err.message }, 500);
  }
});

// DELETE /api/brand-inventory/stock-exits/:id - Delete Stock Exit
brandInventoryRoutes.delete('/stock-exits/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const existing = await prisma.brandStockExit.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: 'Data barang keluar tidak ditemukan.' }, 404);
    }

    if (user.role === 'BRAND' && existing.brand !== user.brandName) {
      return c.json({ error: 'Akses ditolak.' }, 403);
    }

    await prisma.brandStockExit.delete({ where: { id } });
    return c.json({ success: true, message: 'Data barang keluar berhasil dihapus.' });
  } catch (err: any) {
    return c.json({ error: 'Gagal menghapus data barang keluar: ' + err.message }, 500);
  }
});
