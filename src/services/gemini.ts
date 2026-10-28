import { SupportedLocale, UserProfile } from '../types';

export interface ChatRequestPayload {
  messages: { role: string; content: string }[];
  userProfile?: UserProfile;
  language: SupportedLocale;
}

export interface RoutineRequestPayload {
  userProfile?: UserProfile;
  targetMinutes: number;
  focusArea: string;
  language: SupportedLocale;
}

export interface RecipeRequestPayload {
  availableIngredients: string;
  mealType: string;
  userProfile?: UserProfile;
  language: SupportedLocale;
}

export interface ProgressInsightsPayload {
  activityStats: {
    workoutsCount: number;
    habitsCount: number;
    currentStreak: number;
  };
  language: SupportedLocale;
}

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    return { status: 'offline', hasGeminiKey: false };
  }
}

export async function chatWithGemini(payload: ChatRequestPayload): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Error processing request',
      };
    }
    return { success: true, text: data.text };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error communicating with server',
    };
  }
}

export async function generateRoutineWithGemini(payload: RoutineRequestPayload): Promise<{ success: boolean; routine?: any; error?: string }> {
  try {
    const res = await fetch('/api/gemini/generate-routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'Error generating routine' };
    }
    return { success: true, routine: data.routine };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error communicating with server' };
  }
}

export async function generateRecipeWithGemini(payload: RecipeRequestPayload): Promise<{ success: boolean; recipe?: any; error?: string }> {
  try {
    const res = await fetch('/api/gemini/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'Error generating recipe' };
    }
    return { success: true, recipe: data.recipe };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error communicating with server' };
  }
}

export async function generateProgressInsights(payload: ProgressInsightsPayload): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/progress-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || 'Error generating insights' };
    }
    return { success: true, summary: data.summary };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error communicating with server' };
  }
}
