import { Schema, model, Document, Types } from 'mongoose';

export interface IQuestionAnswer {
  questionText: string;
  idealAnswer: string;
  topic: string;
  userAnswer?: string;
  technicalScore?: number;
  communicationScore?: number;
  feedback?: string;
  type?: 'mcq' | 'short_answer';
  options?: string[];
  correctAnswer?: string;
}

export interface IFeedbackReport {
  suggestions: string;
  topicsToRevise: string[];
  readiness: string;
}

export interface IInterview extends Document {
  user: Types.ObjectId;
  category: string;
  difficulty: 'Junior' | 'Mid' | 'Senior';
  questionCount: number;
  questionType?: 'mixed' | 'mcq' | 'short_answer';
  status: 'ongoing' | 'completed';
  questions: IQuestionAnswer[];
  currentQuestionIndex: number;
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  feedbackReport?: IFeedbackReport;
  duration?: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionAnswerSchema = new Schema<IQuestionAnswer>({
  questionText: { type: String, required: true },
  idealAnswer: { type: String, required: true },
  topic: { type: String, required: true },
  userAnswer: { type: String, default: '' },
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  type: { type: String, enum: ['mcq', 'short_answer'], default: 'short_answer' },
  options: { type: [String], default: undefined },
  correctAnswer: { type: String, default: undefined },
});

const feedbackReportSchema = new Schema<IFeedbackReport>({
  suggestions: { type: String, default: '' },
  topicsToRevise: { type: [String], default: [] },
  readiness: { type: String, default: 'Medium' },
});

const interviewSchema = new Schema<IInterview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior'],
      required: true,
    },
    questionCount: {
      type: Number,
      required: true,
      default: 5,
    },
    questionType: {
      type: String,
      enum: ['mixed', 'mcq', 'short_answer'],
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed'],
      default: 'ongoing',
      index: true,
    },
    questions: [questionAnswerSchema],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
    },
    technicalScore: {
      type: Number,
    },
    communicationScore: {
      type: Number,
    },
    confidenceScore: {
      type: Number,
    },
    feedbackReport: feedbackReportSchema,
    duration: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Interview = model<IInterview>('Interview', interviewSchema);
