import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { env } from './environment';

// Configure Cloudinary API Credentials
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Configure Multer Memory Storage (keep file in buffer before uploading)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, callback) => {
    // Accept PDF uploads via MIME type or file extension
    const isPdf = 
      file.mimetype === 'application/pdf' || 
      file.originalname.toLowerCase().endsWith('.pdf');
      
    if (isPdf) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file format. Only PDF files are allowed.'));
    }
  },
});

/**
 * Uploads a memory buffer stream to Cloudinary storage.
 * @param fileBuffer The in-memory buffer of the file.
 * @param folder Cloudinary folder to save the asset.
 */
export const uploadToCloudinary = (fileBuffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw', // Required for non-image assets like PDFs
        public_id: `resume_${Date.now()}`,
        format: 'pdf',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty response'));
        }
        resolve(result.secure_url);
      }
    );
    
    // Write buffer and end stream
    uploadStream.end(fileBuffer);
  });
};
