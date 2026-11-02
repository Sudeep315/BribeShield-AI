import { analyticsService } from '../services/analytics.service.js';
import { retentionService } from '../services/retention.service.js';

export const getOverview = async (req, res) => {
  try {
    const overview = await analyticsService.getDashboardOverview();
    return res.json({ success: true, ...overview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await analyticsService.getDepartmentAnalytics();
    return res.json({ success: true, departments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnomalies = async (req, res) => {
  try {
    const anomalies = await analyticsService.detectAnomalies();
    return res.json({ success: true, anomalies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const exportComplaintsReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const records = await analyticsService.generateExportRecords();

    if (format === 'csv') {
      if (records.length === 0) {
        return res.send('No records found.');
      }
      const headers = Object.keys(records[0]).join(',');
      const rows = records.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bribeshield-report-${Date.now()}.csv"`);
      return res.send(csv);
    }

    return res.json({ success: true, count: records.length, records });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerPrivacyRetentionPurge = async (req, res) => {
  try {
    const result = await retentionService.purgeExpiredRecords();
    return res.json({
      success: true,
      message: `Privacy retention purge executed. ${result.purged} expired record(s) wiped.`,
      result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

