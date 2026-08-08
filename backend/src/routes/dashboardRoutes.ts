import { Router } from 'express';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { Interview } from '../models/Interview';
import { calculateStreak } from '../utils/streak';

const router = Router();

router.get('/stats', auth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    // 1. Fetch completed interviews for the user, sorted descending by date
    const completed = await Interview.find({
      user: userId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .exec();

    // 2. Fetch the 3 most recent interviews overall (ongoing or completed)
    const recent = await Interview.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .exec();

    // Default stats if user has no sessions yet
    if (completed.length === 0) {
      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            averageScore: 0,
            totalInterviews: 0,
            streak: 0,
            weakestArea: 'None',
            strongestArea: 'None',
            interviewReadyStatus: 'Low',
            readyPercentage: 0,
          },
          charts: {
            weeklyProgress: [],
            competencies: [
              { subject: 'Technical', value: 0, fullMark: 100 },
              { subject: 'Communication', value: 0, fullMark: 100 },
              { subject: 'Confidence', value: 0, fullMark: 100 },
            ],
          },
          recentInterviews: recent.map((item) => ({
            id: item._id,
            category: item.category,
            date: item.createdAt,
            score: item.overallScore || 0,
            difficulty: item.difficulty,
            duration: item.duration || '0 mins',
            questionsCount: item.questionCount,
          })),
        },
      });
      return;
    }

    // 3. Compute Averages
    const totalInterviews = completed.length;
    const totalScore = completed.reduce((sum, item) => sum + (item.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / totalInterviews);

    const totalTech = completed.reduce((sum, item) => sum + (item.technicalScore || 0), 0);
    const averageTech = Math.round(totalTech / totalInterviews);

    const totalComm = completed.reduce((sum, item) => sum + (item.communicationScore || 0), 0);
    const averageComm = Math.round(totalComm / totalInterviews);

    const totalConf = completed.reduce((sum, item) => sum + (item.confidenceScore || 0), 0);
    const averageConf = Math.round(totalConf / totalInterviews);

    // 4. Calculate Streak
    const completedDates = completed.map((item) => item.createdAt);
    const streak = calculateStreak(completedDates);

    // 5. Group by Category to find Strongest and Weakest Areas
    const categoryStats: Record<string, { totalScore: number; count: number }> = {};
    completed.forEach((item) => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = { totalScore: 0, count: 0 };
      }
      categoryStats[item.category].totalScore += item.overallScore || 0;
      categoryStats[item.category].count += 1;
    });

    let strongestArea = 'None';
    let weakestArea = 'None';
    let highestAvg = -1;
    let lowestAvg = 101;

    Object.entries(categoryStats).forEach(([cat, stats]) => {
      const avg = stats.totalScore / stats.count;
      if (avg > highestAvg) {
        highestAvg = avg;
        strongestArea = cat;
      }
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakestArea = cat;
      }
    });

    // 6. Map Weekly Progress (up to last 7 sessions, sorted chronologically)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Sessions = [...completed]
      .slice(0, 7)
      .reverse() // Sort chronologically (oldest to newest)
      .map((item) => {
        const dateObj = new Date(item.createdAt);
        return {
          day: daysOfWeek[dateObj.getDay()],
          score: item.overallScore || 0,
        };
      });

    // 7. Calculate Readiness Indicator
    const interviewReadyStatus = averageScore >= 80 ? 'High' : averageScore >= 60 ? 'Medium' : 'Low';

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          averageScore,
          totalInterviews,
          streak,
          weakestArea,
          strongestArea,
          interviewReadyStatus,
          readyPercentage: averageScore,
        },
        charts: {
          weeklyProgress: last7Sessions,
          competencies: [
            { subject: 'Technical', value: averageTech, fullMark: 100 },
            { subject: 'Communication', value: averageComm, fullMark: 100 },
            { subject: 'Confidence', value: averageConf, fullMark: 100 },
          ],
        },
        recentInterviews: recent.map((item) => ({
          id: item._id,
          category: item.category,
          date: item.createdAt,
          score: item.overallScore || 0,
          difficulty: item.difficulty,
          duration: item.duration || 'Ongoing',
          questionsCount: item.questionCount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
