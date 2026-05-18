import { Request, Response } from 'express';

const uploadController = {
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file provided' });
        return;
      }
      const url = `/uploads/images/${req.file.filename}`;
      res.status(200).json({ success: true, data: { url, type: 'image' } });
    } catch (error: any) {
      console.error('[uploadController.uploadImage]', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No video file provided' });
        return;
      }
      const url = `/uploads/videos/${req.file.filename}`;
      res.status(200).json({ success: true, data: { url, type: 'video' } });
    } catch (error: any) {
      console.error('[uploadController.uploadVideo]', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async uploadAudio(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No audio file provided' });
        return;
      }
      const url = `/uploads/audio/${req.file.filename}`;
      // In a real local setup, you might use a library like 'music-metadata' to get duration
      // For now we'll return 0 or the duration from frontend if provided
      res.status(200).json({ success: true, data: { url, type: 'audio', duration: 0 } });
    } catch (error: any) {
      console.error('[uploadController.uploadAudio]', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file provided' });
        return;
      }
      const url = `/uploads/files/${req.file.filename}`;
      res.status(200).json({ success: true, data: { url, type: 'file' } });
    } catch (error: any) {
      console.error('[uploadController.uploadFile]', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

export default uploadController;
