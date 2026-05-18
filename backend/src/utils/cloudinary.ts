import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a buffer to Cloudinary
 */
const uploadFromBuffer = (buffer: Buffer, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const uploadImage = async (file: Express.Multer.File) => {
  const result = await uploadFromBuffer(file.buffer, {
    folder: 'kaeapp/images',
    resource_type: 'image',
  });
  return result.secure_url;
};

export const uploadVideo = async (file: Express.Multer.File) => {
  const result = await uploadFromBuffer(file.buffer, {
    folder: 'kaeapp/videos',
    resource_type: 'video',
  });
  return result.secure_url;
};

export const uploadAudio = async (file: Express.Multer.File) => {
  const result = await uploadFromBuffer(file.buffer, {
    folder: 'kaeapp-audio',
    resource_type: 'video', // Cloudinary uses 'video' for audio files
  });
  return { url: result.secure_url, duration: result.duration || 0 };
};

export const uploadFile = async (file: Express.Multer.File) => {
  const result = await uploadFromBuffer(file.buffer, {
    folder: 'kaeapp/files',
    resource_type: 'raw',
  });
  return result.secure_url;
};

export const deleteFile = async (publicId: string) => {
  return await cloudinary.uploader.destroy(publicId);
};
