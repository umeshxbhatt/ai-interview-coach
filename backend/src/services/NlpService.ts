import { env } from '../config/environment';

export interface INlpEvaluationResult {
  similarityScore: number;
  keywordOverlap: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export class NlpService {
  private serviceUrl = env.PYTHON_SERVICE_URL;

  async evaluateResponse(
    userAnswer: string,
    idealAnswer: string
  ): Promise<INlpEvaluationResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    try {
      const response = await fetch(`${this.serviceUrl}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAnswer, idealAnswer }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`NLP service returned non-OK status: ${response.status}`);
      }

      const data = await response.json() as INlpEvaluationResult;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Graceful degradation: Log microservice warnings and fall back to manual statistics
      console.warn(
        `📡 NLP microservice request failed at URL: ${this.serviceUrl}/evaluate. Falling back to local statistics. Error details:`,
        error instanceof Error ? error.message : error
      );
      
      // Fallback calculation: simple word overlap counts
      const userWords = new Set(userAnswer.toLowerCase().split(/\s+/));
      const idealWords = new Set(idealAnswer.toLowerCase().split(/\s+/));
      
      const matched = Array.from(idealWords).filter((w) => userWords.has(w) && w.length > 3);
      const missing = Array.from(idealWords).filter((w) => !userWords.has(w) && w.length > 3);
      
      const overlap = idealWords.size > 0 ? (matched.length / idealWords.size) * 100 : 100;
      
      return {
        similarityScore: Math.round(Math.min(50 + matched.length * 3, 90)), // basic fallback estimation
        keywordOverlap: Math.round(overlap),
        matchedKeywords: matched.slice(0, 10),
        missingKeywords: missing.slice(0, 10),
      };
    }
  }
}
