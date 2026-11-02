import { Router } from 'express';
import { login, refreshToken, getCurrentUser, listUsers, createUser } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getCurrentUser);

// User administration (SUPER_ADMIN only)
router.get('/users', authenticate, authorize('SUPER_ADMIN'), listUsers);
router.post('/users', authenticate, authorize('SUPER_ADMIN'), createUser);

export default router;

