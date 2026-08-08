import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ResumeService } from '../services/ResumeService';
import { BadRequestError } from '../utils/httpErrors';

const resumeService = new ResumeService();

export class ResumeController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const file = req.file;
      if (!file) {
        throw new BadRequestError('Please upload a PDF resume file');
      }

      const resumeAnalysis = await resumeService.analyzeResume(userId, file.buffer);

      res.status(201).json({
        status: 'success',
        message: 'Resume analyzed successfully',
        data: { resume: resumeAnalysis },
      });
    } catch (error) {
      next(error);
    }
  }

  static async latest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const resume = await resumeService.getLatestResume(userId);

      res.status(200).json({
        status: 'success',
        data: { resume },
      });
    } catch (error) {
      next(error);
    }
  }
}
