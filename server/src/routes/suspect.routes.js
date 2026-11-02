import { Router } from 'express';
import { searchSuspects, reportSuspect } from '../controllers/suspect.controller.js';

const router = Router();

router.get('/search', searchSuspects);
router.post('/report', reportSuspect);

export default router;

