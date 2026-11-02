import { getPrisma } from '../config/db.js';
import { auditService } from '../services/audit.service.js';
import { hashIpAddress } from '../utils/crypto.util.js';

export const searchSuspects = async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    const type = (req.query.type || '').toLowerCase().trim();

    if (!q) {
      return res.json({ count: 0, results: [], message: 'Provide a search query' });
    }

    const prisma = getPrisma();
    const allSuspects = await prisma.suspect.findMany();

    const filtered = allSuspects.filter((s) => {
      const matchVal = (s.value || '').toLowerCase().includes(q);
      const matchType = !type || (s.type || '').toLowerCase() === type;
      const matchDept = (s.department || '').toLowerCase().includes(q);
      const matchCity = (s.city || '').toLowerCase().includes(q);
      return (matchVal || matchDept || matchCity) && matchType;
    });

    return res.json({
      query: q,
      count: filtered.length,
      results: filtered.map((r) => ({
        id: r.id,
        type: r.type,
        value: r.value,
        department: r.department,
        city: r.city,
        reportsCount: r.reportsCount || 1,
        lastReported: r.lastReported,
        riskLevel: r.reportsCount > 3 ? 'Critical' : r.reportsCount > 1 ? 'High' : 'Medium',
        notes: r.notes
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reportSuspect = async (req, res) => {
  try {
    const { type, value, department, city, notes } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'Suspect type and identifier value are required' });
    }

    const prisma = getPrisma();
    const existing = await prisma.suspect.findFirst({
      where: {
        type: type.toLowerCase().trim(),
        value: value.trim()
      }
    });

    let record;
    if (existing) {
      const newCount = existing.reportsCount + 1;
      record = await prisma.suspect.update({
        where: { id: existing.id },
        data: {
          reportsCount: newCount,
          lastReported: new Date(),
          riskLevel: newCount > 3 ? 'Critical' : newCount > 1 ? 'High' : 'Medium',
          notes: notes ? (existing.notes ? `${existing.notes} | ${notes}` : notes) : existing.notes
        }
      });
    } else {
      record = await prisma.suspect.create({
        data: {
          type: type.toLowerCase().trim(),
          value: value.trim(),
          department: department || 'Unspecified',
          city: city || 'Unspecified',
          reportsCount: 1,
          riskLevel: 'Medium',
          notes: notes || null
        }
      });
    }

    // Cryptographic audit entry
    await auditService.logEvent({
      entityType: 'SUSPECT_IDENTIFIER',
      entityId: record.id,
      action: 'SUSPECT_FLAGGED',
      ipAddressHash: hashIpAddress(req.ip),
      details: { type: record.type, value: record.value, department: record.department }
    });

    return res.status(201).json({
      success: true,
      message: 'Suspect identifier reported and flagged in repository successfully.',
      suspect: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

