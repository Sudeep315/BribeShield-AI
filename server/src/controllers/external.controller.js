import { grievanceService } from '../services/grievance.service.js';
import { getPrisma } from '../config/db.js';
import { config } from '../config/index.js';

export const escalateToInstitution = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { targetSystem = 'CPGRAMS' } = req.body;

    const result = await grievanceService.exportToExternalSystem({
      complaintId,
      targetSystem,
      user: req.user
    });

    return res.json({
      success: true,
      message: `Case successfully transmitted and cryptographically registered with ${targetSystem}.`,
      result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * External institutional grievance API endpoint (Secure machine-to-machine integration)
 */
export const externalGrievanceEndpoint = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-bribeshield-signature'];

    if (!apiKey || apiKey !== config.externalGrievance.apiKey) {
      return res.status(401).json({ success: false, message: 'Invalid or missing institutional API key.' });
    }

    const prisma = getPrisma();
    const { status, referenceId, notes, externalSystem } = req.body;

    // External partner webhook reporting resolution or status update
    return res.json({
      success: true,
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

