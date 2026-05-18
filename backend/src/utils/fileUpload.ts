import fs from 'fs';
import path from 'path';

/**
 * Utility to ensure a directory exists.
 * @param folder Path relative to process.cwd()
 */
export const ensureDirectory = (folder: string) => {
  const fullPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

/**
 * Gets the public URL path for a given local file path.
 * @param localPath e.g. 'uploads/audio/filename.wav'
 * @returns e.g. '/uploads/audio/filename.wav'
 */
export const getPublicPath = (localPath: string) => {
  if (localPath.startsWith('/')) return localPath;
  return `/${localPath.replace(/\\/g, '/')}`;
};
