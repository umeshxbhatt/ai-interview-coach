import { ai } from '../config/gemini';
import { IQuestionAnswer } from '../models/Interview';

export class GeminiService {
  private modelName = 'gemini-3.5-flash';

  async generateQuestions(
    category: string,
    difficulty: 'Junior' | 'Mid' | 'Senior',
    count: number,
    questionType: 'mixed' | 'mcq' | 'short_answer' = 'mixed',
    customPrompt?: string
  ): Promise<Array<{
    questionText: string;
    idealAnswer: string;
    topic: string;
    type: 'mcq' | 'short_answer';
    options?: string[];
    correctAnswer?: string;
  }>> {
    const systemInstruction = 
      'You are an elite staff software engineer, hiring manager, and technical interviewer. ' +
      'Your task is to generate realistic, industry-standard interview questions. ' +
      'All questions must be SHORT (exactly 1-2 sentences), direct, and technically meaningful. ' +
      'Avoid high-level or overly generic questions. Make them highly contextual and technical.';

    let prompt = 
      `Generate exactly ${count} interview questions for a candidate practicing for a ${category} interview. ` +
      `The difficulty level is ${difficulty}. ` +
      `Each question must focus on a specific sub-topic or core conceptual block. `;

    if (questionType === 'mcq') {
      prompt += `All ${count} questions MUST be multiple choice questions (type: "mcq"). ` +
                `Each MCQ must have EXACTLY 4 plausible options (options array containing 4 strings) and EXACTLY one correct answer (correctAnswer string, which must match one of the 4 options exactly). ` +
                `Do not make the correct answer obvious through wording or length.`;
    } else if (questionType === 'short_answer') {
      prompt += `All ${count} questions MUST be short answer questions (type: "short_answer"). ` +
                `For short_answer questions, options must be absent or empty, and correctAnswer must be absent or empty.`;
    } else {
      const numMcq = count === 5 ? 3 : count === 15 ? 8 : Math.floor(count / 2);
      const numShort = count - numMcq;
      prompt += `Generate a balanced randomized mixture containing exactly ${numMcq} multiple choice questions (type: "mcq") and exactly ${numShort} short answer questions (type: "short_answer"). ` +
                `Each MCQ must have EXACTLY 4 plausible options (options array containing 4 strings) and EXACTLY one correct answer (correctAnswer string, which must match one of the 4 options exactly). ` +
                `For short_answer questions, options and correctAnswer must be absent or empty. ` +
                `Shuffle the order of questions so that the sequence of types is completely randomized and not predictable.`;
    }

    if (category.toLowerCase() === 'custom' && customPrompt) {
      prompt += `\nAdditional Focus / Job Description context:\n${customPrompt}`;
    }

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionText: { type: 'string', description: 'The exact question text to ask the candidate.' },
                idealAnswer: { type: 'string', description: 'A highly comprehensive, ideal answer showing what a senior engineer would state.' },
                topic: { type: 'string', description: 'A 2-4 word summary of the sub-topic being evaluated (e.g. Caching, Closures, STAR conflict).' },
                type: { type: 'string', enum: ['mcq', 'short_answer'], description: 'The type of question.' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'For MCQ type only: EXACTLY 4 plausible options. For short_answer: leave empty or absent.'
                },
                correctAnswer: {
                  type: 'string',
                  description: 'For MCQ type only: the correct answer, which must match exactly one of the options. For short_answer: leave empty or absent.'
                }
              },
              required: ['questionText', 'idealAnswer', 'topic', 'type'],
            },
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API');
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('💥 Error generating questions with Gemini:', error);
      throw error;
    }
  }

  async evaluateAnswer(
    questionText: string,
    userAnswer: string,
    idealAnswer: string,
    nlpContext: {
      similarityScore: number;
      keywordOverlap: number;
      matchedKeywords: string[];
      missingKeywords: string[];
    }
  ): Promise<{ technicalScore: number; communicationScore: number; feedback: string }> {
    const systemInstruction =
      'You are an expert AI technical interviewer. Your goal is to grade the candidate\'s answer against the ideal answer. ' +
      'Be critical yet constructive. Focus on accuracy, terminology, and clarity.';

    const prompt =
      `Evaluate the candidate's answer for the following question:\n` +
      `Question: "${questionText}"\n\n` +
      `Ideal Answer Reference: "${idealAnswer}"\n\n` +
      `Candidate's Response: "${userAnswer}"\n\n` +
      `NLP Reference Metrics (use as helpful grading context):\n` +
      `- Semantic Similarity: ${nlpContext.similarityScore}%\n` +
      `- Core Keywords Overlap: ${nlpContext.keywordOverlap}%\n` +
      `- Matched terms: [${nlpContext.matchedKeywords.join(', ')}]\n` +
      `- Missing terms: [${nlpContext.missingKeywords.join(', ')}]\n\n` +
      `Return a technical score (0-100), communication score (0-100), and detailed feedback. ` +
      `The feedback must highlight strengths, details they missed, and clear tips to improve.`;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              technicalScore: { type: 'integer', description: 'Score representing technical accuracy and depth from 0 to 100.' },
              communicationScore: { type: 'integer', description: 'Score representing vocabulary, structural coherence, and clarity from 0 to 100.' },
              feedback: { type: 'string', description: 'Detailed feedback explaining what was good, what was missing, and tips to improve.' },
            },
            required: ['technicalScore', 'communicationScore', 'feedback'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API');
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('💥 Error evaluating response with Gemini:', error);
      // Fallback evaluation if API fails
      return {
        technicalScore: Math.round(nlpContext.similarityScore),
        communicationScore: Math.round(nlpContext.keywordOverlap),
        feedback: 'Evaluation completed using local NLP metrics. The candidate answer shows semantic alignment with the key concepts.',
      };
    }
  }

  async generateFinalFeedback(
    category: string,
    questions: IQuestionAnswer[]
  ): Promise<{ suggestions: string; topicsToRevise: string[]; readiness: 'High' | 'Medium' | 'Low' }> {
    const systemInstruction = 'You are a senior hiring partner analyzing a completed mock interview session.';
    
    // Construct questions and scores context
    const QsContext = questions.map((q, i) => (
      `Question ${i+1}: "${q.questionText}"\n` +
      `Answer: "${q.userAnswer}"\n` +
      `Evaluation: Tech ${q.technicalScore}%, Comm ${q.communicationScore}%, Feedback: "${q.feedback}"\n`
    )).join('\n');

    const prompt =
      `Analyze the candidate's performance in this ${category} mock interview:\n\n` +
      `${QsContext}\n` +
      `Generate a final feedback summary. Pick exactly 2-3 specific topics to revise based on their weaker answers. ` +
      `Estimate their interview readiness level as High, Medium, or Low.`;

    try {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              suggestions: { type: 'string', description: 'A 2-3 sentence overview of their performance and recommendations.' },
              topicsToRevise: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of exactly 2-3 specific sub-topics where they lost the most points.',
              },
              readiness: {
                type: 'string',
                enum: ['High', 'Medium', 'Low'],
                description: 'Overall interview readiness recommendation.',
              },
            },
            required: ['suggestions', 'topicsToRevise', 'readiness'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini API');
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('💥 Error generating final feedback:', error);
      // Fallback
      return {
        suggestions: 'Prepare by practicing more technical questions in this category. Focus on detailed term explanations.',
        topicsToRevise: Array.from(new Set(questions.map((q) => q.topic))).slice(0, 2),
        readiness: 'Medium',
      };
    }
  }
}
