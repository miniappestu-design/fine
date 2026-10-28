import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Server,
  Sparkles,
  Database,
  Plus,
  Check,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Layers,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { Exercise, Recipe } from '../types';
import { storage } from '../services/storage';

interface AdminScreenProps {
  onClose: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onClose }) => {
  const { t, locale } = useTranslation();

  const [passkeyInput, setPasskeyInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // System stats from server
  const [serverStats, setServerStats] = useState<any>(null);

  // Creation form tabs
  const [adminTab, setAdminTab] = useState<'health' | 'addExercise' | 'addRecipe'>('health');

  // New Exercise Form
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<'mobility' | 'full_body' | 'upper_body' | 'lower_body'>('mobility');
  const [newExDuration, setNewExDuration] = useState(45);
  const [newExInstructions, setNewExInstructions] = useState('');
  const [newExTip, setNewExTip] = useState('');
  const [exSuccessToast, setExSuccessToast] = useState(false);

  // New Recipe Form
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecMealType, setNewRecMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [newRecPrep, setNewRecPrep] = useState(15);
  const [newRecIngredients, setNewRecIngredients] = useState('');
  const [newRecInstructions, setNewRecInstructions] = useState('');
  const [recSuccessToast, setRecSuccessToast] = useState(false);

  const handleVerifyPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.authorized) {
        setIsAuthorized(true);
        loadServerStats(passkeyInput);
      } else {
        setErrorMsg(t('admin.invalidKey'));
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Error de conexión con el servidor.');
    }
  };

  const loadServerStats = async (key: string) => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        const stats = await res.json();
        setServerStats(stats);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newEx: Exercise = {
      id: `custom-ex-${Date.now()}`,
      category: newExCategory as any,
      difficulty: 'beginner',
      equipment: 'Sin material',
      durationSeconds: Number(newExDuration) || 45,
      isCustom: true,
      name: {
        es: newExName,
        'pt-PT': newExName,
        'pt-BR': newExName,
        'en-US': newExName,
        'en-GB': newExName,
        fr: newExName,
        it: newExName,
      },
      instructions: {
        es: newExInstructions ? newExInstructions.split('\n').filter(Boolean) : ['Realizar con calma y respiración constante.'],
        'pt-PT': [newExName],
        'pt-BR': [newExName],
        'en-US': [newExName],
        'en-GB': [newExName],
        fr: [newExName],
        it: [newExName],
      },
      tips: {
        es: newExTip || 'Mantén el control del movimiento.',
        'pt-PT': newExTip || 'Mantém o controlo do movimento.',
        'pt-BR': newExTip || 'Mantenha o controle do movimento.',
        'en-US': newExTip || 'Maintain full body control.',
        'en-GB': newExTip || 'Maintain full body control.',
        fr: newExTip || 'Gardez le contrôle du geste.',
        it: newExTip || 'Mantieni il controllo del movimento.',
      },
      alternatives: {
        es: 'Realizar con menor rango de movimiento.',
        'pt-PT': 'Realizar com menor amplitude.',
        'pt-BR': 'Faça com menor amplitude.',
        'en-US': 'Perform with a smaller range of motion.',
        'en-GB': 'Perform with a smaller range of motion.',
        fr: 'Réduisez l’amplitude en cas de besoin.',
        it: 'Riduci l’ampiezza se necessario.',
      },
      precautions: {
        es: 'Detén el ejercicio si sientes dolor.',
        'pt-PT': 'Para se sentires dor.',
        'pt-BR': 'Interrompa caso sinta dor.',
        'en-US': 'Stop immediately if feeling pain.',
        'en-GB': 'Stop immediately if feeling pain.',
        fr: 'Arrêtez en cas de douleur.',
        it: 'Fermati in caso di dolore.',
      },
    };

    storage.addCustomExercise(newEx);
    setExSuccessToast(true);
    setTimeout(() => setExSuccessToast(false), 2500);
    setNewExName('');
    setNewExInstructions('');
    setNewExTip('');
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecTitle.trim()) return;

    const ingredientsList = newRecIngredients
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(':');
        const nameStr = parts[0]?.trim() || line;
        const amountStr = parts[1]?.trim() || 'Al gusto';
        return {
          name: {
            es: nameStr,
            'pt-PT': nameStr,
            'pt-BR': nameStr,
            'en-US': nameStr,
            'en-GB': nameStr,
            fr: nameStr,
            it: nameStr,
          },
          amount: amountStr,
        };
      });

    const newRec: Recipe = {
      id: `custom-rec-${Date.now()}`,
      mealType: newRecMealType,
      prepMinutes: Number(newRecPrep) || 15,
      servings: 2,
      allergens: [],
      tags: ['personalizada'],
      isCustom: true,
      title: {
        es: newRecTitle,
        'pt-PT': newRecTitle,
        'pt-BR': newRecTitle,
        'en-US': newRecTitle,
        'en-GB': newRecTitle,
        fr: newRecTitle,
        it: newRecTitle,
      },
      description: {
        es: 'Receta casera añadida al catálogo.',
        'pt-PT': 'Receita adicionada ao catálogo.',
        'pt-BR': 'Receita adicionada ao catálogo.',
        'en-US': 'Custom recipe added to library.',
        'en-GB': 'Custom recipe added to library.',
        fr: 'Recette personnalisée ajoutée au catalogue.',
        it: 'Ricetta personalizzata aggiunta al catalogo.',
      },
      ingredients: ingredientsList.length > 0 ? ingredientsList : [
        {
          name: {
            es: 'Ingrediente principal',
            'pt-PT': 'Ingrediente principal',
            'pt-BR': 'Ingrediente principal',
            'en-US': 'Main ingredient',
            'en-GB': 'Main ingredient',
            fr: 'Ingrédient principal',
            it: 'Ingrediente principale',
          },
          amount: '1 porción',
        },
      ],
      instructions: {
        es: newRecInstructions ? newRecInstructions.split('\n').filter(Boolean) : ['Cocinar y servir.'],
        'pt-PT': [newRecTitle],
        'pt-BR': [newRecTitle],
        'en-US': [newRecTitle],
        'en-GB': [newRecTitle],
        fr: [newRecTitle],
        it: [newRecTitle],
      },
    };

    storage.addCustomRecipe(newRec);
    setRecSuccessToast(true);
    setTimeout(() => setRecSuccessToast(false), 2500);
    setNewRecTitle('');
    setNewRecIngredients('');
    setNewRecInstructions('');
  };

  const allExercises = storage.getExercises();
  const allRecipes = storage.getRecipes();
  const allRoutines = storage.getRoutines();

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('admin.exitAdmin')}</span>
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-700" />
          <span className="text-sm font-bold text-stone-900">{t('admin.title')}</span>
        </div>
      </div>

      {!isAuthorized ? (
        /* Protected Passkey Gate */
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-stone-200 shadow-lg text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-stone-900">
            {t('admin.passkeyTitle')}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {t('admin.passkeySubtitle')}
          </p>

          <form onSubmit={handleVerifyPasskey} className="mt-6 space-y-3">
            <input
              type="password"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder={t('admin.passkeyPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 text-sm text-stone-900 outline-none text-center tracking-widest"
              autoFocus
            />

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !passkeyInput}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? t('common.loading') : t('admin.submitBtn')}
            </button>
          </form>

          <div className="mt-4 text-[11px] text-stone-400">
            Clave predeterminada de entorno: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-mono">fitencasa-admin</code>
          </div>
        </div>
      ) : (
        /* Authorized Dashboard */
        <div className="space-y-6">
          {/* Navigation Sub-Tabs */}
          <div className="flex gap-2 p-1 rounded-2xl bg-stone-100 border border-stone-200 overflow-x-auto">
            <button
              onClick={() => setAdminTab('health')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                adminTab === 'health'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t('admin.systemStatus')}
            </button>

            <button
              onClick={() => setAdminTab('addExercise')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                adminTab === 'addExercise'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t('admin.createNewExercise')}
            </button>

            <button
              onClick={() => setAdminTab('addRecipe')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                adminTab === 'addRecipe'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t('admin.createNewRecipe')}
            </button>
          </div>

          {/* TAB 1: SYSTEM HEALTH & STATS */}
          {adminTab === 'health' && (
            <div className="space-y-4">
              <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t('admin.systemStatus')}
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span className="font-semibold text-stone-800">{t('admin.geminiKeyStatus')}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      {serverStats?.hasGeminiKey ? t('admin.keyConfigured') : 'gemini-3.8-flash listo'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-emerald-700" />
                      <span className="font-semibold text-stone-800">{t('admin.databaseMode')}</span>
                    </div>
                    <span className="text-[11px] text-stone-600 font-mono">
                      LocalStorage + Server JSON Sync
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-emerald-700" />
                      <span className="font-semibold text-stone-800">Servidor Node / Express</span>
                    </div>
                    <span className="text-[11px] text-stone-600 font-mono">
                      {serverStats?.nodeVersion || 'v22+ (Fullstack)'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Catalog Overview Metrics */}
              <section className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  {t('admin.statsOverview')}
                </h3>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="text-xl font-bold text-stone-900">{allExercises.length}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{t('admin.exercisesCount')}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="text-xl font-bold text-stone-900">{allRecipes.length}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{t('admin.recipesCount')}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="text-xl font-bold text-stone-900">{allRoutines.length}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{t('admin.routinesCount')}</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: ADD EXERCISE */}
          {adminTab === 'addExercise' && (
            <form onSubmit={handleCreateExercise} className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900">
                {t('admin.createNewExercise')}
              </h3>

              {exSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Ejercicio añadido al catálogo con éxito.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre del ejercicio:
                </label>
                <input
                  type="text"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  placeholder="Ej: Elevación Lateral de Brazos"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t('admin.categoryLabel')}:
                  </label>
                  <select
                    value={newExCategory}
                    onChange={(e) => setNewExCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none bg-white"
                  >
                    <option value="mobility">Movilidad</option>
                    <option value="full_body">Cuerpo completo</option>
                    <option value="upper_body">Tren superior</option>
                    <option value="lower_body">Tren inferior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Duración (segundos):
                  </label>
                  <input
                    type="number"
                    value={newExDuration}
                    onChange={(e) => setNewExDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Instrucciones (una por línea):
                </label>
                <textarea
                  rows={3}
                  value={newExInstructions}
                  onChange={(e) => setNewExInstructions(e.target.value)}
                  placeholder="Paso 1...&#10;Paso 2..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Consejo de técnica:
                </label>
                <input
                  type="text"
                  value={newExTip}
                  onChange={(e) => setNewExTip(e.target.value)}
                  placeholder="Mantén la respiración natural..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                {t('admin.saveToCatalog')}
              </button>
            </form>
          )}

          {/* TAB 3: ADD RECIPE */}
          {adminTab === 'addRecipe' && (
            <form onSubmit={handleCreateRecipe} className="rounded-3xl bg-white p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900">
                {t('admin.createNewRecipe')}
              </h3>

              {recSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Receta añadida al catálogo con éxito.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título de la receta:
                </label>
                <input
                  type="text"
                  value={newRecTitle}
                  onChange={(e) => setNewRecTitle(e.target.value)}
                  placeholder="Ej: Ensalada Tibia de Lentejas"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tipo de comida:
                  </label>
                  <select
                    value={newRecMealType}
                    onChange={(e) => setNewRecMealType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none bg-white"
                  >
                    <option value="breakfast">Desayuno</option>
                    <option value="lunch">Almuerzo</option>
                    <option value="dinner">Cena</option>
                    <option value="snack">Merienda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tiempo de preparación (minutos):
                  </label>
                  <input
                    type="number"
                    value={newRecPrep}
                    onChange={(e) => setNewRecPrep(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Ingredientes (Nombre: Cantidad por línea):
                </label>
                <textarea
                  rows={3}
                  value={newRecIngredients}
                  onChange={(e) => setNewRecIngredients(e.target.value)}
                  placeholder="Lentejas cocidas: 200g&#10;Tomates cherry: 6 unidades"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Instrucciones (una por línea):
                </label>
                <textarea
                  rows={3}
                  value={newRecInstructions}
                  onChange={(e) => setNewRecInstructions(e.target.value)}
                  placeholder="Mezclar todos los ingredientes..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition cursor-pointer"
              >
                {t('admin.saveToCatalog')}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
