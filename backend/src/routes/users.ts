import express, { Request, Response } from 'express';
import User from '../models/User';
import authenticate from '../middleware/auth';
import { userController } from '../controllers/userController';
import { upload } from '../middleware/upload';

const router = express.Router();

// GET /api/users/me
router.get('/me', authenticate, userController.getCurrentUser);

// PUT /api/users/me
router.put('/me', authenticate, userController.updateProfile);

// POST /api/users/me/avatar
router.post('/me/avatar', authenticate, upload.single('file'), userController.uploadAvatar);

// GET /api/users/search?q=query
router.get('/search', authenticate, async (req: Request, res: Response): Promise<any> => {
  const { q } = req.query;
  const currentUserId = (req as any).user.id;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    }).select('username email avatar status');

    return res.status(200).json({
      success: true,
      data: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        status: u.status
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

export default router;
