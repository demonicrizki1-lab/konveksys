import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database KonvekSys...');

  // Brands
  const brands = [
    { name: 'GREYWOLF', code: 'GWF', contactPerson: 'Bpk. Adit', phone: '0812-3456-7890' },
    { name: 'CITA-CITA', code: 'CTC', contactPerson: 'Ibu Sarah', phone: '0813-9876-5432' },
    { name: 'CREADIVE', code: 'CRD', contactPerson: 'Bpk. Dimas', phone: '0821-1122-3344' },
    { name: 'JENAKA KIDS', code: 'JNK', contactPerson: 'Ibu Rina', phone: '0857-4455-6677' },
  ];
  for (const b of brands) {
    await prisma.brand.upsert({ where: { name: b.name }, update: b, create: b });
  }
  console.log('Brands seeded');

  // Vendors
  const vendors = [
    { name: 'SAHIRA', specialty: 'Kemeja & Kemeja Hawai', contact: '0819-0011-2233' },
    { name: 'RAKSUKAN', specialty: 'Kaos & Pakaian Anak', contact: '0818-4455-6677' },
    { name: 'BU NIKEN', specialty: 'Seragam & Kemeja Formal', contact: '0812-7788-9900' },
    { name: 'KANG SONY', specialty: 'Bedah Standar & Kaos', contact: '0852-3344-5566' },
    { name: 'PA YUSMAN', specialty: 'TNI & Pakaian Taktikal', contact: '0878-9900-1122' },
  ];
  for (const v of vendors) {
    await prisma.vendor.upsert({ where: { name: v.name }, update: v, create: v });
  }
  console.log('Vendors seeded');

  // Harga Konveksi
  const hargaKonveksi = [
    { vendor: 'SAHIRA', produk: 'BEDAH PANJANG', brand: 'GREYWOLF', harga: 12500 },
    { vendor: 'SAHIRA', produk: 'BEDAH PENDEK', brand: 'GREYWOLF', harga: 12500 },
    { vendor: 'RAKSUKAN', produk: 'GOLDIE', brand: 'JENAKA KIDS', harga: 9000 },
    { vendor: 'RAKSUKAN', produk: 'BEDAH PANJANG', brand: 'GREYWOLF', harga: 13000 },
    { vendor: 'RAKSUKAN', produk: 'BEDAH PENDEK', brand: 'GREYWOLF', harga: 13000 },
    { vendor: 'BU NIKEN', produk: 'BEDAH PANJANG', brand: 'CITA-CITA', harga: 14000 },
    { vendor: 'BU NIKEN', produk: 'BEDAH PENDEK', brand: 'CITA-CITA', harga: 14000 },
    { vendor: 'KANG SONY', produk: 'BEDAH PANJANG', brand: 'GREYWOLF', harga: 11500 },
    { vendor: 'KANG SONY', produk: 'BEDAH PENDEK', brand: 'GREYWOLF', harga: 11500 },
    { vendor: 'PA YUSMAN', produk: 'BEDAH PANJANG', brand: 'CITA-CITA', harga: 18500 },
    { vendor: 'PA YUSMAN', produk: 'BEDAH PENDEK', brand: 'CITA-CITA', harga: 18500 },
    { vendor: 'PA YUSMAN', produk: 'TNI', brand: 'CITA-CITA', harga: 18000 },
    { vendor: 'SAHIRA', produk: 'BEDAH PANJANG', brand: 'CITA-CITA', harga: 14000 },
    { vendor: 'SAHIRA', produk: 'BEDAH PENDEK', brand: 'CITA-CITA', harga: 14000 },
    { vendor: 'SAHIRA', produk: 'KEMEJA HAWAI', brand: 'CREADIVE', harga: 15000 },
    { vendor: 'KANG SONY', produk: 'BEDAH PANJANG', brand: 'CREADIVE', harga: 11500 },
    { vendor: 'RAKSUKAN', produk: 'CLARA', brand: 'JENAKA KIDS', harga: 12500 },
  ];
  for (const h of hargaKonveksi) {
    await prisma.hargaKonveksi.upsert({
      where: { vendor_brand_produk: { vendor: h.vendor, brand: h.brand, produk: h.produk } },
      update: { harga: h.harga },
      create: { ...h, harga: h.harga },
    });
  }
  console.log('Harga Konveksi seeded');

  // Harga Buyer
  const hargaBuyer = [
    { brand: 'CITA-CITA', produk: 'BEDAH PANJANG', rateSML: 65000, rateXL: 70000, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'CITA-CITA', produk: 'BEDAH PENDEK', rateSML: 60000, rateXL: 65000, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'GREYWOLF', produk: 'BEDAH PANJANG', rateSML: 31000, rateXL: 34000, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'GREYWOLF', produk: 'BEDAH PENDEK', rateSML: 30000, rateXL: 34000, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'CREADIVE', produk: 'BEDAH PANJANG', rateSML: 33500, rateXL: 33500, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'CREADIVE', produk: 'BEDAH PENDEK', rateSML: 31500, rateXL: 31500, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'CREADIVE', produk: 'KEMEJA HAWAI', rateSML: 30500, rateXL: 30500, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'JENAKA KIDS', produk: 'GOLDIE', rateSML: 0, rateXL: 0, rateAnak4_10: 53000, rateAnak12_16: 54000 },
    { brand: 'CITA-CITA', produk: 'AKPOL', rateSML: 83000, rateXL: 83000, rateAnak4_10: 0, rateAnak12_16: 0 },
    { brand: 'JENAKA KIDS', produk: 'QANITA', rateSML: 0, rateXL: 0, rateAnak4_10: 42500, rateAnak12_16: 45000 },
  ];
  for (const h of hargaBuyer) {
    await prisma.hargaBuyer.upsert({
      where: { brand_produk: { brand: h.brand, produk: h.produk } },
      update: h,
      create: h,
    });
  }
  console.log('Harga Buyer seeded');

  // Kasbon Awal
  const kasbonList = [
    { vendor: 'SAHIRA', tanggal: new Date('2026-08-05'), jumlah: 1500000, tipe: 'PINJAMAN' as const, keterangan: 'Uang muka operasional jahit' },
    { vendor: 'RAKSUKAN', tanggal: new Date('2026-08-08'), jumlah: 800000, tipe: 'PINJAMAN' as const, keterangan: 'Beli jarum & benang' },
    { vendor: 'BU NIKEN', tanggal: new Date('2026-08-10'), jumlah: 500000, tipe: 'PINJAMAN' as const, keterangan: 'Kasbon mingguan' },
    { vendor: 'KANG SONY', tanggal: new Date('2026-08-12'), jumlah: 2000000, tipe: 'PINJAMAN' as const, keterangan: 'Perbaikan mesin obras' },
    { vendor: 'PA YUSMAN', tanggal: new Date('2026-08-15'), jumlah: 350000, tipe: 'PINJAMAN' as const, keterangan: 'Operasional kurir' },
  ];
  for (const k of kasbonList) {
    await prisma.kasbonTransaction.create({ data: k });
  }
  console.log('Kasbon seeded');

  console.log('Seeding selesai!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
