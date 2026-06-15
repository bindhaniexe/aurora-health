// Aurora — Groq Client
// Interacts with the Groq API for text generation (e.g. daily insight cards)
// Uses direct fetch requests to remain lightweight and avoid heavyweight OpenAI/Groq packages.

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const groq = {
  /**
   * Generates text based on user prompt and system prompt using Groq (llama-3.3-70b-versatile).
   * Capped to 60 max tokens per Groq rules in AGENTS.md.
   */
  async chatCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    if (!GROQ_API_KEY) {
      console.warn('Groq API Key is not set in environment variables');
      return 'Groq API key not configured.';
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          max_tokens: 60,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${errorText}`);
      }

      const data: GroqCompletionResponse = await response.json();
      return data.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error in Groq chatCompletion:', error);
      throw error;
    }
  },
};
