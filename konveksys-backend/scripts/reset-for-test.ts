import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetForTest() {
  console.log('====================================================');
  console.log('  MEMBERSIHKAN DATABASE UNTUK PENGUJIAN ALUR BARU   ');
  console.log('====================================================\n');

  try {
    // 1. Hapus transaksi & data yang berelasi ke Brand
    console.log('[1/4] Menghapus data transaksi dan relasi brand...');
    await prisma.brandSale.deleteMany({});
    await prisma.brandStockExit.deleteMany({});
    await prisma.brandProductSKU.deleteMany({});
    await prisma.returnItem.deleteMany({});
    await prisma.suratJalan.deleteMany({});
    await prisma.spkRol.deleteMany({});
    await prisma.spkCutting.deleteMany({});
    await prisma.inboundRoll.deleteMany({});
    await prisma.pembayaranBrand.deleteMany({});
    await prisma.hargaBuyer.deleteMany({});
    await prisma.hargaKonveksi.deleteMany({});
    await prisma.productionPOItem.deleteMany({});
    await prisma.productionPO.deleteMany({});
    console.log('      -> Transaksi & relasi brand berhasil dibersihkan.');

    // 2. Hapus semua Master Brand
    console.log('[2/4] Menghapus seluruh brand di tabel Master Brand...');
    const deletedBrands = await prisma.brand.deleteMany({});
    console.log(`      -> ${deletedBrands.count} brand berhasil dihapus.`);

    // 3. Hapus semua user KECUALI yang memiliki role ADMIN
    console.log('[3/4] Menghapus semua user mitra (non-admin)...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' },
      },
    });
    console.log(`      -> ${deletedUsers.count} akun pengguna non-admin berhasil dihapus.`);

    // 4. Pastikan akun Admin utama tetap aman dan aktif
    console.log('[4/4] Memverifikasi akun Admin utama...');
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin Maison Rayyan',
          email: 'admin@konveksys.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          accessibleBrands: [],
          brandName: null,
        },
      });
      console.log(`      -> Akun Admin baru dibuat: ${newAdmin.email} (Password default: admin)`);
    } else {
      // Pastikan data admin bersih dari relasi brand lama
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          brandName: null,
          accessibleBrands: [],
          status: 'ACTIVE',
        },
      });
      console.log(`      -> Akun Admin dipertahankan: ${existingAdmin.email} (Role: ADMIN, Status: ACTIVE)`);
    }

    // Tampilkan verifikasi akhir
    const countUsers = await prisma.user.count();
    const countBrands = await prisma.brand.count();
    const countRolls = await prisma.inboundRoll.count();

    console.log('\n====================================================');
    console.log('             HASIL AKHIR BERSIH-BERSIH              ');
    console.log('====================================================');
    console.log(`  User di Database  : ${countUsers} (Hanya Admin)`);
    console.log(`  Brand di Database : ${countBrands} (Kosong - Siap Daftar Baru)`);
    console.log(`  Kain di Database  : ${countRolls} (Kosong - Siap Input Baru)`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Terjadi kesalahan saat mereset database:', error);
    process.exit(1);
  }
}

resetForTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
