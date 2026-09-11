import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { ensureBrandsExist } from './auth.js';

export const brandRoutes = new Hono();
brandRoutes.use('*', authMiddleware);

brandRoutes.get('/', async (c) => {
  // Auto-sync: pastikan semua brand dari user BRAND terdaftar di Master Brand
  try {
    const brandUsers = await prisma.user.findMany({
      where: { role: 'BRAND' },
      select: { id: true, name: true, phone: true, brandName: true, accessibleBrands: true },
    });

    for (const u of brandUsers) {
      const rawBrands = [
        ...(Array.isArray(u.accessibleBrands) ? u.accessibleBrands : []),
        ...(u.brandName ? [u.brandName] : []),
      ];

      const cleanedBrands = Array.from(new Set(
        rawBrands
          .flatMap(raw => (typeof raw === 'string' ? raw.split(/[,;\n]+/) : []))
          .map(b => b.trim().toUpperCase())
          .filter(b => b && b !== 'UNASSIGNED')
      ));

      if (cleanedBrands.length > 0) {
        await ensureBrandsExist(cleanedBrands, u.name, u.phone);

        // Jika user masih menyimpan comma-separated string di DB, rapikan
        const needsFix =
          (u.brandName && u.brandName.includes(',')) ||
          (Array.isArray(u.accessibleBrands) && u.accessibleBrands.some(b => b.includes(','))) ||
          (cleanedBrands.length > (u.accessibleBrands?.length || 0));

        if (needsFix) {
          await prisma.user.update({
            where: { id: u.id },
            data: {
              brandName: cleanedBrands[0] || u.brandName,
              accessibleBrands: cleanedBrands,
            },
          }).catch(() => {});
        }
      }
    }

    // Bersihkan brand koma di tabel Brand jika sempat terbuat
    const commaBrands = await prisma.brand.findMany({
      where: { name: { contains: ',' } },
    });
    for (const cb of commaBrands) {
      const splitNames = cb.name.split(/[,;\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      await ensureBrandsExist(splitNames, cb.contactPerson, cb.phone);
      try {
        await prisma.brand.delete({ where: { id: cb.id } });
      } catch {
        // jika ada relasi FK yang menempel, biarkan
      }
    }
  } catch (err) {
    console.warn('[Auto-sync Brands Error]:', err);
  }

  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  return c.json(brands);
});

brandRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();
  const brand = await prisma.brand.create({ data: body });
  return c.json(brand, 201);
});

brandRoutes.put('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const brand = await prisma.brand.update({ where: { id }, data: body });
  return c.json(brand);
});

brandRoutes.delete('/:id', adminOnly, async (c) => {
  const { id } = c.req.param();
  await prisma.brand.delete({ where: { id } });
  return c.json({ message: 'Brand dihapus' });
});
