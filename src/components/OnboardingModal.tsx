import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, Heart, Shield } from 'lucide-react';
import { useTranslation } from '../i18n';
import { UserProfile, SupportedLocale } from '../types';
import { SUPPORTED_LOCALES } from '../i18n/translations';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  onComplete,
}) => {
  const { t, locale, setLocale } = useTranslation();
  const [step, setStep] = useState(0); // 0 = Welcome screen, 1..6 = Wizard steps

  const [displayName, setDisplayName] = useState(initialProfile.displayName || '');
  const [goals, setGoals] = useState<string[]>(initialProfile.goals || []);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    initialProfile.experienceLevel || 'beginner'
  );
  const [availableTime, setAvailableTime] = useState<number>(initialProfile.availableTime || 20);
  const [equipment, setEquipment] = useState<string[]>(initialProfile.equipment || ['Sin material']);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    initialProfile.dietaryPreferences || ['Equilibrada general']
  );
  const [excludedIngredients, setExcludedIngredients] = useState<string>(
    (initialProfile.excludedIngredients || []).join(', ')
  );

  if (!isOpen) return null;

  const toggleArrayItem = (list: string[], item: string): string[] => {
    if (list.includes(item)) {
      const next = list.filter((i) => i !== item);
      return next.length > 0 ? next : [item]; // keep at least one
    } else {
      return [...list, item];
    }
  };

  const handleFinish = () => {
    const exclusionsArray = excludedIngredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProfile: UserProfile = {
      ...initialProfile,
      displayName: displayName.trim(),
      goals: goals.length ? goals : ['Crear hábitos saludables'],
      experienceLevel,
      availableTime,
      equipment,
      dietaryPreferences,
      excludedIngredients: exclusionsArray,
      preferredLanguage: locale,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    onComplete(updatedProfile);
  };

  const goalOptions = [
    { key: 'healthyHabits', label: t('onboarding.goals.healthyHabits') },
    { key: 'moveMore', label: t('onboarding.goals.moveMore') },
    { key: 'improveFitness', label: t('onboarding.goals.improveFitness') },
    { key: 'buildStrength', label: t('onboarding.goals.buildStrength') },
    { key: 'organizeMeals', label: t('onboarding.goals.organizeMeals') },
    { key: 'improveConsistency', label: t('onboarding.goals.improveConsistency') },
  ];

  const levelOptions = [
    { id: 'beginner', label: t('onboarding.levels.beginner'), desc: '10-20 min • Ejercicios suaves y seguros' },
    { id: 'intermediate', label: t('onboarding.levels.intermediate'), desc: '20-30 min • Mayor variedad de movimientos' },
    { id: 'advanced', label: t('onboarding.levels.advanced'), desc: '30+ min • Retos progresivos de fuerza' },
  ];

  const timeOptions = [
    { minutes: 15, label: t('onboarding.times.short') },
    { minutes: 25, label: t('onboarding.times.medium') },
    { minutes: 40, label: t('onboarding.times.long') },
  ];

  const equipmentOptions = [
    { id: 'noEquipment', label: t('onboarding.equipments.noEquipment') },
    { id: 'mat', label: t('onboarding.equipments.mat') },
    { id: 'dumbbells', label: t('onboarding.equipments.dumbbells') },
    { id: 'resistanceBands', label: t('onboarding.equipments.resistanceBands') },
  ];

  const dietOptions = [
    { id: 'balanced', label: t('onboarding.diets.balanced') },
    { id: 'mediterranean', label: t('onboarding.diets.mediterranean') },
    { id: 'vegetarian', label: t('onboarding.diets.vegetarian') },
    { id: 'vegan', label: t('onboarding.diets.vegan') },
    { id: 'glutenFree', label: t('onboarding.diets.glutenFree') },
    { id: 'dairyFree', label: t('onboarding.diets.dairyFree') },
  ];

  const totalSteps = 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Step 0: Warm Welcome Screen */}
        {step === 0 ? (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg mb-5">
              <Heart className="w-9 h-9 fill-white/20" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5" />
              Fit en Casa
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t('onboarding.welcomeTitle')}
            </h2>
            <p className="mt-3 text-sm text-stone-600 max-w-md leading-relaxed">
              {t('onboarding.welcomeSubtitle')}
            </p>

            {/* Quick Language choice */}
            <div className="mt-6 w-full max-w-xs">
              <label className="block text-xs font-semibold text-stone-500 mb-2">
                {t('profile.languageLabel')}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SUPPORTED_LOCALES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLocale(l.code as SupportedLocale)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                      locale === l.code
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span className="truncate">{l.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 w-full flex flex-col gap-2">
              <button
                onClick={() => setStep(1)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('onboarding.startBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('profile.privacyNote')}</span>
            </div>
          </div>
        ) : (
          /* Step Wizard Container */
          <div className="p-6 sm:p-8">
            {/* Progress Header */}
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span className="font-semibold text-emerald-800">
                {t('onboarding.step')} {step} {t('onboarding.of')} {totalSteps}
              </span>
              <button
                onClick={handleFinish}
                className="text-stone-400 hover:text-stone-700 hover:underline cursor-pointer"
              >
                {t('common.skip')}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-stone-100 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>

            {/* Step 1: Name */}
            {step === 1 && (
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t('onboarding.nameTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('onboarding.nameSubtitle')}</p>
                <div className="mt-5">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('onboarding.namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-stone-900 outline-none text-sm transition"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t('onboarding.goalTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('onboarding.goalSubtitle')}</p>
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {goalOptions.map((g) => {
                    const isSelected = goals.includes(g.label);
                    return (
                      <button
                        key={g.key}
                        onClick={() => setGoals(toggleArrayItem(goals, g.label))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span>{g.label}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Experience Level */}
            {step === 3 && (
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t('onboarding.levelTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('onboarding.levelSubtitle')}</p>
                <div className="mt-4 space-y-2.5">
                  {levelOptions.map((lvl) => {
                    const isSelected = experienceLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => setExperienceLevel(lvl.id as any)}
                        className={`w-full flex flex-col p-3.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span className="text-sm font-semibold">{lvl.label}</span>
                        <span className="text-xs text-stone-500 mt-0.5">{lvl.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Available Time */}
            {step === 4 && (
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t('onboarding.timeTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('onboarding.timeSubtitle')}</p>
                <div className="mt-4 space-y-2.5">
                  {timeOptions.map((timeOpt) => {
                    const isSelected = availableTime === timeOpt.minutes;
                    return (
                      <button
                        key={timeOpt.minutes}
                        onClick={() => setAvailableTime(timeOpt.minutes)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span className="text-sm">{timeOpt.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono">
                          {timeOpt.minutes} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Equipment */}
            {step === 5 && (
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t('onboarding.equipmentTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('onboarding.equipmentSubtitle')}</p>
                <div className="mt-4 space-y-2">
                  {equipmentOptions.map((eq) => {
                    const isSelected = equipment.includes(eq.label);
                    return (
                      <button
                        key={eq.id}
                        onClick={() => setEquipment(toggleArrayItem(equipment, eq.label))}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span>{eq.label}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Diet & Excluded Ingredients */}
            {step === 6 && (
              <div>
                <h3 className="text-xl font-bold text-stone-900">{t('onboarding.dietTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('onboarding.dietSubtitle')}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {dietOptions.map((diet) => {
                    const isSelected = dietaryPreferences.includes(diet.label);
                    return (
                      <button
                        key={diet.id}
                        onClick={() =>
                          setDietaryPreferences(toggleArrayItem(dietaryPreferences, diet.label))
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        {diet.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    {t('onboarding.allergiesTitle')}
                  </label>
                  <input
                    type="text"
                    value={excludedIngredients}
                    onChange={(e) => setExcludedIngredients(e.target.value)}
                    placeholder={t('onboarding.allergiesPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 text-xs text-stone-900 outline-none"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    {t('onboarding.allergiesSubtitle')}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => setStep(step - 1)}
                className="py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('common.back')}</span>
              </button>

              {step < totalSteps ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <span>{t('common.next')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('onboarding.finishBtn')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
