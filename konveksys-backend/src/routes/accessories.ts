import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

export const accessoryRoutes = new Hono();
accessoryRoutes.use('*', authMiddleware);

// GET /api/accessories - List all accessories
accessoryRoutes.get('/', async (c) => {
  const user = c.get('user');
  const where = user.role === 'BRAND' ? {
    OR: [
      { brand: 'UMUM' },
      { brand: user.brandName },
      { brand: null },
    ],
  } : {};

  const items = await prisma.accessory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return c.json(items);
});

// GET /api/accessories/mutations - List all mutations
accessoryRoutes.get('/mutations', async (c) => {
  const mutations = await prisma.accessoryMutation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return c.json(mutations);
});

// POST /api/accessories - Create master accessory (Admin only)
accessoryRoutes.post('/', adminOnly, async (c) => {
  const body = await c.req.json();

  const item = await prisma.accessory.create({
    data: {
      sku: body.sku,
      name: body.name,
      category: body.category || 'KANCING',
      brand: body.brand || 'UMUM',
      unit: body.unit || 'PCS',
      stock: parseFloat(body.stock || '0'),
      safetyStock: parseFloat(body.safetyStock || '10'),
      location: body.location || null,
      costPerUnit: body.costPerUnit ? parseFloat(body.costPerUnit) : null,
      notes: body.notes || null,
    },
  });

  return c.json(item, 201);
});

// PUT /api/accessories/:id - Update master accessory (Admin only)
accessoryRoutes.put('/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const item = await prisma.accessory.update({
    where: { id },
    data: {
      sku: body.sku,
      name: body.name,
      category: body.category,
      brand: body.brand,
      unit: body.unit,
      stock: parseFloat(body.stock || '0'),
      safetyStock: parseFloat(body.safetyStock || '10'),
      location: body.location,
      costPerUnit: body.costPerUnit ? parseFloat(body.costPerUnit) : null,
      notes: body.notes,
    },
  });

  return c.json(item);
});

// DELETE /api/accessories/:id - Delete master accessory (Admin only)
accessoryRoutes.delete('/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  await prisma.accessory.delete({ where: { id } });
  return c.json({ success: true, message: 'Aksesoris berhasil dihapus' });
});

// POST /api/accessories/mutations - Record mutation & update stock (Admin only)
accessoryRoutes.post('/mutations', adminOnly, async (c) => {
  const body = await c.req.json();
  const { accessoryId, type, quantity, date, sourceOrDestination, spkId, spkNumber, recipientOrVendor, notes, costTotal } = body;

  const acc = await prisma.accessory.findUnique({ where: { id: accessoryId } });
  if (!acc) {
    return c.json({ error: 'Aksesoris tidak ditemukan' }, 404);
  }

  const qty = parseFloat(quantity);
  let newStock = parseFloat(acc.stock.toString());

  if (type === 'MASUK') {
    newStock += qty;
  } else if (type === 'KELUAR') {
    if (newStock < qty) {
      return c.json({ error: `Stok tidak mencukupi! Sisa ${newStock} ${acc.unit}` }, 400);
    }
    newStock -= qty;
  } else if (type === 'PENYESUAIAN') {
    newStock = qty; // For opname, quantity is the target physical count
  }

  const [mutation, updatedAcc] = await prisma.$transaction([
    prisma.accessoryMutation.create({
      data: {
        accessoryId: acc.id,
        accessoryName: acc.name,
        sku: acc.sku,
        type,
        quantity: qty,
        unit: acc.unit,
        date: new Date(date || new Date()),
        sourceOrDestination: sourceOrDestination || null,
        spkId: spkId || null,
        spkNumber: spkNumber || null,
        recipientOrVendor: recipientOrVendor || null,
        notes: notes || null,
        costTotal: costTotal ? parseFloat(costTotal) : null,
      },
    }),
    prisma.accessory.update({
      where: { id: accessoryId },
      data: { stock: newStock },
    }),
  ]);

  return c.json({ mutation, accessory: updatedAcc }, 201);
});
