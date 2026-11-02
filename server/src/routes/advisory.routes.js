import { Router } from 'express';
import { getAdvisories, submitFeedback } from '../controllers/advisory.controller.js';

const router = Router();

router.get('/advisories', getAdvisories);
router.post('/feedback', submitFeedback);

export default router;

