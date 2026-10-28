import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  Download,
  Trash2,
  Flame,
  Dumbbell,
  Clock,
  Heart,
  AlertCircle,
  X,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { UserProfile, ActivityLog, HabitLog } from '../types';
import { storage } from '../services/storage';
import { generateProgressInsights } from '../services/gemini';

interface ProgressScreenProps {
  profile: UserProfile;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ profile }) => {
  const { t, locale, formatDate } = useTranslation();

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    storage.getActivityLogs()
  );
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(() =>
    storage.getHabitLogs()
  );

  // Gemini AI summary
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Calculations
  const workoutsCount = activityLogs.filter((l) => l.activityType === 'workout').length;
  const habitsDoneCount = habitLogs.filter((l) => l.completed).length;

  // Calculate simple active days streak
  const uniqueActiveDates = Array.from(
    new Set([...activityLogs.map((l) => l.date), ...habitLogs.filter((h) => h.completed).map((h) => h.date)])
  ).sort().reverse();

  let streak = 0;
  if (uniqueActiveDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If active today or yesterday, streak is at least length of consecutive days
    if (uniqueActiveDates[0] === todayStr || uniqueActiveDates[0] === yesterdayStr) {
      streak = uniqueActiveDates.length;
    }
  }

  // Days of current week representation
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const handleGenerateSummary = async () => {
    setIsGeneratingAi(true);
    const res = await generateProgressInsights({
      activityStats: {
        workoutsCount,
        habitsCount: habitsDoneCount,
        currentStreak: streak,
      },
      language: locale,
    });
    setIsGeneratingAi(false);
    if (res.success && res.summary) {
      setAiSummary(res.summary);
    } else {
      setAiSummary(
        '¡Sigue adelante! Cada pequeño paso de movimiento y cada comida consciente fortalecen tu salud a largo plazo.'
      );
    }
  };

  const handleExportData = () => {
    const jsonStr = storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fit-en-casa-datos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    storage.resetAllData();
    setActivityLogs([]);
    setHabitLogs([]);
    setShowResetModal(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          {t('progress.title')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          {t('progress.subtitle')}
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">{workoutsCount}</div>
          <div className="text-[11px] font-medium text-stone-500 mt-0.5 truncate">
            {t('progress.totalWorkouts')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">{habitsDoneCount}</div>
          <div className="text-[11px] font-medium text-stone-500 mt-0.5 truncate">
            {t('progress.totalHabits')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-2">
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {streak} <span className="text-xs font-normal text-stone-500">{t('common.days')}</span>
          </div>
          <div className="text-[11px] font-medium text-stone-500 mt-0.5 truncate">
            {t('progress.currentStreak')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {Math.min(100, (uniqueActiveDates.length / 7) * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] font-medium text-stone-500 mt-0.5 truncate">
            {t('progress.consistency')}
          </div>
        </div>
      </div>

      {/* Week Consistency Heatmap */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <h2 className="text-sm font-bold text-stone-900 mb-1">
          {t('progress.consistency')}
        </h2>
        <p className="text-xs text-stone-500 mb-4">
          Visualiza tu regularidad sin presiones.
        </p>

        <div className="flex items-center justify-between gap-1 max-w-sm mx-auto">
          {dayNames.map((day, idx) => {
            const isToday = idx === currentDayOfWeek;
            const hasActivity = idx <= currentDayOfWeek && uniqueActiveDates.length > 0;

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <span className={`text-[10px] font-bold ${isToday ? 'text-emerald-700' : 'text-stone-400'}`}>
                  {day}
                </span>
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-semibold transition ${
                    hasActivity
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : isToday
                      ? 'border-2 border-emerald-600 text-emerald-800'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {hasActivity ? <CheckCircle2 className="w-4 h-4" /> : '•'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gemini AI Summary Generator */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {t('progress.aiSummaryTitle')}
              </h3>
              <p className="text-xs text-stone-500">
                {t('progress.aiSummarySubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingAi}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isGeneratingAi
                ? t('progress.generatingSummary')
                : t('progress.generateSummaryBtn')}
            </span>
          </button>
        </div>

        {aiSummary && (
          <div className="mt-3 p-4 rounded-2xl bg-white border border-emerald-200/80 text-xs text-stone-800 leading-relaxed whitespace-pre-line shadow-2xs">
            {aiSummary}
          </div>
        )}
      </section>

      {/* Real Activity Logs History Table */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <h2 className="text-sm font-bold text-stone-900 mb-1">
          {t('progress.recentLogs')}
        </h2>
        <p className="text-xs text-stone-500 mb-4">
          {activityLogs.length} {t('common.actions').toLowerCase()}
        </p>

        {activityLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            {t('progress.noLogs')}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      log.activityType === 'workout'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {log.activityType === 'workout' ? (
                      <Dumbbell className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">{log.title}</div>
                    <div className="text-[11px] text-stone-400 capitalize">
                      {log.date}
                    </div>
                  </div>
                </div>

                {log.durationMinutes && (
                  <span className="font-mono text-stone-500 text-[11px]">
                    {log.durationMinutes} min
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data Management Section */}
      <section className="rounded-3xl bg-stone-50 border border-stone-200 p-5 sm:p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
          {t('progress.exportSection')}
        </h3>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleExportData}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>{t('progress.exportBtn')}</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="py-2.5 px-4 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('progress.resetBtn')}</span>
          </button>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-stone-900">
              ¿Eliminar todos tus registros?
            </h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              {t('progress.confirmResetModal')}
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
              >
                {t('common.cancel')}
              </button>

              <button
                onClick={handleResetData}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
