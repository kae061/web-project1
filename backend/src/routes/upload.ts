import { Router } from 'express';
import uploadController from '../controllers/uploadController';
import authenticateToken from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Protect all upload routes
router.use(authenticateToken);

// POST /api/upload/image
router.post('/image', upload.single('image'), uploadController.uploadImage);

// POST /api/upload/video
router.post('/video', upload.single('video'), uploadController.uploadVideo);

// POST /api/upload/audio
router.post('/audio', upload.single('audio'), uploadController.uploadAudio);

// POST /api/upload/file
router.post('/file', upload.single('file'), uploadController.uploadFile);

export default router;
