import { Router } from 'express';
import { downloadEvidence } from '../controllers/evidence.controller.js';

const router = Router();

// Stream / download encrypted evidence (Protected via signed token OR Staff Bearer JWT)
router.get('/:id/download', downloadEvidence);

export default router;

