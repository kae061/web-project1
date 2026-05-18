import { Request, Response } from 'express';
import User from '../models/User';

export const userController = {
  /**
   * GET /api/users/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById((req as any).user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error('[userController.getCurrentUser]', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  /**
   * PUT /api/users/me
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { username, bio, status } = req.body;
      const userId = (req as any).user.id;

      // Check if username is taken if it's being changed
      if (username) {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          res.status(400).json({ success: false, message: 'Username is already taken' });
          return;
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { username, bio, status } },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      console.error('[userController.updateProfile]', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  /**
   * POST /api/users/me/avatar
   */
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please upload an image file' });
        return;
      }

      // Construct the public URL for the avatar
      // Assuming the server runs on localhost:3333 and serves /uploads statically
      const avatarUrl = `http://localhost:3333/uploads/images/${req.file.filename}`;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: avatarUrl } },
        { new: true }
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      console.error('[userController.uploadAvatar]', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};
