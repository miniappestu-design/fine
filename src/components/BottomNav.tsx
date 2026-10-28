import React from 'react';
import { Home, Dumbbell, Utensils, Sparkles, TrendingUp } from 'lucide-react';
import { NavTab } from '../types';
import { useTranslation } from '../i18n';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { t } = useTranslation();

  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'workouts', label: t('nav.workouts'), icon: Dumbbell },
    { id: 'nutrition', label: t('nav.nutrition'), icon: Utensils },
    { id: 'assistant', label: t('nav.assistant'), icon: Sparkles },
    { id: 'progress', label: t('nav.progress'), icon: TrendingUp },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg safe-bottom"
    >
      <div className="max-w-md sm:max-w-xl mx-auto px-2 sm:px-6 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-16 py-1 transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-semibold scale-105'
                  : 'text-stone-500 hover:text-stone-800 font-normal'
              }`}
            >
              {/* Active pill dot indicator */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-emerald-700 animate-in fade-in zoom-in duration-150" />
              )}
              <div
                className={`p-1 rounded-xl transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : ''
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10.5px] tracking-tight leading-tight mt-0.5 truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
