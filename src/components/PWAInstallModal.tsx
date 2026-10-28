import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { useTranslation } from '../i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-900">{t('pwa.installBannerTitle')}</h3>
            <p className="text-xs text-stone-500">{t('pwa.installBannerDesc')}</p>
          </div>
        </div>

        {isStandalone ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-sm font-medium text-emerald-800">
              ¡Fit en Casa ya está instalada en tu dispositivo!
            </p>
          </div>
        ) : isIOS ? (
          <div className="space-y-3 rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-700">
            <h4 className="font-semibold text-stone-900">{t('pwa.iosTitle')}</h4>
            <div className="flex items-start gap-2.5">
              <Share2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p>{t('pwa.iosStep1')}</p>
            </div>
            <div className="flex items-start gap-2.5">
              <PlusSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p>{t('pwa.iosStep2')}</p>
            </div>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-medium py-3 px-4 shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('pwa.installButton')}</span>
          </button>
        ) : (
          <div className="space-y-2 rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-600">
            <p>
              Para instalar, abre el menú de opciones de tu navegador (tres puntos ⋮ o icono de instalación) y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition"
        >
          {t('pwa.close')}
        </button>
      </div>
    </div>
  );
};
