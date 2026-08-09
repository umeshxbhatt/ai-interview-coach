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

      const { category, difficulty, questionCount, questionType, customPrompt } = req.body;
      const qType = questionType || 'mixed';
      if (!['mixed', 'mcq', 'short_answer'].includes(qType)) {
        res.status(400).json({ status: 'error', message: 'Invalid questionType. Allowed values: mixed, mcq, short_answer' });
        return;
      }

      const interview = await interviewService.startInterview(
        userId,
        category,
        difficulty,
        Number(questionCount || 5),
        qType as any,
        customPrompt
      );

      const sanitizedInterview = sanitizeInterviewForClient(interview);

      res.status(201).json({
        status: 'success',
        message: 'Interview session created successfully',
        data: { interview: sanitizedInterview },
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

      const sanitizedInterview = sanitizeInterviewForClient(result.interview);

      res.status(200).json({
        status: 'success',
        message: 'Answer submitted successfully',
        data: {
          ...result,
          interview: sanitizedInterview,
        },
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
      const sanitizedInterview = sanitizeInterviewForClient(interview);

      res.status(200).json({
        status: 'success',
        data: { interview: sanitizedInterview },
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
      const sanitizedInterviews = interviews.map((item: any) => sanitizeInterviewForClient(item));

      res.status(200).json({
        status: 'success',
        data: { interviews: sanitizedInterviews },
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

function sanitizeInterviewForClient(interview: any) {
  if (!interview) return interview;
  
  // Convert document to plain object
  const interviewObj = interview.toObject ? interview.toObject() : JSON.parse(JSON.stringify(interview));
  
  if (interviewObj.questions) {
    interviewObj.questions.forEach((q: any) => {
      const qType = q.type || 'short_answer';
      if (qType === 'mcq') {
        const hasAnswered = q.userAnswer && q.userAnswer.trim() !== '';
        if (!hasAnswered) {
          delete q.correctAnswer;
        }
      }
    });
  }
  return interviewObj;
}
