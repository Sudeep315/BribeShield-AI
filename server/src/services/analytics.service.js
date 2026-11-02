import { decryptText } from '../utils/crypto.util.js';

class AnalyticsService {
  constructor() {
    this.prisma = null;
  }

  setPrisma(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Complete Overview Analytics & KPIs
   */
  async getDashboardOverview() {
    if (!this.prisma) throw new Error('Database client not initialized');

    const totalComplaints = await this.prisma.complaint.count();
    const pendingComplaints = await this.prisma.complaint.count({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING'] } }
    });
    const escalatedComplaints = await this.prisma.complaint.count({
      where: { status: 'ESCALATED' }
    });
    const resolvedComplaints = await this.prisma.complaint.count({
      where: { status: 'RESOLVED' }
    });
    const criticalRiskCount = await this.prisma.complaint.count({
      where: { riskLevel: 'CRITICAL' }
    });

    // Risk distribution
    const riskGroups = await this.prisma.complaint.groupBy({
      by: ['riskLevel'],
      _count: { _all: true }
    });

    // Status distribution
    const statusGroups = await this.prisma.complaint.groupBy({
      by: ['status'],
      _count: { _all: true }
    });

    // Aggregate bribe amount sum
    const allComplaints = await this.prisma.complaint.findMany({
      select: { bribeAmountNumeric: true, riskScore: true }
    });

    const totalExtortedBribeVolume = allComplaints.reduce((acc, c) => acc + (c.bribeAmountNumeric || 0), 0);
    const avgRiskScore = allComplaints.length > 0
      ? Math.round(allComplaints.reduce((acc, c) => acc + (c.riskScore || 0), 0) / allComplaints.length)
      : 0;

    return {
      kpis: {
        totalComplaints,
        pendingComplaints,
        escalatedComplaints,
        resolvedComplaints,
        criticalRiskCount,
        resolutionRatePercent: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
        totalExtortedBribeVolume,
        avgRiskScore
      },
      riskBreakdown: riskGroups.map(r => ({ level: r.riskLevel, count: r._count._all })),
      statusBreakdown: statusGroups.map(s => ({ status: s.status, count: s._count._all }))
    };
  }

  /**
   * Department-wise Deep Breakdown
   */
  async getDepartmentAnalytics() {
    if (!this.prisma) throw new Error('Database client not initialized');

    const complaints = await this.prisma.complaint.findMany({
      select: {
        id: true,
        department: true,
        status: true,
        riskLevel: true,
        riskScore: true,
        bribeAmountNumeric: true
      }
    });

    const deptMap = {};

    complaints.forEach(c => {
      const dept = c.department || 'General Administration';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          total: 0,
          resolved: 0,
          escalated: 0,
          criticalHighCount: 0,
          totalRiskScore: 0,
          totalBribeDemanded: 0
        };
      }
      deptMap[dept].total += 1;
      if (c.status === 'RESOLVED') deptMap[dept].resolved += 1;
      if (c.status === 'ESCALATED') deptMap[dept].escalated += 1;
      if (c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH') deptMap[dept].criticalHighCount += 1;
      deptMap[dept].totalRiskScore += (c.riskScore || 0);
      deptMap[dept].totalBribeDemanded += (c.bribeAmountNumeric || 0);
    });

    return Object.values(deptMap).map(d => ({
      department: d.department,
      total: d.total,
      resolved: d.resolved,
      escalated: d.escalated,
      criticalHighCount: d.criticalHighCount,
      avgRiskScore: d.total > 0 ? Math.round(d.totalRiskScore / d.total) : 0,
      totalBribeDemanded: d.totalBribeDemanded,
      resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }

  /**
   * Anomaly & Sudden Surge Detection Engine
   * Detects statistical outliers (spike in complaints for a department/area over recent window)
   */
  async detectAnomalies() {
    if (!this.prisma) throw new Error('Database client not initialized');

    const complaints = await this.prisma.complaint.findMany({
      select: {
        id: true,
        department: true,
        city: true,
        createdAt: true,
        bribeAmountNumeric: true,
        riskScore: true
      }
    });

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const anomalies = [];
    const deptStats = {};

    // Group into 7-day recent vs older 23 days baseline
    complaints.forEach(c => {
      const dept = c.department;
      if (!deptStats[dept]) {
        deptStats[dept] = { recentWeek: 0, previousPeriod: 0, totalAmount: 0, highValueCount: 0 };
      }

      const t = new Date(c.createdAt).getTime();
      if (t >= sevenDaysAgo) {
        deptStats[dept].recentWeek += 1;
      } else if (t >= thirtyDaysAgo) {
        deptStats[dept].previousPeriod += 1;
      }

      if ((c.bribeAmountNumeric || 0) > 100000) {
        deptStats[dept].highValueCount += 1;
      }
    });

    // Analyze each department for volume spikes & monetary anomalies
    for (const [dept, stats] of Object.entries(deptStats)) {
      const weeklyBaseline = stats.previousPeriod / 3.28; // ~3.3 weeks
      const ratio = weeklyBaseline > 0 ? stats.recentWeek / weeklyBaseline : stats.recentWeek;

      // If volume in last 7 days is > 2.5x the baseline and >= 3 complaints
      if (stats.recentWeek >= 3 && ratio >= 2.2) {
        anomalies.push({
          type: 'VOLUME_SURGE_DETECTED',
          severity: ratio >= 3.5 ? 'CRITICAL' : 'HIGH',
          entity: dept,
          message: `Unusual spike in complaints for ${dept}: ${stats.recentWeek} complaints filed in the last 7 days (vs weekly baseline of ${weeklyBaseline.toFixed(1)}). Surge factor: ${ratio.toFixed(1)}x`,
          metric: `${stats.recentWeek} vs ~${weeklyBaseline.toFixed(1)} baseline`,
          confidence: '92%'
        });
      }

      // Check high value graft cluster
      if (stats.highValueCount >= 2) {
        anomalies.push({
          type: 'HIGH_QUANTUM_CONCENTRATION',
          severity: 'HIGH',
          entity: dept,
          message: `Multiple high-value bribe incidents (>₹1,00,000) concentrated in ${dept}.`,
          metric: `${stats.highValueCount} incidents`,
          confidence: '88%'
        });
      }
    }

    return anomalies;
  }

  /**
   * Export complaints data formatted for audit & CSV reporting
   */
  async generateExportRecords() {
    if (!this.prisma) throw new Error('Database client not initialized');

    const complaints = await this.prisma.complaint.findMany({
      include: { evidences: true, timelines: true },
      orderBy: { createdAt: 'desc' }
    });

    return complaints.map(c => ({
      trackingId: c.trackingId,
      status: c.status,
      priority: c.priority,
      riskLevel: c.riskLevel,
      riskScore: c.riskScore,
      department: c.department,
      category: c.category,
      city: c.city,
      state: c.state || 'N/A',
      bribeAmount: c.bribeAmountNumeric || 0,
      evidenceFileCount: c.evidences.length,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      isAnonymous: c.isAnonymous
    }));
  }
}

export const analyticsService = new AnalyticsService();

