import { Router } from 'express';
import { InterviewController } from '../controllers/InterviewController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/', auth, InterviewController.start as any);
router.post('/:id/submit', auth, InterviewController.submit as any);
router.get('/history', auth, InterviewController.getUserHistory as any);
router.get('/:id/report', auth, InterviewController.getReport as any);
router.delete('/:id', auth, InterviewController.delete as any);

export default router;
