import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const auditRoutes = new Hono();
auditRoutes.use('*', authMiddleware);

// GET /api/audit - List audit logs with filtering
auditRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const { module, action, severity, search, limit, startDate, endDate } = c.req.query();

    const where: any = {};

    if (module && module !== 'ALL') {
      where.module = module;
    }

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { details: { contains: q, mode: 'insensitive' } },
        { entityName: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { userName: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Role-based restrictions (if BRAND role, only see brand-related logs if needed, or all)
    if (user && user.role === 'BRAND' && user.brandName) {
      where.AND = [
        {
          OR: [
            { entityName: { contains: user.brandName, mode: 'insensitive' } },
            { details: { contains: user.brandName, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const take = Math.min(parseInt(limit || '150', 10), 500);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take,
    });

    return c.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: any) {
    console.error('[AUDIT_GET_ERROR]', error);
    return c.json({ error: 'Gagal mengambil data audit log', detail: error.message }, 500);
  }
});

// GET /api/audit/stats - Audit statistics for dashboard
auditRoutes.get('/stats', async (c) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, criticalCount, warningCount] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { timestamp: { gte: today } } }),
      prisma.auditLog.count({ where: { severity: 'CRITICAL' } }),
      prisma.auditLog.count({ where: { severity: 'WARNING' } }),
    ]);

    return c.json({
      total,
      todayCount,
      criticalCount,
      warningCount,
    });
  } catch (error: any) {
    console.error('[AUDIT_STATS_ERROR]', error);
    return c.json({ error: 'Gagal mengambil statistik audit', detail: error.message }, 500);
  }
});

// POST /api/audit - Record a new audit log
auditRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const clientIp =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      '127.0.0.1';

    const userId = body.userId || user?.userId || 'SYSTEM';
    const userName = body.userName || user?.email?.split('@')[0] || 'Unknown User';
    const userRole = body.userRole || user?.role || 'OPERATOR';

    const newLog = await prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        module: body.module || 'SISTEM',
        action: body.action || 'UPDATE',
        severity: body.severity || 'INFO',
        entityId: String(body.entityId || '-'),
        entityName: String(body.entityName || '-'),
        details: String(body.details || ''),
        previousData: body.previousData ? body.previousData : null,
        newData: body.newData ? body.newData : null,
        ipAddress: clientIp,
        notes: body.notes ? String(body.notes) : null,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      },
    });

    return c.json({
      success: true,
      data: newLog,
    }, 201);
  } catch (error: any) {
    console.error('[AUDIT_POST_ERROR]', error);
    return c.json({ error: 'Gagal mencatat audit log', detail: error.message }, 500);
  }
});
