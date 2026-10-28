import React, { useState } from 'react';
import { Globe, Download, User, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../i18n';
import { SUPPORTED_LOCALES } from '../i18n/translations';
import { SupportedLocale } from '../types';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenInstall: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenAdmin,
  onOpenInstall,
}) => {
  const { locale, setLocale, t, formatDate } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLocaleMeta = SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];
  const todayFormatted = formatDate(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9Z" />
              <path d="M12 7v10" />
              <path d="M8 12h8" />
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-stone-900 leading-none">
              Fit en Casa
            </span>
            <span className="text-[11px] font-medium text-emerald-800 capitalize mt-0.5 truncate max-w-[170px] sm:max-w-xs">
              {todayFormatted}
            </span>
          </div>
        </div>

        {/* Action icons & language selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium transition cursor-pointer"
              title={t('profile.languageLabel')}
            >
              <span className="text-sm leading-none">{currentLocaleMeta.flag}</span>
              <span className="hidden sm:inline text-xs font-semibold uppercase">{currentLocaleMeta.code}</span>
              <Globe className="w-3.5 h-3.5 text-stone-500" />
            </button>

            {/* Language Dropdown */}
            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-stone-200 shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    {t('profile.languageLabel')}
                  </div>
                  {SUPPORTED_LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLocale(l.code as SupportedLocale);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-emerald-50 transition cursor-pointer ${
                        locale === l.code ? 'bg-emerald-50/80 text-emerald-900 font-semibold' : 'text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{l.flag}</span>
                        <span>{l.name}</span>
                      </div>
                      {locale === l.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          <button
            onClick={onOpenInstall}
            className="p-2 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 border border-stone-200 transition cursor-pointer"
            title={t('pwa.installApp')}
            aria-label={t('pwa.installApp')}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-lg text-stone-600 hover:text-amber-700 hover:bg-amber-50 border border-stone-200 transition cursor-pointer"
            title={t('admin.title')}
            aria-label={t('admin.title')}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Profile Button */}
          <button
            onClick={onOpenProfile}
            className="p-2 rounded-lg text-stone-700 hover:text-emerald-800 hover:bg-emerald-50 border border-stone-200 transition cursor-pointer"
            title={t('nav.profile')}
            aria-label={t('nav.profile')}
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
