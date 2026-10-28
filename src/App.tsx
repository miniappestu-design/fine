import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './i18n';
import { NavTab, UserProfile, Routine, Recipe } from './types';
import { storage } from './services/storage';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { OnboardingModal } from './components/OnboardingModal';
import { PWAInstallModal } from './components/PWAInstallModal';

import { HomeScreen } from './screens/HomeScreen';
import { WorkoutsScreen } from './screens/WorkoutsScreen';
import { NutritionScreen } from './screens/NutritionScreen';
import { AssistantScreen } from './screens/AssistantScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';

const MainApp: React.FC = () => {
  const { setLocale } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>(() => storage.getProfile());
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Secondary views / Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => !storage.getProfile().onboardingCompleted
  );

  // Cross-screen navigation targets
  const [selectedRoutineToStart, setSelectedRoutineToStart] = useState<Routine | null>(null);
  const [selectedRecipeToView, setSelectedRecipeToView] = useState<Recipe | null>(null);

  useEffect(() => {
    // Sync preferred language from profile if set
    if (profile.preferredLanguage) {
      setLocale(profile.preferredLanguage);
    }
  }, []);

  const handleStartRoutineFromHome = (routine: Routine) => {
    setSelectedRoutineToStart(routine);
    setActiveTab('workouts');
    setIsProfileOpen(false);
    setIsAdminOpen(false);
  };

  const handleViewRecipeFromHome = (recipe: Recipe) => {
    setSelectedRecipeToView(recipe);
    setActiveTab('nutrition');
    setIsProfileOpen(false);
    setIsAdminOpen(false);
  };

  const handleCompleteOnboarding = (updatedProfile: UserProfile) => {
    storage.saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsOnboardingOpen(false);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-950 flex flex-col">
      <OfflineBanner />

      {/* Persistent Top Header */}
      <Header
        activeTab={activeTab}
        onOpenProfile={() => {
          setIsAdminOpen(false);
          setIsProfileOpen(true);
        }}
        onOpenAdmin={() => {
          setIsProfileOpen(false);
          setIsAdminOpen(true);
        }}
        onOpenInstall={() => setIsInstallOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-5 pb-6">
        {isAdminOpen ? (
          <AdminScreen onClose={() => setIsAdminOpen(false)} />
        ) : isProfileOpen ? (
          <ProfileScreen
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onOpenAdmin={() => {
              setIsProfileOpen(false);
              setIsAdminOpen(true);
            }}
            onReopenOnboarding={() => {
              setIsProfileOpen(false);
              setIsOnboardingOpen(true);
            }}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                profile={profile}
                onChangeTab={(tab) => {
                  setIsProfileOpen(false);
                  setIsAdminOpen(false);
                  setActiveTab(tab);
                }}
                onStartRoutine={handleStartRoutineFromHome}
                onViewRecipe={handleViewRecipeFromHome}
              />
            )}

            {activeTab === 'workouts' && (
              <WorkoutsScreen
                profile={profile}
                initialSelectedRoutine={selectedRoutineToStart}
                onClearInitialRoutine={() => setSelectedRoutineToStart(null)}
              />
            )}

            {activeTab === 'nutrition' && (
              <NutritionScreen
                profile={profile}
                initialSelectedRecipe={selectedRecipeToView}
                onClearInitialRecipe={() => setSelectedRecipeToView(null)}
              />
            )}

            {activeTab === 'assistant' && (
              <AssistantScreen profile={profile} />
            )}

            {activeTab === 'progress' && (
              <ProgressScreen profile={profile} />
            )}
          </>
        )}
      </main>

      {/* Persistent Bottom Bar (always visible on all screens per prompt requirements) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setIsProfileOpen(false);
          setIsAdminOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Onboarding Setup Wizard */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        initialProfile={profile}
        onComplete={handleCompleteOnboarding}
      />

      {/* PWA Guided Installation Modal */}
      <PWAInstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

export default App;
