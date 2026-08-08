import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import interviewRoutes from './interviewRoutes';
import resumeRoutes from './resumeRoutes';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'InterviewAI API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/interviews', interviewRoutes);
apiRouter.use('/resume', resumeRoutes);

export default apiRouter;
