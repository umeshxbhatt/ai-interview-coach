import { Router } from 'express';
import { ResumeController } from '../controllers/ResumeController';
import { auth } from '../middleware/auth';
import { upload } from '../config/cloudinary';

const router = Router();

// Upload endpoint mapping (uses multer to capture single 'file' parameter)
router.post('/upload', auth, upload.single('file'), ResumeController.upload as any);

// Fetch latest analysis
router.get('/latest', auth, ResumeController.latest as any);

export default router;
