import { Router } from 'express';
import { getAuditLogs, verifyAuditChain } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Only AUDITOR and SUPER_ADMIN have clearance to inspect audit logs and run mathematical chain verification
router.get('/', authenticate, authorize('AUDITOR', 'SUPER_ADMIN'), getAuditLogs);
router.get('/verify', authenticate, authorize('AUDITOR', 'SUPER_ADMIN'), verifyAuditChain);

export default router;

