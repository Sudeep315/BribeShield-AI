import { getPrisma } from '../config/db.js';

export const getPublicFeed = async (req, res) => {
  try {
    const prisma = getPrisma();
    const { department, city, status, riskLevel, q } = req.query;

    const complaints = await prisma.complaint.findMany({
      include: {
        timelines: { where: { isPublic: true }, orderBy: { createdAt: 'desc' } },
        evidences: { select: { id: true, mimeType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let list = complaints.map((c) => ({
      trackingId: c.trackingId,
      department: c.department,
      city: c.city,
      state: c.state,
      category: c.category || 'General',
      amount: c.bribeAmountNumeric || 0,
      riskScore: c.riskScore || 0,
      riskLevel: c.riskLevel || 'LOW',
      riskFactors: JSON.parse(c.riskFactors || '[]'),
      evidenceCount: c.evidences.length,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      timeline: c.timelines
    }));

    if (department) list = list.filter((c) => c.department.toLowerCase().includes(department.toLowerCase()));
    if (city) list = list.filter((c) => c.city.toLowerCase().includes(city.toLowerCase()));
    if (status) list = list.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    if (riskLevel) list = list.filter((c) => c.riskLevel.toLowerCase() === riskLevel.toLowerCase());
    if (q) {
      const query = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.department.toLowerCase().includes(query) ||
          c.city.toLowerCase().includes(query) ||
          c.trackingId.toLowerCase().includes(query)
      );
    }

    const byRisk = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byDepartment = {};
    const byCity = {};

    complaints.forEach((c) => {
      byRisk[c.riskLevel] = (byRisk[c.riskLevel] || 0) + 1;
      byDepartment[c.department] = (byDepartment[c.department] || 0) + 1;
      byCity[c.city] = (byCity[c.city] || 0) + 1;
    });

    const topDepartments = Object.entries(byDepartment)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([department, count]) => ({ department, count }));

    const topCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));

    return res.json({
      success: true,
      total: list.length,
      complaints: list,
      byRisk,
      topDepartments,
      topCities
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

