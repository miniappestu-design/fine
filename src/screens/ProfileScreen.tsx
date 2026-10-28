import React, { useState } from 'react';
import {
  User,
  Globe,
  Bell,
  Check,
  Shield,
  Download,
  Trash2,
  Sliders,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { UserProfile, SupportedLocale } from '../types';
import { storage } from '../services/storage';
import { SUPPORTED_LOCALES } from '../i18n/translations';

interface ProfileScreenProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenAdmin: () => void;
  onReopenOnboarding: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onUpdateProfile,
  onOpenAdmin,
  onReopenOnboarding,
}) => {
  const { t, locale, setLocale } = useTranslation();

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    profile.experienceLevel || 'beginner'
  );
  const [availableTime, setAvailableTime] = useState<number>(profile.availableTime || 20);
  const [excludedInput, setExcludedInput] = useState<string>(
    (profile.excludedIngredients || []).join(', ')
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile.reminderPreferences?.enabled || false
  );
  const [notificationTime, setNotificationTime] = useState(
    profile.reminderPreferences?.time || '09:00'
  );
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            setNotificationsEnabled(true);
            setNotificationMsg(t('profile.notificationSuccess'));
          } else {
            setNotificationMsg(t('profile.notificationPermissionDenied'));
          }
        } catch {
          setNotificationMsg(t('profile.notificationPermissionDenied'));
        }
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const excludedList = excludedInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: UserProfile = {
      ...profile,
      displayName: displayName.trim(),
      experienceLevel,
      availableTime,
      excludedIngredients: excludedList,
      reminderPreferences: {
        enabled: notificationsEnabled,
        time: notificationTime,
      },
      preferredLanguage: locale,
      updatedAt: new Date().toISOString(),
    };

    storage.saveProfile(updated);
    onUpdateProfile(updated);

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          {t('profile.title')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      {showSavedToast && (
        <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md animate-in fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{t('common.saved')}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic Info */}
        <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t('profile.nameLabel')}
          </h2>

          <div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('onboarding.namePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-xs text-stone-900 outline-none"
            />
          </div>

          {/* Level Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              {t('profile.levelLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'beginner', label: 'Principiante' },
                { id: 'intermediate', label: 'Intermedio' },
                { id: 'advanced', label: 'Avanzado' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExperienceLevel(lvl.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                    experienceLevel === lvl.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available time */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              {t('profile.timeLabel')}
            </label>
            <div className="flex gap-2">
              {[10, 15, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setAvailableTime(mins)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    availableTime === mins
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Allergies & exclusions */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {t('profile.allergiesLabel')}
            </label>
            <input
              type="text"
              value={excludedInput}
              onChange={(e) => setExcludedInput(e.target.value)}
              placeholder="Ej: nueces, marisco, lácteos..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 text-xs text-stone-900 outline-none"
            />
          </div>
        </section>

        {/* Language Selection Grid */}
        <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>{t('profile.languageLabel')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code as SupportedLocale)}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                  locale === l.code
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{l.flag}</span>
                  <span>{l.name}</span>
                </div>
                {locale === l.code && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />}
              </button>
            ))}
          </div>
        </section>

        {/* Gentle Notifications */}
        <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Bell className="w-4 h-4 text-emerald-700" />
            <span>{t('profile.notificationsLabel')}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <div className="text-xs font-semibold text-stone-800">
                {t('profile.enableNotifications')}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Recordatorio suave para cuidar de ti sin interrupciones molestas.
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                notificationsEnabled ? 'bg-emerald-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {notificationMsg && (
            <p className="text-[11px] text-stone-600 px-1">{notificationMsg}</p>
          )}

          {notificationsEnabled && (
            <div className="flex items-center gap-3 pt-1">
              <label className="text-xs font-semibold text-stone-700">
                {t('profile.notificationTime')}:
              </label>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-800"
              />
            </div>
          )}
        </section>

        {/* Actions & Submit */}
        <div className="space-y-3">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            {t('profile.saveChanges')}
          </button>

          <button
            type="button"
            onClick={onReopenOnboarding}
            className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 font-medium text-xs transition cursor-pointer"
          >
            Repetir Asistente Inicial de Bienvenida
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 text-amber-800 font-semibold text-xs transition cursor-pointer"
          >
            {t('profile.adminAccessBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
