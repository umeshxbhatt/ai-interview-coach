import { GoogleGenAI } from '@google/genai';
import { env } from './environment';

export const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});
