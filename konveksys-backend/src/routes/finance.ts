import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const financeRoutes = new Hono();
financeRoutes.use('*', authMiddleware);

// Kasbon
financeRoutes.get('/kasbon', adminOnly, async (c) => {
  const list = await prisma.kasbonTransaction.findMany({ orderBy: { tanggal: 'desc' } });
  return c.json(list);
});
financeRoutes.post('/kasbon', adminOnly, async (c) => {
  const body = await c.req.json();
  const data = await prisma.kasbonTransaction.create({
    data: { ...body, jumlah: parseFloat(body.jumlah), tanggal: new Date(body.tanggal) },
  });
  return c.json(data, 201);
});

// Payroll Vendor (kalkulasi dari surat jalan)
financeRoutes.get('/payroll/:vendorName', adminOnly, async (c) => {
  const { vendorName } = c.req.param();
  const hargaList = await prisma.hargaKonveksi.findMany({ where: { vendor: vendorName } });
  const suratJalanList = await prisma.suratJalan.findMany({ where: { vendor: vendorName } });
  const kasbon = await prisma.kasbonTransaction.findMany({ where: { vendor: vendorName } });

  const totalKasbon = kasbon
    .reduce((acc, k) => k.tipe === 'PINJAMAN' ? acc + Number(k.jumlah) : acc - Number(k.jumlah), 0);

  const items = suratJalanList.map((sj) => {
    const rate = hargaList.find((h) => h.brand === sj.brand && h.produk === sj.produk);
    const hargaSatuan = rate ? Number(rate.harga) : 0;
    const totalPcs = sj.totalPcs;
    const totalAmount = totalPcs * hargaSatuan;
    return { suratJalanNo: sj.noSuratJalan, brand: sj.brand, produk: sj.produk, totalPcs, hargaSatuan, totalAmount };
  });

  const grandTotal = items.reduce((a, b) => a + b.totalAmount, 0);
  return c.json({ vendor: vendorName, items, grandTotal, kasbon: totalKasbon, netto: grandTotal - totalKasbon });
});

// Invoice Buyer
financeRoutes.get('/invoice/:brandName', async (c) => {
  const { brandName } = c.req.param();
  const user = c.get('user');
  if (user.role === 'BRAND' && user.brandName !== brandName) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const hargaList = await prisma.hargaBuyer.findMany({ where: { brand: brandName } });
  const suratJalanList = await prisma.suratJalan.findMany({ where: { brand: brandName } });

  const items = suratJalanList.map((sj) => {
    const rates = hargaList.find((h) => h.produk === sj.produk);
    const totalAmount =
      sj.qtySML * Number(rates?.rateSML || 0) +
      sj.qtyM * Number(rates?.rateSML || 0) +
      sj.qtyL * Number(rates?.rateSML || 0) +
      sj.qtyXL * Number(rates?.rateXL || 0) +
      sj.qtyXXL * Number(rates?.rateXL || 0) +
      sj.qtyAnak4 * Number(rates?.rateAnak4 || 0) +
      sj.qtyAnak6 * Number(rates?.rateAnak6 || 0) +
      sj.qtyAnak8 * Number(rates?.rateAnak8 || 0) +
      sj.qtyAnak10 * Number(rates?.rateAnak10 || 0) +
      sj.qtyAnak12 * Number(rates?.rateAnak12 || 0) +
      sj.qtyAnak14 * Number(rates?.rateAnak14 || 0) +
      sj.qtyAnak16 * Number(rates?.rateAnak16 || 0);
    return { suratJalanNo: sj.noSuratJalan, tanggal: sj.tanggal, produk: sj.produk, totalPcs: sj.totalPcs, totalAmount };
  });

  const grandTotal = items.reduce((a, b) => a + b.totalAmount, 0);
  return c.json({ brand: brandName, items, grandTotal });
});