import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Base upload directory
const baseDir = 'uploads';

// Ensure base upload directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subdirectory based on mimetype
    let subDir = 'files';
    if (file.mimetype.startsWith('image/')) subDir = 'images';
    else if (file.mimetype.startsWith('audio/')) subDir = 'audio';
    else if (file.mimetype.startsWith('video/')) subDir = 'videos';
    
    const targetDir = path.join(baseDir, subDir);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype.split('/')[0] || 'file';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Files
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type!'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Increased to 50MB for videos/files
  }
});
