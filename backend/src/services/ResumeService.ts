import { uploadToCloudinary } from '../config/cloudinary';
import { ai } from '../config/gemini';
import { Resume, IResume } from '../models/Resume';
import { User } from '../models/User';
import { NotFoundError, BadRequestError } from '../utils/httpErrors';

export class ResumeService {
  private modelName = 'gemini-2.5-flash';

  async analyzeResume(userId: string, fileBuffer: Buffer): Promise<IResume> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError('Invalid file upload. Empty buffer.');
    }

    // 1. Stream the PDF buffer to Cloudinary
    let resumeUrl = '';
    try {
      resumeUrl = await uploadToCloudinary(fileBuffer, 'resumes');
    } catch (uploadErr) {
      console.error('💥 Cloudinary resume upload failed:', uploadErr);
      throw new BadRequestError('Failed to upload file to Cloudinary storage');
    }

    // 2. Stream the PDF buffer base64 representation to Google Gemini
    const base64Data = fileBuffer.toString('base64');
    const systemInstruction =
      'You are a senior hiring architect and resume writing specialist. ' +
      'Analyze the candidate\'s resume. Extract its keywords and suggest section improvements ' +
      'such as adding missing skills, editing bullet points to reflect achievements, and removing fluff.';

    const prompt =
      'Analyze this candidate resume. Evaluate their experience, technical competencies, and layout hierarchy. ' +
      'Highlight specific bullet points or sections that require modifications to make them impact-driven. ' +
      'Identify exactly 5-10 missing keywords or skills relevant to modern tech stacks (like React, Node, System Design, or Cloud engineering).';

    let analysisResult;
    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf',
            },
          },
          prompt,
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              overallFeedback: {
                type: 'string',
                description: 'A 3-4 sentence evaluation summary of the resume\'s strengths and weaknesses.',
              },
              missingKeywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of 5-10 crucial technology keywords or skills missing from the resume.',
              },
              improvements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    section: { type: 'string', description: 'The section name (e.g. Work Experience, Education, Projects).' },
                    currentText: { type: 'string', description: 'The current sub-optimal bullet point or text block.' },
                    suggestedText: { type: 'string', description: 'The recommended replacement incorporating active action verbs and metrics.' },
                    reason: { type: 'string', description: 'Explanation of why this replacement is better (e.g. highlights scale, details optimization).' },
                  },
                  required: ['section', 'currentText', 'suggestedText', 'reason'],
                },
                description: 'Section-by-section improvements.',
              },
            },
            required: ['overallFeedback', 'missingKeywords', 'improvements'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response for resume analysis');
      }

      analysisResult = JSON.parse(text);
    } catch (geminiErr) {
      console.error('💥 Gemini resume parser failed:', geminiErr);
      throw new BadRequestError('AI was unable to parse and analyze this PDF resume. Check formatting.');
    }

    // 3. Save the analysis to the database
    const newResume = await Resume.create({
      user: userId as any,
      resumeUrl,
      analysis: analysisResult,
    });

    // 4. Update the User profile
    await User.findByIdAndUpdate(userId, {
      resumeUrl,
    });

    return newResume;
  }

  async getLatestResume(userId: string): Promise<IResume | null> {
    return await Resume.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
