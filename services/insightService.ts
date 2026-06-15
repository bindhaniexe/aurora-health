import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Profile } from '@/types';
import { HealthSummary } from '@/hooks/useHealthSummary';

export const insightService = {
  async getTodayInsight(userId: string): Promise<string | null> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('insights_cache')
      .select('insight_text')
      .eq('user_id', userId)
      .eq('generated_date', today)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    
    // Log to verify it's cached as requested in HOW TO TEST #4
    console.log('[InsightCache] Returning cached insight:', data.insight_text);
    return data.insight_text;
  },

  async saveInsight(userId: string, text: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('insights_cache')
      .upsert({
        user_id: userId,
        insight_text: text,
        generated_date: today,
      }, { onConflict: 'user_id,generated_date', ignoreDuplicates: true });

    if (error) {
      // PGRST205 means the table doesn't exist yet. We can suppress this specific error 
      // so it doesn't spam the console while testing without the table.
      if (error.code === 'PGRST205') {
        console.warn('[InsightCache] Table insights_cache does not exist yet. Please create it in Supabase.');
      } else {
        console.error('[InsightCache] Failed to save insight:', error);
      }
    }
  },

  async generateInsight(summary: HealthSummary, profile: Profile): Promise<string | null> {
    try {
      const cachedInsight = await this.getTodayInsight(profile.id);
      if (cachedInsight) {
        return cachedInsight;
      }

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_key_from_aistudio.google.com') {
        const fallbacks = [
          "Drink an extra glass of water today to keep your energy up!",
          "Great job showing up today! Consistency is your superpower.",
          "Take a deep breath and stretch. Your body will thank you.",
          "Small daily steps lead to massive results over time.",
          "You're doing amazing! Keep building those healthy habits."
        ];
        const fallbackText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        await this.saveInsight(profile.id, fallbackText);
        return fallbackText;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are Aurora, a friendly health companion.
Based on this user's health data:
- Water today: ${summary.todayWaterMl}ml of ${summary.waterGoalMl}ml goal
- Sleep last night: ${summary.lastSleepHours ?? 'not logged'} hours (goal: ${summary.sleepGoalHrs}hrs)
- Habits: ${summary.habitsCompleted} of ${summary.habitsTotal} completed today

Write exactly ONE short, warm, encouraging health tip or observation.
Maximum 20 words. Plain text only. No quotes. No bullet points.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      if (text) {
        await this.saveInsight(profile.id, text);
        return text;
      }
      return null;
    } catch (err) {
      // Catch silently on any error, do NOT throw
      console.warn('[InsightCache] Error generating insight:', err);
      return null;
    }
  }
};

export const generateInsight = insightService.generateInsight.bind(insightService);
