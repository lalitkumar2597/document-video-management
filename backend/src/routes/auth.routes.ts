import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, refreshTokenMiddleware } from '../middleware/auth.middleware';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../middleware/validation.middleware';

const router = Router();

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh', refreshTokenValidation, AuthController.refresh);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/logout-all', authenticate, AuthController.logoutAll);

// Refresh token route (requires refresh token in cookie)
router.post('/refresh-token', refreshTokenMiddleware, AuthController.refresh);

export default router;