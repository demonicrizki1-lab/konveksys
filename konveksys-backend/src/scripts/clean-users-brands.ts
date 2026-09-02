import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('--- CLEANING BRANDS & USERS ---');

  // 1. Cari dan hapus brand Kuzi, Prodigo, Alpha (serta relasinya jika ada)
  const targetBrands = ['KUZI', 'PRODIGO', 'ALPHA', 'kuzi', 'prodigo', 'alpha'];
  for (const bName of targetBrands) {
    const found = await prisma.brand.findFirst({
      where: { name: { equals: bName, mode: 'insensitive' } }
    });
    if (found) {
      console.log(`Menghapus Brand: ${found.name} (ID: ${found.id})`);
      // Hapus relasi jika ada
      await prisma.returnItem.deleteMany({ where: { brand: found.name } });
      await prisma.suratJalan.deleteMany({ where: { brand: found.name } });
      await prisma.spkCutting.deleteMany({ where: { brand: found.name } });
      await prisma.inboundRoll.deleteMany({ where: { brand: found.name } });
      await prisma.hargaKonveksi.deleteMany({ where: { brand: found.name } });
      await prisma.hargaBuyer.deleteMany({ where: { brand: found.name } });
      await prisma.pembayaranBrand.deleteMany({ where: { brand: found.name } });
      await prisma.brand.delete({ where: { id: found.id } });
      console.log(`Brand ${found.name} berhasil dihapus.`);
    }
  }

  // 2. Hapus semua user KECUALI admin
  console.log('2. Menghapus semua user non-admin...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: { not: 'ADMIN' },
      email: { not: 'admin@konveksys.com' }
    }
  });
  console.log(`Jumlah user non-admin yang dihapus: ${deletedUsers.count}`);

  // 3. Pastikan user admin tetap ada dan aktif
  const admin = await prisma.user.upsert({
    where: { email: 'admin@konveksys.com' },
    update: {
      name: 'Admin Maison Rayyan',
      password: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      id: 'u-admin',
      name: 'Admin Maison Rayyan',
      email: 'admin@konveksys.com',
      password: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      accessibleBrands: [],
    }
  });
  console.log(`User Admin aktif: ${admin.email} (Role: ${admin.role})`);

  // 4. Cek daftar Brand yang tersisa di database
  const remainingBrands = await prisma.brand.findMany({ select: { name: true, code: true } });
  console.log('Daftar Brand yang ada saat ini:', remainingBrands.map(b => `${b.name} (${b.code})`));

  // 5. Cek daftar User yang tersisa di database
  const remainingUsers = await prisma.user.findMany({ select: { email: true, name: true, role: true } });
  console.log('Daftar User yang ada saat ini:', remainingUsers);

  console.log('--- PEMBERSIHAN SELESAI! ---');
}

cleanData()
  .catch((e) => {
    console.error('Error saat membersihkan data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });