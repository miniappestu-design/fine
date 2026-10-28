import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  X,
  Filter,
  Sparkles,
  Clock,
  ShieldAlert,
  Info,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  Volume2,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { Exercise, Routine, UserProfile } from '../types';
import { storage } from '../services/storage';
import { generateRoutineWithGemini } from '../services/gemini';
import { playShortBeep, playChimeSuccess } from '../services/audioTimer';

interface WorkoutsScreenProps {
  profile: UserProfile;
  initialSelectedRoutine?: Routine | null;
  onClearInitialRoutine?: () => void;
}

export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({
  profile,
  initialSelectedRoutine,
  onClearInitialRoutine,
}) => {
  const { t, locale } = useTranslation();

  const [routines, setRoutines] = useState<Routine[]>(() => storage.getRoutines());
  const [exercises, setExercises] = useState<Exercise[]>(() => storage.getExercises());

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  // Exercise Detail Modal
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  // Active Workout Player State
  const [activeSessionRoutine, setActiveSessionRoutine] = useState<Routine | null>(
    initialSelectedRoutine || null
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const timerRef = useRef<any>(null);

  // AI Routine Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTargetMinutes, setAiTargetMinutes] = useState(profile.availableTime || 20);
  const [aiFocusArea, setAiFocusArea] = useState('fullBody');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedRoutine, setAiGeneratedRoutine] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // If initialSelectedRoutine changes from props
  useEffect(() => {
    if (initialSelectedRoutine) {
      startRoutineSession(initialSelectedRoutine);
      if (onClearInitialRoutine) onClearInitialRoutine();
    }
  }, [initialSelectedRoutine]);

  // Workout Session Player Timer
  useEffect(() => {
    if (!activeSessionRoutine || sessionCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const currentEx = getCurrentSessionExercise();
    const duration = currentEx?.durationSeconds || 30;

    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 4 && prev > 1) {
            playShortBeep(700, 0.08); // countdown warning
          }
          if (prev <= 1) {
            // Advance to next exercise or finish
            playShortBeep(1000, 0.2);
            handleNextExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSessionRoutine, currentExerciseIndex, isPaused, sessionCompleted]);

  const getCurrentSessionExercise = (): Exercise | null => {
    if (!activeSessionRoutine) return null;
    const exId = activeSessionRoutine.exerciseIds[currentExerciseIndex];
    return exercises.find((e) => e.id === exId) || exercises[0] || null;
  };

  const startRoutineSession = (routine: Routine) => {
    setActiveSessionRoutine(routine);
    setCurrentExerciseIndex(0);
    setIsPaused(false);
    setSessionCompleted(false);

    const firstExId = routine.exerciseIds[0];
    const firstEx = exercises.find((e) => e.id === firstExId);
    setTimeRemaining(firstEx?.durationSeconds || 30);
  };

  const handleNextExercise = () => {
    if (!activeSessionRoutine) return;
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < activeSessionRoutine.exerciseIds.length) {
      setCurrentExerciseIndex(nextIdx);
      const nextExId = activeSessionRoutine.exerciseIds[nextIdx];
      const nextEx = exercises.find((e) => e.id === nextExId);
      setTimeRemaining(nextEx?.durationSeconds || 30);
    } else {
      // Workout completed!
      completeSession();
    }
  };

  const handlePrevExercise = () => {
    if (!activeSessionRoutine || currentExerciseIndex === 0) return;
    const prevIdx = currentExerciseIndex - 1;
    setCurrentExerciseIndex(prevIdx);
    const prevExId = activeSessionRoutine.exerciseIds[prevIdx];
    const prevEx = exercises.find((e) => e.id === prevExId);
    setTimeRemaining(prevEx?.durationSeconds || 30);
  };

  const completeSession = () => {
    if (!activeSessionRoutine) return;
    playChimeSuccess();
    setSessionCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Save actual activity log
    const todayStr = new Date().toISOString().split('T')[0];
    const routineTitle =
      activeSessionRoutine.title[locale] || activeSessionRoutine.title['es'];

    storage.logActivity({
      id: `workout-${Date.now()}`,
      activityType: 'workout',
      referenceId: activeSessionRoutine.id,
      title: routineTitle,
      durationMinutes: activeSessionRoutine.estimatedMinutes,
      date: todayStr,
      timestamp: new Date().toISOString(),
    });
  };

  const exitSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveSessionRoutine(null);
    setSessionCompleted(false);
  };

  // AI Routine Generation
  const handleGenerateAiRoutine = async () => {
    setIsGenerating(true);
    setAiError(null);
    setAiGeneratedRoutine(null);

    const result = await generateRoutineWithGemini({
      userProfile: profile,
      targetMinutes: aiTargetMinutes,
      focusArea: aiFocusArea,
      language: locale,
    });

    setIsGenerating(false);
    if (result.success && result.routine) {
      setAiGeneratedRoutine(result.routine);
    } else {
      setAiError(result.error || 'No se pudo generar la rutina con Gemini');
    }
  };

  const handleSaveAiRoutine = () => {
    if (!aiGeneratedRoutine) return;

    // Convert generated exercises to standard exercises if needed or link to catalog
    const newRoutineId = `routine-ai-${Date.now()}`;
    const newRoutine: Routine = {
      id: newRoutineId,
      level: (aiGeneratedRoutine.level?.toLowerCase() as any) || 'beginner',
      estimatedMinutes: aiGeneratedRoutine.estimatedMinutes || aiTargetMinutes,
      exerciseIds: ['ex-mobility-1', 'ex-squat-chair', 'ex-active-march'],
      tags: ['gemini_ai', aiFocusArea],
      isCustom: true,
      title: {
        es: aiGeneratedRoutine.title,
        'pt-PT': aiGeneratedRoutine.title,
        'pt-BR': aiGeneratedRoutine.title,
        'en-US': aiGeneratedRoutine.title,
        'en-GB': aiGeneratedRoutine.title,
        fr: aiGeneratedRoutine.title,
        it: aiGeneratedRoutine.title,
      },
      description: {
        es: aiGeneratedRoutine.description,
        'pt-PT': aiGeneratedRoutine.description,
        'pt-BR': aiGeneratedRoutine.description,
        'en-US': aiGeneratedRoutine.description,
        'en-GB': aiGeneratedRoutine.description,
        fr: aiGeneratedRoutine.description,
        it: aiGeneratedRoutine.description,
      },
    };

    storage.addCustomRoutine(newRoutine);
    setRoutines(storage.getRoutines());
    setShowAiModal(false);
    setAiGeneratedRoutine(null);
    startRoutineSession(newRoutine);
  };

  // Filter exercises
  const filteredExercises = exercises.filter((ex) => {
    if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;
    if (selectedLevel !== 'all' && ex.difficulty !== selectedLevel) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {t('workouts.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {t('workouts.subtitle')}
          </p>
        </div>

        {/* AI Routine Generator Trigger */}
        <button
          onClick={() => setShowAiModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-semibold shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{t('workouts.aiRoutineBtn')}</span>
        </button>
      </div>

      {/* Recommended Routines Section */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            {t('workouts.routinesSection')}
          </h2>
          <span className="text-xs text-stone-400">
            {routines.length} {t('common.all').toLowerCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {routines.map((routine) => {
            const title = routine.title[locale] || routine.title['es'];
            const desc = routine.description[locale] || routine.description['es'];

            return (
              <div
                key={routine.id}
                className="rounded-3xl bg-white p-5 border border-stone-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                      <Clock className="w-3.5 h-3.5" />
                      {routine.estimatedMinutes} {t('common.minutes')}
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium">
                      {routine.level}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">
                    {routine.exerciseIds.length} {t('workouts.exercisesCount')}
                  </span>
                  <button
                    onClick={() => startRoutineSession(routine)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t('workouts.startRoutine')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exercises Catalog Section with Filters */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {t('workouts.catalogSection')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {filteredExercises.length} {t('workouts.exercisesCount')}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all', label: t('common.all') },
              { id: 'mobility', label: 'Movilidad' },
              { id: 'lower_body', label: 'Tren inferior' },
              { id: 'upper_body', label: 'Tren superior' },
              { id: 'core_balance', label: 'Core' },
              { id: 'low_impact_cardio', label: 'Cardio suave' },
              { id: 'recovery_stretch', label: 'Estiramiento' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="space-y-2.5">
          {filteredExercises.map((exercise) => {
            const name = exercise.name[locale] || exercise.name['es'];
            const tips = exercise.tips[locale] || exercise.tips['es'];

            return (
              <div
                key={exercise.id}
                onClick={() => setViewingExercise(exercise)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 group-hover:text-emerald-950 truncate">
                      {name}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">
                      {exercise.equipment} • {exercise.durationSeconds} {t('common.seconds')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="capitalize text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {exercise.difficulty}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exercise Detail Modal */}
      {viewingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 my-8">
            <button
              onClick={() => setViewingExercise(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold mb-1">
              <span className="capitalize">{viewingExercise.category.replace('_', ' ')}</span>
              <span>•</span>
              <span>{viewingExercise.durationSeconds} {t('common.seconds')}</span>
            </div>

            <h3 className="text-xl font-extrabold text-stone-900">
              {viewingExercise.name[locale] || viewingExercise.name['es']}
            </h3>

            {/* Instructions */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                {t('workouts.instructions')}
              </h4>
              <ol className="space-y-1.5 list-decimal list-inside text-xs text-stone-700 leading-relaxed">
                {(viewingExercise.instructions[locale] || viewingExercise.instructions['es']).map(
                  (step, idx) => (
                    <li key={idx}>{step}</li>
                  )
                )}
              </ol>
            </div>

            {/* Tips & Precautions */}
            <div className="mt-4 space-y-2.5">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <span className="font-semibold">{t('workouts.techniqueTip')}: </span>
                  {viewingExercise.tips[locale] || viewingExercise.tips['es']}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
                <div>
                  <span className="font-semibold">{t('workouts.alternative')}: </span>
                  {viewingExercise.alternatives[locale] || viewingExercise.alternatives['es']}
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewingExercise(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Guided Workout Player Modal */}
      {activeSessionRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 overflow-hidden">
            {/* Header / Quit button */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {t('workouts.playerTitle')}
                </span>
                <h3 className="text-sm font-bold text-stone-900 truncate max-w-[220px]">
                  {activeSessionRoutine.title[locale] || activeSessionRoutine.title['es']}
                </h3>
              </div>

              <button
                onClick={exitSession}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                title={t('workouts.quitWorkout')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If completed */}
            {sessionCompleted ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 fill-emerald-600 text-white" />
                </div>
                <h4 className="text-xl font-extrabold text-stone-900">
                  {t('workouts.workoutCompletedTitle')}
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-xs leading-relaxed">
                  {t('workouts.workoutCompletedSubtitle')}
                </p>

                <div className="mt-6 w-full space-y-2">
                  <button
                    onClick={exitSession}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
                  >
                    {t('common.finish')}
                  </button>
                </div>
              </div>
            ) : (
              /* Active Exercise View */
              <div className="py-6 flex flex-col items-center text-center">
                {/* Exercise step index */}
                <div className="text-xs text-stone-400 font-semibold mb-2">
                  {t('onboarding.step')} {currentExerciseIndex + 1} {t('onboarding.of')}{' '}
                  {activeSessionRoutine.exerciseIds.length}
                </div>

                {/* Exercise Name */}
                <h4 className="text-lg font-bold text-stone-900 min-h-[56px] flex items-center justify-center max-w-xs">
                  {getCurrentSessionExercise()?.name[locale] ||
                    getCurrentSessionExercise()?.name['es']}
                </h4>

                {/* Big Circular Countdown Display */}
                <div className="my-6 relative flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-4 border-emerald-100 flex flex-col items-center justify-center bg-emerald-50/50 shadow-inner">
                    <span className="text-4xl font-extrabold text-emerald-900 font-mono tracking-tight">
                      {timeRemaining}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 mt-0.5">
                      {t('common.seconds')}
                    </span>
                  </div>
                </div>

                {/* Technique Tip Snippet */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 max-w-xs leading-relaxed text-left">
                  <span className="font-semibold text-stone-800">
                    {t('workouts.techniqueTip')}:{' '}
                  </span>
                  {getCurrentSessionExercise()?.tips[locale] ||
                    getCurrentSessionExercise()?.tips['es']}
                </div>

                {/* Control Action Buttons */}
                <div className="mt-6 w-full flex items-center justify-center gap-3">
                  <button
                    onClick={handlePrevExercise}
                    disabled={currentExerciseIndex === 0}
                    className="p-3 rounded-2xl border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title={t('workouts.prevExercise')}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>{t('workouts.resumeSession')}</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>{t('workouts.pauseSession')}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextExercise}
                    className="p-3 rounded-2xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                    title={t('workouts.nextExercise')}
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={completeSession}
                  className="mt-4 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  {t('workouts.finishWorkout')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Routine Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 my-8">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                {t('workouts.aiModalTitle')}
              </h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              {t('workouts.aiModalDesc')}
            </p>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('workouts.targetMinutes')} ({aiTargetMinutes} min)
                </label>
                <div className="flex items-center gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setAiTargetMinutes(mins)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        aiTargetMinutes === mins
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('workouts.focusArea')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'fullBody', label: t('workouts.focusOptions.fullBody') },
                    { id: 'mobility', label: t('workouts.focusOptions.mobility') },
                    { id: 'upperBody', label: t('workouts.focusOptions.upperBody') },
                    { id: 'lowerBody', label: t('workouts.focusOptions.lowerBody') },
                    { id: 'core', label: t('workouts.focusOptions.core') },
                    { id: 'gentle', label: t('workouts.focusOptions.gentle') },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAiFocusArea(f.id)}
                      className={`p-2.5 rounded-xl text-xs text-left font-medium border transition cursor-pointer ${
                        aiFocusArea === f.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error notice if any */}
            {aiError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {aiError}
              </div>
            )}

            {/* Generated routine result */}
            {aiGeneratedRoutine && (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-950">
                    {aiGeneratedRoutine.title}
                  </h4>
                  <span className="text-xs font-semibold text-emerald-800">
                    {aiGeneratedRoutine.estimatedMinutes} min
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {aiGeneratedRoutine.description}
                </p>

                {aiGeneratedRoutine.exercises && (
                  <div className="space-y-1.5 pt-2 border-t border-emerald-200/60">
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      {t('workouts.exercisesCount')}:
                    </div>
                    {aiGeneratedRoutine.exercises.map((ex: any, i: number) => (
                      <div key={i} className="text-xs text-stone-800 flex items-center justify-between">
                        <span>• {ex.name}</span>
                        <span className="text-[11px] text-stone-500">{ex.durationSeconds}s</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2">
              {!aiGeneratedRoutine ? (
                <button
                  onClick={handleGenerateAiRoutine}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isGenerating ? t('workouts.generating') : t('workouts.generateBtn')}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleSaveAiRoutine}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
                >
                  {t('workouts.acceptAndSave')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
