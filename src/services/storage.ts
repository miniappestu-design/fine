import {
  UserProfile,
  Exercise,
  Routine,
  Recipe,
  Habit,
  HabitLog,
  ActivityLog,
  MealPlan,
  GroceryItem,
  ChatMessage,
  SupportedLocale,
} from '../types';
import { INITIAL_EXERCISES } from '../data/initialExercises';
import { INITIAL_ROUTINES } from '../data/initialRoutines';
import { INITIAL_RECIPES } from '../data/initialRecipes';
import { INITIAL_HABITS } from '../data/initialHabits';

const KEYS = {
  PROFILE: 'fitencasa_user_profile',
  CUSTOM_EXERCISES: 'fitencasa_custom_exercises',
  CUSTOM_ROUTINES: 'fitencasa_custom_routines',
  CUSTOM_RECIPES: 'fitencasa_custom_recipes',
  CUSTOM_HABITS: 'fitencasa_custom_habits',
  HABIT_LOGS: 'fitencasa_habit_logs',
  ACTIVITY_LOGS: 'fitencasa_activity_logs',
  MEAL_PLAN: 'fitencasa_meal_plan',
  GROCERY_LIST: 'fitencasa_grocery_list',
  CHAT_MESSAGES: 'fitencasa_chat_messages',
  FAVORITES: 'fitencasa_favorites',
};

