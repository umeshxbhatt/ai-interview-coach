import { InterviewRepository } from '../repositories/InterviewRepository';
import { IInterview, IQuestionAnswer } from '../models/Interview';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/httpErrors';
import { GeminiService } from './GeminiService';
import { NlpService } from './NlpService';

export class InterviewService {
  private interviewRepository = new InterviewRepository();
  private geminiService = new GeminiService();
  private nlpService = new NlpService();

  async startInterview(
    userId: string,
    category: string,
    difficulty: 'Junior' | 'Mid' | 'Senior',
    questionCount: number,
    customPrompt?: string
  ): Promise<IInterview> {
    // 1. Generate live questions and ideal answers from Gemini
    const curatedQuestions = await this.geminiService.generateQuestions(
      category,
      difficulty,
      questionCount,
      customPrompt
    );

    // 2. Map schema elements to subdocument templates
    const questionsList: IQuestionAnswer[] = curatedQuestions.map((q) => ({
      questionText: q.questionText,
      idealAnswer: q.idealAnswer,
      topic: q.topic,
      userAnswer: '',
      technicalScore: 0,
      communicationScore: 0,
      feedback: '',
    }));

    // 3. Create active session document in DB
    const interview = await this.interviewRepository.create({
      user: userId as any,
      category,
      difficulty,
      questionCount,
      status: 'ongoing',
      questions: questionsList,
      currentQuestionIndex: 0,
    });

    return interview;
  }

  async submitAnswer(
    interviewId: string,
    userId: string,
    userAnswer: string
  ): Promise<{
    evaluation: { technicalScore: number; communicationScore: number; feedback: string };
    isCompleted: boolean;
    nextQuestion?: string;
    interview: IInterview;
  }> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new NotFoundError('Interview session not found');
    }

    // Enforce authorization
    if (interview.user.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this interview session');
    }

    if (interview.status === 'completed') {
      throw new BadRequestError('This interview session is already completed');
    }

    const currentIndex = interview.currentQuestionIndex;
    const activeQuestion = interview.questions[currentIndex];

    // 1. Execute semantic evaluation via local Python FastAPI NLP Microservice
    const nlpContext = await this.nlpService.evaluateResponse(
      userAnswer,
      activeQuestion.idealAnswer
    );

    // 2. Query Gemini API to execute comprehensive scoring
    const evaluation = await this.geminiService.evaluateAnswer(
      activeQuestion.questionText,
      userAnswer,
      activeQuestion.idealAnswer,
      nlpContext
    );

    // 3. Save evaluation results in embedded question
    activeQuestion.userAnswer = userAnswer;
    activeQuestion.technicalScore = evaluation.technicalScore;
    activeQuestion.communicationScore = evaluation.communicationScore;
    activeQuestion.feedback = evaluation.feedback;

    // 4. Advance index
    interview.currentQuestionIndex += 1;
    const isCompleted = interview.currentQuestionIndex >= interview.questionCount;

    if (isCompleted) {
      interview.status = 'completed';

      // Aggregate overall scores
      const totalQuestions = interview.questions.length;
      const avgTech = interview.questions.reduce((sum, q) => sum + (q.technicalScore || 0), 0) / totalQuestions;
      const avgComm = interview.questions.reduce((sum, q) => sum + (q.communicationScore || 0), 0) / totalQuestions;
      
      interview.technicalScore = Math.round(avgTech);
      interview.communicationScore = Math.round(avgComm);
      interview.overallScore = Math.round((avgTech + avgComm) / 2);
      
      // 5. Query Gemini for final analysis diagnostics
      const finalReport = await this.geminiService.generateFinalFeedback(
        interview.category,
        interview.questions
      );

      interview.confidenceScore = Math.round(75 + (avgTech % 20)); // Keep base simulated confidence metric
      interview.feedbackReport = {
        suggestions: finalReport.suggestions,
        topicsToRevise: finalReport.topicsToRevise,
        readiness: finalReport.readiness,
      };

      // Duration calculations
      const diffMs = Math.abs(new Date().getTime() - interview.createdAt.getTime());
      const mins = Math.max(1, Math.round(diffMs / 60000));
      interview.duration = `${mins} mins`;
    }

    await interview.save();

    return {
      evaluation,
      isCompleted,
      nextQuestion: isCompleted ? undefined : interview.questions[interview.currentQuestionIndex].questionText,
      interview,
    };
  }

  async getReport(interviewId: string, userId: string): Promise<IInterview> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new NotFoundError('Interview session not found');
    }

    if (interview.user.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this report');
    }

    return interview;
  }

  async getUserHistory(userId: string): Promise<IInterview[]> {
    return await this.interviewRepository.findByUser(userId);
  }

  async deleteInterview(interviewId: string, userId: string): Promise<boolean> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new NotFoundError('Interview session not found');
    }

    if (interview.user.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to delete this report');
    }

    return await this.interviewRepository.delete(interviewId);
  }
}
