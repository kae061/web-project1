import { Router, Request, Response } from 'express';
import authController from '../controllers/authController';
import authenticateToken from '../middleware/auth';
import User from '../models/User';

const router = Router();

// POST /api/auth/register — Register a new user
router.post('/register', authController.register);

// POST /api/auth/login — Login with email & password
router.post('/login', authController.login);

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', authController.refresh);

// POST /api/auth/logout — Logout
router.post('/logout', authController.logout);

// GET /api/auth/me — Get current user (protected)
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error('[GET /me]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
