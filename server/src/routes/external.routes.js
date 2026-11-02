import { Router } from 'express';
import { escalateToInstitution, externalGrievanceEndpoint } from '../controllers/external.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Staff endpoint: Escalate complaint to CPGRAMS / Lokayukta / CVC
router.post('/escalate/:complaintId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), escalateToInstitution);

// Inbound webhook from institutional grievance portals
router.post('/webhook', externalGrievanceEndpoint);

export default router;

