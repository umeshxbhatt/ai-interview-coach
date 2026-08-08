import { Schema, model, Document, Types } from 'mongoose';

export interface IResumeImprovement {
  section: string;
  currentText: string;
  suggestedText: string;
  reason: string;
}

export interface IResumeAnalysis {
  overallFeedback: string;
  missingKeywords: string[];
  improvements: IResumeImprovement[];
}

export interface IResume extends Document {
  user: Types.ObjectId;
  resumeUrl: string;
  analysis: IResumeAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const resumeImprovementSchema = new Schema<IResumeImprovement>({
  section: { type: String, required: true },
  currentText: { type: String, required: true },
  suggestedText: { type: String, required: true },
  reason: { type: String, required: true },
});

const resumeAnalysisSchema = new Schema<IResumeAnalysis>({
  overallFeedback: { type: String, required: true },
  missingKeywords: { type: [String], default: [] },
  improvements: [resumeImprovementSchema],
});

const resumeSchema = new Schema<IResume>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    analysis: {
      type: resumeAnalysisSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Resume = model<IResume>('Resume', resumeSchema);
