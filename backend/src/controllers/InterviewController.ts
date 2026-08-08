import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { InterviewService } from '../services/InterviewService';

const interviewService = new InterviewService();

export class InterviewController {
  static async start(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { category, difficulty, questionCount, customPrompt } = req.body;
      const interview = await interviewService.startInterview(
        userId,
        category,
        difficulty,
        Number(questionCount || 5),
        customPrompt
      );

      res.status(201).json({
        status: 'success',
        message: 'Interview session created successfully',
        data: { interview },
      });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: interviewId } = req.params;
      const { userAnswer } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const result = await interviewService.submitAnswer(
        interviewId,
        userId,
        userAnswer || ''
      );

      res.status(200).json({
        status: 'success',
        message: 'Answer submitted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: interviewId } = req.params;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const interview = await interviewService.getReport(interviewId, userId);

      res.status(200).json({
        status: 'success',
        data: { interview },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const interviews = await interviewService.getUserHistory(userId);

      res.status(200).json({
        status: 'success',
        data: { interviews },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: interviewId } = req.params;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await interviewService.deleteInterview(interviewId, userId);

      res.status(200).json({
        status: 'success',
        message: 'Interview session deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
