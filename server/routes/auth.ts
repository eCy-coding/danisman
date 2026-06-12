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
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/logout', logout);
// Refresh is NOT a brute-force surface (opaque 256-bit token) and fires on
// every access-token expiry — its own wider bucket prevents the
// "429 → interceptor logout" cascade (M3 calibration).
router.post('/refresh', refreshLimiter, refresh);
router.get('/me', authenticate, getMe);
router.post('/send-verify-email', authenticate, sendVerifyEmail);
router.get('/verify-email', verifyEmail);
// P14-BE: Password change — auth required AND rate-limited (treat as
// auth-class endpoint, not generic API). Revokes every session on success.
router.post('/password/change', authLimiter, authenticate, changePassword);

export default router;
