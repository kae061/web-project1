import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { signToken, refreshAccessToken } from '../utils/jwt';

// ─── Zod Validation Schemas ─────────────────────────────────────────────────

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Auth Controller ─────────────────────────────────────────────────────────

const authController = {
  /**
   * POST /api/auth/register
   * Validates username/email/password with zod, checks not taken,
   * creates user, returns { accessToken, refreshToken, user }.
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { username, email, password } = parsed.data;

      // Check if username or email already taken
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      });

      if (existingUser) {
        const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
        res.status(409).json({
          success: false,
          message: `This ${field} is already taken`,
        });
        return;
      }

      // Create user (passwordHash will be hashed by pre-save hook)
      const user = new User({
        username,
        email: email.toLowerCase(),
        passwordHash: password,
      });
      await user.save();

      const tokens = signToken(user._id.toString());

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('[authController.register]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/login
   * Finds user by email, verifies password, returns tokens and user.
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { email, password } = parsed.data;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Update status
      user.status = 'online';
      user.lastSeen = new Date();
      await user.save();

      const tokens = signToken(user._id.toString());

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('[authController.login]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/refresh
   * Takes refreshToken from body, returns new accessToken.
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { refreshToken } = parsed.data;
      const newAccessToken = refreshAccessToken(refreshToken);

      if (!newAccessToken) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken: newAccessToken },
      });
    } catch (error) {
      console.error('[authController.refresh]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/auth/logout
   * Returns 200.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('[authController.logout]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

export default authController;
