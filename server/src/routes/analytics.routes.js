import { Router } from 'express';
import {
  getOverview,
  getDepartments,
  getAnomalies,
  exportComplaintsReport,
  triggerPrivacyRetentionPurge
} from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/overview', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR', 'ANALYST'), getOverview);
router.get('/departments', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ANALYST'), getDepartments);
router.get('/anomalies', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ANALYST'), getAnomalies);
router.get('/export', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ANALYST'), exportComplaintsReport);

// Privacy Data Retention Manual Trigger (SUPER_ADMIN only)
router.post('/retention/purge', authenticate, authorize('SUPER_ADMIN'), triggerPrivacyRetentionPurge);

export default router;

