import { Router } from 'express';
import {
  changePassword,
  login,
  register,
  getMe,
  logout,
  refresh,
  sendVerifyEmail,
  verifyEmail,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/logout', logout);
router.post('/refresh', authLimiter, refresh);
router.get('/me', authenticate, getMe);
router.post('/send-verify-email', authenticate, sendVerifyEmail);
router.get('/verify-email', verifyEmail);
// P14-BE: Password change — auth required AND rate-limited (treat as
// auth-class endpoint, not generic API). Revokes every session on success.
router.post('/password/change', authLimiter, authenticate, changePassword);

export default router;
