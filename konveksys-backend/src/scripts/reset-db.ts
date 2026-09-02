import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('--- RESETTING DATABASE TO FRESH STATE ---');

  // 1. Hapus data transaksi operasional
  console.log('1. Menghapus Return / Rework Items...');
  await prisma.returnItem.deleteMany();

  console.log('2. Menghapus Surat Jalan...');
  await prisma.suratJalan.deleteMany();

  console.log('3. Menghapus SPK Cutting & Rols...');
  await prisma.spkRol.deleteMany();
  await prisma.spkCutting.deleteMany();

  console.log('4. Menghapus Inbound Rolls (Stok Kain)...');
  await prisma.inboundRoll.deleteMany();

  console.log('5. Menghapus Kasbon & Pembayaran Brand...');
  await prisma.kasbonTransaction.deleteMany();
  await prisma.pembayaranBrand.deleteMany();

  console.log('6. Menghapus Master Harga (Konveksi & Buyer)...');
  await prisma.hargaKonveksi.deleteMany();
  await prisma.hargaBuyer.deleteMany();

  // 7. Reset Master Brands & Vendors
  console.log('7. Menyiapkan Master Brands & Vendors...');
  const brands = [
    { name: 'GREYWOLF', code: 'GWF', contactPerson: 'Bpk. Adit', phone: '0812-3456-7890' },
    { name: 'CITA-CITA', code: 'CTC', contactPerson: 'Ibu Sarah', phone: '0813-9876-5432' },
    { name: 'CREADIVE', code: 'CRD', contactPerson: 'Bpk. Dimas', phone: '0821-1122-3344' },
    { name: 'JENAKA KIDS', code: 'JNK', contactPerson: 'Ibu Rina', phone: '0857-4455-6677' },
  ];
  for (const b of brands) {
    await prisma.brand.upsert({ where: { name: b.name }, update: b, create: b });
  }

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

  // 8. Pastikan User Admin Aktif
  console.log('8. Menyiapkan Akun Admin & Demo Brand...');
  await prisma.user.upsert({
    where: { email: 'admin@konveksys.com' },
    update: { password: 'admin', status: 'ACTIVE', role: 'ADMIN' },
    create: {
      id: 'u-admin',
      name: 'Admin Maison Rayyan',
      email: 'admin@konveksys.com',
      password: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      accessibleBrands: ['GREYWOLF', 'CITA-CITA', 'CREADIVE', 'JENAKA KIDS'],
    },
  });

  const brandUsers = [
    { id: 'u-greywolf', name: 'Bpk. Adit (GREYWOLF)', email: 'greywolf@brand.com', password: 'brand', brandName: 'GREYWOLF' },
    { id: 'u-citacita', name: 'Ibu Sarah (CITA-CITA)', email: 'citacita@brand.com', password: 'brand', brandName: 'CITA-CITA' },
    { id: 'u-creadive', name: 'Bpk. Dimas (CREADIVE)', email: 'creadive@brand.com', password: 'brand', brandName: 'CREADIVE' },
    { id: 'u-jenaka', name: 'Ibu Rina (JENAKA KIDS)', email: 'jenakakids@brand.com', password: 'brand', brandName: 'JENAKA KIDS' },
  ];
  for (const bu of brandUsers) {
    await prisma.user.upsert({
      where: { email: bu.email },
      update: { password: bu.password, status: 'ACTIVE', role: 'BRAND' },
      create: {
        id: bu.id,
        name: bu.name,
        email: bu.email,
        password: bu.password,
        role: 'BRAND',
        status: 'ACTIVE',
        brandName: bu.brandName,
        accessibleBrands: [bu.brandName],
      },
    });
  }

  console.log('--- DATABASE BERHASIL DIKOSONGKAN & SIAP DIUJI COBA DARI AWAL! ---');
}

resetDatabase()
  .catch((e) => {
    console.error('Error saat reset database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });