import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Utensils,
  CheckCircle2,
  Circle,
  Play,
  ArrowRight,
  TrendingUp,
  Moon,
  Sun,
  Flame,
  Award,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { UserProfile, Routine, Recipe, Habit, NavTab } from '../types';
import { storage } from '../services/storage';

interface HomeScreenProps {
  profile: UserProfile;
  onChangeTab: (tab: NavTab) => void;
  onStartRoutine: (routine: Routine) => void;
  onViewRecipe: (recipe: Recipe) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onChangeTab,
  onStartRoutine,
  onViewRecipe,
}) => {
  const { t, locale, formatDate } = useTranslation();

  const routines = storage.getRoutines();
  const recipes = storage.getRecipes();
  const habits = storage.getHabits().filter((h) => h.active);

  // Recommended routine matched to user's time & level
  const recommendedRoutine =
    routines.find((r) => r.estimatedMinutes <= (profile.availableTime || 20)) || routines[0];

  // Meal idea
  const recommendedRecipe = recipes[0];

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Habits state
  const [habitState, setHabitState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    habits.forEach((h) => {
      map[h.id] = storage.isHabitDoneToday(h.id, todayStr);
    });
    return map;
  });

  const handleToggleHabit = (habitId: string) => {
    const nextVal = storage.toggleHabitLog(habitId, todayStr);
    setHabitState((prev) => ({ ...prev, [habitId]: nextVal }));
  };

  const completedHabitsCount = Object.values(habitState).filter(Boolean).length;
  const totalHabitsCount = habits.length;

  const activityLogs = storage.getActivityLogs();
  const workoutsToday = activityLogs.filter(
    (l) => l.activityType === 'workout' && l.date === todayStr
  ).length;

  // Personalized greeting
  const greeting = profile.displayName
    ? `${t('home.greeting')}, ${profile.displayName}`
    : `${t('home.greeting')}`;

  const currentHour = new Date().getHours();
  const timeOfDayIcon = currentHour < 12 ? Sun : currentHour < 19 ? Sun : Moon;
  const TimeIcon = timeOfDayIcon;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Personalized Welcoming Card */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
          <Sparkles className="w-24 h-24 text-white" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-medium mb-3 border border-white/10">
              <TimeIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}
            </h1>
            <p className="mt-1.5 text-emerald-100/90 text-sm max-w-md leading-relaxed">
              {profile.goals?.[0] || t('app.slogan')}
            </p>
          </div>

          {/* Today's completion pill */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/10 sm:self-center">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-200">{t('home.completedToday')}</div>
              <div className="text-base font-bold text-white">
                {workoutsToday > 0 ? '1' : '0'} {t('workouts.routinesSection').toLowerCase()} • {completedHabitsCount}/{totalHabitsCount} {t('nav.progress').toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Pills */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            {t('home.quickActions')}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onStartRoutine(recommendedRoutine)}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs transition text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition">
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-900 truncate">
                {t('home.startRoutineBtn')}
              </div>
              <div className="text-[11px] text-stone-500">
                {recommendedRoutine.estimatedMinutes} min
              </div>
            </div>
          </button>

          <button
            onClick={() => onViewRecipe(recommendedRecipe)}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs transition text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-900 truncate">
                {t('home.viewRecipeBtn')}
              </div>
              <div className="text-[11px] text-stone-500">
                {recommendedRecipe.prepMinutes} min
              </div>
            </div>
          </button>

          <button
            onClick={() => onChangeTab('assistant')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs transition text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-900 truncate">
                {t('home.askAi')}
              </div>
              <div className="text-[11px] text-stone-500">Gemini AI</div>
            </div>
          </button>

          <button
            onClick={() => onChangeTab('progress')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs transition text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-700 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-900 truncate">
                {t('home.viewProgress')}
              </div>
              <div className="text-[11px] text-stone-500">
                {activityLogs.length} {t('common.actions').toLowerCase()}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Recommended Today Cards (Workout & Recipe) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommended Routine Card */}
        <div className="rounded-3xl bg-white p-5 border border-stone-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[11px]">
                {t('home.recommendedRoutine')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                {recommendedRoutine.estimatedMinutes} {t('common.minutes')}
              </span>
            </div>

            <h3 className="text-base font-bold text-stone-900 leading-snug">
              {recommendedRoutine.title[locale] || recommendedRoutine.title['es']}
            </h3>

            <p className="mt-1.5 text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {recommendedRoutine.description[locale] || recommendedRoutine.description['es']}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              {recommendedRoutine.exerciseIds.length} {t('workouts.exercisesCount')}
            </span>
            <button
              onClick={() => onStartRoutine(recommendedRoutine)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('workouts.startRoutine')}</span>
            </button>
          </div>
        </div>

        {/* Meal Suggestion Card */}
        <div className="rounded-3xl bg-white p-5 border border-stone-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span className="font-semibold text-amber-800 uppercase tracking-wider text-[11px]">
                {t('home.mealIdea')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium">
                {recommendedRecipe.prepMinutes} {t('common.minutes')}
              </span>
            </div>

            <h3 className="text-base font-bold text-stone-900 leading-snug">
              {recommendedRecipe.title[locale] || recommendedRecipe.title['es']}
            </h3>

            <p className="mt-1.5 text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {recommendedRecipe.description[locale] || recommendedRecipe.description['es']}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              {recommendedRecipe.servings} {t('nutrition.servings').toLowerCase()}
            </span>
            <button
              onClick={() => onViewRecipe(recommendedRecipe)}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('home.viewRecipeBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Habits Checklist */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {t('home.pendingHabits')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {completedHabitsCount}/{totalHabitsCount} {t('common.active').toLowerCase()}
            </p>
          </div>

          <button
            onClick={() => onChangeTab('progress')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('common.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {habits.map((habit) => {
            const isDone = !!habitState[habit.id];
            const title = habit.title[locale] || habit.title['es'];
            const desc = habit.description[locale] || habit.description['es'];

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-stone-500'
                    : 'bg-stone-50/60 border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-800'
                }`}
              >
                <button
                  type="button"
                  aria-label={title}
                  className="mt-0.5 text-emerald-700 shrink-0 cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-400 hover:text-emerald-600" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                    {title}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-normal">
                    {desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gentle Today Wellness Sequence Flow */}
      <section className="rounded-3xl bg-stone-50 border border-stone-200 p-5 sm:p-6">
        <h2 className="text-sm font-bold text-stone-900 mb-1">
          {t('home.todaySequence')}
        </h2>
        <p className="text-xs text-stone-500 mb-4">
          {t('app.tagline')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="text-xs font-medium text-stone-800">
              {t('home.sequenceMovement')}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="text-xs font-medium text-stone-800">
              {t('home.sequenceMeal')}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="text-xs font-medium text-stone-800">
              {t('home.sequenceHabit')}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
              4
            </div>
            <div className="text-xs font-medium text-stone-800">
              {t('home.sequenceRest')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
