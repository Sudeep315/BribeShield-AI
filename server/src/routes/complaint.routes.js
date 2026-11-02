import { Router } from 'express';
import {
  submitComplaint,
  trackComplaint,
  listComplaints,
  getComplaintById,
  updateComplaintStatus
} from '../controllers/complaint.controller.js';
import { getPublicFeed } from '../controllers/feed.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadEvidence } from '../middleware/upload.middleware.js';
import { complaintSubmissionLimiter, trackingLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Anonymous Endpoints
router.post('/submit', complaintSubmissionLimiter, uploadEvidence.array('evidence', 5), submitComplaint);
router.post('/', complaintSubmissionLimiter, uploadEvidence.array('evidence', 5), submitComplaint); // Alias for original /api/complaints
router.get('/track/:trackingId', trackingLimiter, trackComplaint);
router.get('/public', getPublicFeed); // Public Transparency Feed

// Protected Staff / Admin Endpoints (RBAC)
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR', 'ANALYST'), listComplaints);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR'), getComplaintById);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR'), updateComplaintStatus);

export default router;