export const DEFAULT_PROFILE: UserProfile = {
  id: 'user_local_primary',
  displayName: '',
  goals: ['Crear hábitos saludables', 'Moverse más en el día a día'],
  experienceLevel: 'beginner',
  availableTime: 20,
  preferredDays: ['Lunes', 'Miércoles', 'Viernes'],
  equipment: ['Sin material (solo peso corporal)'],
  dietaryPreferences: ['Equilibrada general'],
  excludedIngredients: [],
  reminderPreferences: {
    enabled: false,
    time: '09:00',
  },
  preferredLanguage: 'es',
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class StorageService {
  private get<T>(key: string, fallback: T): T {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        return JSON.parse(val);
      }
    } catch (e) {
      console.warn(`Error reading key ${key} from storage:`, e);
    }
    return fallback;
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Asynchronously trigger server backup sync if possible
      this.syncToServerDebounced();
    } catch (e) {
      console.warn(`Error writing key ${key} to storage:`, e);
    }
  }

  // Profile
  getProfile(): UserProfile {
    return this.get<UserProfile>(KEYS.PROFILE, DEFAULT_PROFILE);
  }

  saveProfile(profile: UserProfile): void {
    const updated = { ...profile, updatedAt: new Date().toISOString() };
    this.set(KEYS.PROFILE, updated);
  }

  // Exercises
  getExercises(): Exercise[] {
    const custom = this.get<Exercise[]>(KEYS.CUSTOM_EXERCISES, []);
    return [...INITIAL_EXERCISES, ...custom];
  }

  addCustomExercise(exercise: Exercise): void {
    const custom = this.get<Exercise[]>(KEYS.CUSTOM_EXERCISES, []);
    this.set(KEYS.CUSTOM_EXERCISES, [exercise, ...custom]);
  }

  // Routines
  getRoutines(): Routine[] {
    const custom = this.get<Routine[]>(KEYS.CUSTOM_ROUTINES, []);
    return [...INITIAL_ROUTINES, ...custom];
  }

  addCustomRoutine(routine: Routine): void {
    const custom = this.get<Routine[]>(KEYS.CUSTOM_ROUTINES, []);
    this.set(KEYS.CUSTOM_ROUTINES, [routine, ...custom]);
  }

  // Recipes
  getRecipes(): Recipe[] {
    const custom = this.get<Recipe[]>(KEYS.CUSTOM_RECIPES, []);
    return [...INITIAL_RECIPES, ...custom];
  }

  addCustomRecipe(recipe: Recipe): void {
    const custom = this.get<Recipe[]>(KEYS.CUSTOM_RECIPES, []);
    this.set(KEYS.CUSTOM_RECIPES, [recipe, ...custom]);
  }

  // Habits
  getHabits(): Habit[] {
    const custom = this.get<Habit[]>(KEYS.CUSTOM_HABITS, []);
    return [...INITIAL_HABITS, ...custom];
  }

  addCustomHabit(habit: Habit): void {
    const custom = this.get<Habit[]>(KEYS.CUSTOM_HABITS, []);
    this.set(KEYS.CUSTOM_HABITS, [habit, ...custom]);
  }

  // Habit Logs
  getHabitLogs(): HabitLog[] {
    return this.get<HabitLog[]>(KEYS.HABIT_LOGS, []);
  }

  isHabitDoneToday(habitId: string, dateString: string): boolean {
    const logs = this.getHabitLogs();
    const entry = logs.find((l) => l.habitId === habitId && l.date === dateString);
    return entry ? entry.completed : false;
  }

  toggleHabitLog(habitId: string, dateString: string): boolean {
    const logs = this.getHabitLogs();
    const existingIndex = logs.findIndex((l) => l.habitId === habitId && l.date === dateString);
    let newStatus = true;

    if (existingIndex >= 0) {
      newStatus = !logs[existingIndex].completed;
      logs[existingIndex].completed = newStatus;
      logs[existingIndex].timestamp = new Date().toISOString();
    } else {
      logs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        habitId,
        date: dateString,
        completed: true,
        timestamp: new Date().toISOString(),
      });
      newStatus = true;
    }

    this.set(KEYS.HABIT_LOGS, logs);

    // If marked done, add an activity log entry
    if (newStatus) {
      const allHabits = this.getHabits();
      const habit = allHabits.find((h) => h.id === habitId);
      const title = habit?.title['es'] || 'Hábito completado';
      this.logActivity({
        id: `act-${Date.now()}`,
        activityType: 'habit',
        referenceId: habitId,
        title,
        date: dateString,
        timestamp: new Date().toISOString(),
      });
    }

    return newStatus;
  }

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    return this.get<ActivityLog[]>(KEYS.ACTIVITY_LOGS, []);
  }

  logActivity(activity: ActivityLog): void {
    const logs = this.getActivityLogs();
    // prevent duplicates within 5 seconds for same activity
    const isRecentDup = logs.some(
      (l) =>
        l.referenceId === activity.referenceId &&
        l.date === activity.date &&
        Math.abs(new Date(l.timestamp).getTime() - new Date(activity.timestamp).getTime()) < 5000
    );
    if (isRecentDup) return;

    this.set(KEYS.ACTIVITY_LOGS, [activity, ...logs]);
  }

  // Weekly Meal Plan
  getMealPlan(): MealPlan {
    const today = new Date();
    // find Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const weekStart = monday.toISOString().split('T')[0];

    const fallback: MealPlan = {
      id: `plan-${weekStart}`,
      userId: 'user_local_primary',
      weekStart,
      assignments: [
        { dayIndex: 0, mealType: 'breakfast', recipeId: 'rec-oatmeal-berries' },
        { dayIndex: 0, mealType: 'lunch', recipeId: 'rec-chickpeas-spinach' },
        { dayIndex: 0, mealType: 'dinner', recipeId: 'rec-zucchini-soup' },
        { dayIndex: 1, mealType: 'breakfast', recipeId: 'rec-avocado-toast' },
        { dayIndex: 2, mealType: 'lunch', recipeId: 'rec-chickpeas-spinach' },
        { dayIndex: 3, mealType: 'dinner', recipeId: 'rec-zucchini-soup' },
      ],
      updatedAt: new Date().toISOString(),
    };
    return this.get<MealPlan>(KEYS.MEAL_PLAN, fallback);
  }

  saveMealPlan(plan: MealPlan): void {
    this.set(KEYS.MEAL_PLAN, { ...plan, updatedAt: new Date().toISOString() });
  }

  assignMeal(dayIndex: number, mealType: any, recipeId: string): void {
    const plan = this.getMealPlan();
    const filtered = plan.assignments.filter(
      (a) => !(a.dayIndex === dayIndex && a.mealType === mealType)
    );
    if (recipeId) {
      filtered.push({ dayIndex, mealType, recipeId });
    }
    this.saveMealPlan({ ...plan, assignments: filtered });
  }

  // Grocery List
  getGroceryList(): GroceryItem[] {
    return this.get<GroceryItem[]>(KEYS.GROCERY_LIST, []);
  }

  saveGroceryList(items: GroceryItem[]): void {
    this.set(KEYS.GROCERY_LIST, items);
  }

  generateGroceriesFromMealPlan(locale: SupportedLocale): GroceryItem[] {
    const plan = this.getMealPlan();
    const recipes = this.getRecipes();
    const existingList = this.getGroceryList().filter((item) => !item.autoGenerated);

    const generatedMap = new Map<string, GroceryItem>();

    plan.assignments.forEach((assign) => {
      const recipe = recipes.find((r) => r.id === assign.recipeId);
      if (recipe) {
        recipe.ingredients.forEach((ing) => {
          const ingName = ing.name[locale] || ing.name['es'];
          const key = ingName.toLowerCase().trim();
          if (!generatedMap.has(key)) {
            generatedMap.set(key, {
              id: `groc-${Math.random().toString(36).substring(2, 9)}`,
              name: `${ingName} (${ing.amount})`,
              category: recipe.title[locale] || recipe.title['es'],
              checked: false,
              autoGenerated: true,
              sourceRecipeId: recipe.id,
            });
          }
        });
      }
    });

    const combined = [...Array.from(generatedMap.values()), ...existingList];
    this.saveGroceryList(combined);
    return combined;
  }

  // Favorites
  getFavorites(): string[] {
    return this.get<string[]>(KEYS.FAVORITES, []);
  }

  toggleFavorite(id: string): boolean {
    const favs = this.getFavorites();
    const idx = favs.indexOf(id);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(id);
      isFav = true;
    }
    this.set(KEYS.FAVORITES, favs);
    return isFav;
  }

  // Chat History
  getChatMessages(): ChatMessage[] {
    return this.get<ChatMessage[]>(KEYS.CHAT_MESSAGES, []);
  }

  saveChatMessages(messages: ChatMessage[]): void {
    // Keep max 50 recent messages to prevent bloated local storage
    const trimmed = messages.slice(-50);
    this.set(KEYS.CHAT_MESSAGES, trimmed);
  }

  // Backup Sync to Server
  private syncTimer: any = null;
  private syncToServerDebounced(): void {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(async () => {
      try {
        const payload = {
          profile: this.getProfile(),
          customExercises: this.get<Exercise[]>(KEYS.CUSTOM_EXERCISES, []),
          customRoutines: this.get<Routine[]>(KEYS.CUSTOM_ROUTINES, []),
          customRecipes: this.get<Recipe[]>(KEYS.CUSTOM_RECIPES, []),
          customHabits: this.get<Habit[]>(KEYS.CUSTOM_HABITS, []),
          habitLogs: this.getHabitLogs(),
          activityLogs: this.getActivityLogs(),
          mealPlan: this.getMealPlan(),
          groceryList: this.getGroceryList(),
        };
        await fetch('/api/data/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: payload.profile.id, payload }),
        });
      } catch (err) {
        // Safe silent fail for offline / no network
      }
    }, 2500);
  }

  // Data Export & Reset
  exportAllData(): string {
    const data = {
      profile: this.getProfile(),
      customExercises: this.get<Exercise[]>(KEYS.CUSTOM_EXERCISES, []),
      customRoutines: this.get<Routine[]>(KEYS.CUSTOM_ROUTINES, []),
      customRecipes: this.get<Recipe[]>(KEYS.CUSTOM_RECIPES, []),
      customHabits: this.get<Habit[]>(KEYS.CUSTOM_HABITS, []),
      habitLogs: this.getHabitLogs(),
      activityLogs: this.getActivityLogs(),
      mealPlan: this.getMealPlan(),
      groceryList: this.getGroceryList(),
      favorites: this.getFavorites(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  resetAllData(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    this.saveProfile(DEFAULT_PROFILE);
  }
}

export const storage = new StorageService();
