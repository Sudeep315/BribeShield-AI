import { getPrisma } from '../config/db.js';
import { auditService } from '../services/audit.service.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { entityType, action, page = 1, limit = 50 } = req.query;
    const prisma = getPrisma();

    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { sequenceNumber: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAuditChain = async (req, res) => {
  try {
    const verification = await auditService.verifyChainIntegrity();
    return res.json({
      success: true,
      verification
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

