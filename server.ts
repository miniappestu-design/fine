import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSKEY = process.env.ADMIN_SECRET_PASSKEY || 'fitencasa-admin';

// Initialize GoogleGenAI server-side with User-Agent header as required
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

const app = express();
app.use(express.json({ limit: '5mb' }));

// Ensure server data directory exists
const DATA_DIR = path.join(__dirname, 'data_store');
const STORE_FILE = path.join(DATA_DIR, 'server-store.json');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readServerStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading server store:', err);
  }
  return {
    users: {},
    customExercises: [],
    customRecipes: [],
    customRoutines: [],
    syncLogs: [],
  };
}

function writeServerStore(data: any) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing server store:', err);
    return false;
  }
}

// ------------------------------------------------------------
// API Endpoints
// ------------------------------------------------------------

// Health & System Info
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Fit en Casa',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiInitialized: !!ai,
    environment: isProd ? 'production' : 'development',
    time: new Date().toISOString(),
  });
});

// Server-side Store Sync
app.get('/api/data/store', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const store = readServerStore();
  const userData = store.users[userId] || null;
  res.json({
    success: true,
    userData,
    customExercises: store.customExercises || [],
    customRecipes: store.customRecipes || [],
    customRoutines: store.customRoutines || [],
  });
});

app.post('/api/data/store', (req: Request, res: Response) => {
  const { userId, payload } = req.body;
  if (!userId || !payload) {
    return res.status(400).json({ error: 'Missing userId or payload' });
  }
  const store = readServerStore();
  store.users[userId] = {
    ...payload,
    lastSyncedAt: new Date().toISOString(),
  };
  writeServerStore(store);
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Admin Passkey Verification & Stats
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const { passkey } = req.body;
  if (passkey && passkey === ADMIN_PASSKEY) {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid passkey' });
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${ADMIN_PASSKEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const store = readServerStore();
  const userCount = Object.keys(store.users).length;
  res.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    userCount,
    customExercisesCount: (store.customExercises || []).length,
    customRecipesCount: (store.customRecipes || []).length,
    customRoutinesCount: (store.customRoutines || []).length,
    nodeVersion: process.version,
  });
});

// ------------------------------------------------------------
// Gemini AI Endpoints
// ------------------------------------------------------------

// 1. General Assistant Chat
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, userProfile, language = 'es' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    if (!process.env.GEMINI_API_KEY || !ai) {
      return res.status(503).json({
        error: 'gemini_not_configured',
        message: 'La clave de Gemini no está configurada actualmente en el servidor.',
      });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.content || '';

    const systemInstruction = `
Eres "Fit en Casa AI", el asistente inteligente y empático de la aplicación de bienestar "Fit en Casa".
Tu propósito es ayudar a las personas a organizar su día, realizar ejercicio adaptado a su nivel y circunstancias, encontrar comidas sencillas y equilibradas, y consolidar hábitos saludables con constancia y tranquilidad.

IDIOMA OBLIGATORIO: Debes responder estricta y fluidamente en el idioma seleccionado por el usuario: "${language}".

REGLAS DE CONDUCTA Y SEGURIDAD VITALES:
1. Sé motivador, claro, conciso, amable y realista. Nunca utilices mensajes de culpa ni exijas conductas extremas.
2. NO realices diagnósticos médicos ni prometas resultados físicos milagrosos. Si el usuario refiere dolor o síntomas preocupantes, aconseja parar y consultar a un profesional.
3. Si el usuario pide una rutina o comida, puedes proponerla de forma estructurada y práctica, adaptada a su tiempo disponible y equipamiento.
4. Distingue siempre entre una sugerencia y una acción guardada en la aplicación.

PERFIL DEL USUARIO:
- Nombre: ${userProfile?.displayName || 'Usuario'}
- Nivel de experiencia: ${userProfile?.experienceLevel || 'Principiante'}
- Tiempo disponible diario: ${userProfile?.availableTime || 20} minutos
- Equipamiento: ${(userProfile?.equipment || ['Sin material']).join(', ')}
- Preferencias dietéticas: ${(userProfile?.dietaryPreferences || ['Equilibrado']).join(', ')}
- Ingredientes a evitar / Alergias declaradas: ${(userProfile?.excludedIngredients || []).join(', ') || 'Ninguno'}
- Objetivos: ${(userProfile?.goals || ['Crear hábitos saludables']).join(', ')}
    `.trim();

    // Call gemini-3.8-flash with fallback to gemini-3.1-flash-lite if temporary 503 spike
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (primaryErr: any) {
      const errStr = String(primaryErr?.message || primaryErr || '');
      if (errStr.includes('503') || errStr.includes('high demand') || primaryErr?.status === 503) {
        console.warn('Gemini primary model high demand, trying gemini-3.1-flash-lite fallback...');
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
      } else {
        throw primaryErr;
      }
    }

    const replyText = response?.text || '';
    return res.json({
      success: true,
      text: replyText,
    });
  } catch (err: any) {
    console.error('Error calling Gemini chat:', err);
    const errStr = String(err?.message || err || '');
    if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
      const friendlyFallbacks: Record<string, string> = {
        es: 'El servicio de IA está experimentando una alta demanda temporal. Para tu sesión de hoy, te sugiero explorar la rutina "Despertar y Movilidad" en el módulo de Entrenamiento o realizar estiramientos suaves de cuello y espalda.',
        'pt-PT': 'O serviço de IA está com uma elevada procura temporária. Para a tua sessão de hoje, sugerimos explorar a rotina "Despertar e Mobilidade" no separador Treino.',
        'pt-BR': 'O serviço de IA está com alta demanda momentânea. Para hoje, recomendamos a rotina "Despertar e Mobilidade" na aba Treino para relaxar os ombros e a coluna.',
        'en-US': 'The AI service is currently experiencing high temporary demand. For your session today, we suggest trying the "Morning Wake-Up & Joint Mobility" routine in the Workouts tab.',
        'en-GB': 'The AI service is currently experiencing high temporary demand. For your session today, we suggest trying the "Morning Wake-Up & Joint Mobility" routine in the Workouts tab.',
        fr: 'Le service IA connaît une forte demande temporaire. Pour votre séance du jour, nous vous suggérons la routine "Réveil et Mobilité" dans l’onglet Entraînement.',
        it: 'Il servizio IA sta riscontrando una forte richiesta momentanea. Per la sessione di oggi, ti suggeriamo la routine "Risveglio e Mobilità" nella sezione Allenamento.',
      };
      const language = (req.body?.language as string) || 'es';
      return res.json({
        success: true,
        text: friendlyFallbacks[language] || friendlyFallbacks['es'],
        isFallback: true,
      });
    }

    return res.status(500).json({
      error: 'gemini_api_error',
      message: 'Error al comunicar con el asistente de bienestar.',
    });
  }
});

// 2. Structured Routine Generator
app.post('/api/gemini/generate-routine', async (req: Request, res: Response) => {
  try {
    const { userProfile, targetMinutes = 20, focusArea = 'full_body', language = 'es' } = req.body;

    if (!process.env.GEMINI_API_KEY || !ai) {
      return res.status(503).json({
        error: 'gemini_not_configured',
        message: 'Servicio Gemini no configurado en el servidor.',
      });
    }

    const systemInstruction = `
Genera una rutina de ejercicios adaptada y segura para realizar en casa.
IDIOMA: Responde en "${language}".
Nivel: ${userProfile?.experienceLevel || 'Principiante'}.
Tiempo objetivo: ${targetMinutes} minutos.
Área de enfoque: ${focusArea}.
Equipamiento disponible: ${(userProfile?.equipment || ['Sin material']).join(', ')}.

Proporciona ejercicios seguros, sin impacto lesivo, con instrucciones claras y alternativas de menor esfuerzo.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Crea una rutina personalizada de ${targetMinutes} minutos para hacer en casa.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            level: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  durationSeconds: { type: Type.INTEGER },
                  instructions: { type: Type.STRING },
                  tips: { type: Type.STRING },
                  alternative: { type: Type.STRING },
                },
                required: ['name', 'category', 'durationSeconds', 'instructions'],
              },
            },
            wellnessTip: { type: Type.STRING },
          },
          required: ['title', 'description', 'estimatedMinutes', 'exercises'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, routine: parsed });
  } catch (err: any) {
    console.error('Error generating routine with Gemini:', err);
    return res.status(500).json({
      error: 'routine_generation_failed',
      message: err?.message || 'Failed to generate custom routine',
    });
  }
});

// 3. Structured Recipe Generator
app.post('/api/gemini/generate-recipe', async (req: Request, res: Response) => {
  try {
    const { availableIngredients, mealType = 'lunch', userProfile, language = 'es' } = req.body;

    if (!process.env.GEMINI_API_KEY || !ai) {
      return res.status(503).json({
        error: 'gemini_not_configured',
        message: 'Servicio Gemini no configurado en el servidor.',
      });
    }

    const systemInstruction = `
Genera una receta equilibrada, sencilla y saludable para cocinar en casa.
IDIOMA: Responde en "${language}".
Tipo de comida: ${mealType}.
Ingredientes disponibles del usuario: ${availableIngredients || 'Cualquier ingrediente común saludable'}.
Preferencia dietética: ${(userProfile?.dietaryPreferences || ['Equilibrado']).join(', ')}.
Ingredientes a evitar estrictamente / Alérgenos: ${(userProfile?.excludedIngredients || []).join(', ') || 'Ninguno'}.

NO inventes calorías ni macros no comprobados. Distingue ingredientes y pasos claros.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Propón una receta equilibrada para ${mealType} con estos ingredientes: ${availableIngredients || 'ingredientes cotidianos'}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prepMinutes: { type: Type.INTEGER },
            servings: { type: Type.INTEGER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                },
                required: ['name', 'amount'],
              },
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            allergens: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            substitutions: { type: Type.STRING },
          },
          required: ['title', 'description', 'prepMinutes', 'ingredients', 'instructions'],
        },
      },
    });

    const recipe = JSON.parse(response.text || '{}');
    return res.json({ success: true, recipe });
  } catch (err: any) {
    console.error('Error generating recipe with Gemini:', err);
    return res.status(500).json({
      error: 'recipe_generation_failed',
      message: err?.message || 'Failed to generate custom recipe',
    });
  }
});

// 4. Progress Insights Generator
app.post('/api/gemini/progress-insights', async (req: Request, res: Response) => {
  try {
    const { activityStats, language = 'es' } = req.body;

    if (!process.env.GEMINI_API_KEY || !ai) {
      return res.status(503).json({
        error: 'gemini_not_configured',
        message: 'Servicio Gemini no configurado en el servidor.',
      });
    }

    const systemInstruction = `
Eres un coach de bienestar positivo y comprensivo.
IDIOMA: Responde en "${language}".
Analiza los datos reales de actividad del usuario:
- Entrenamientos completados: ${activityStats?.workoutsCount || 0}
- Hábitos completados esta semana: ${activityStats?.habitsCount || 0}
- Racha de días activos: ${activityStats?.currentStreak || 0} días

Ofrece un resumen positivo y motivador de 2 o 3 párrafos breves. Celebra la constancia sin culpabilizar.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Genera un resumen positivo de mi progreso reciente.',
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return res.json({ success: true, summary: response.text || '' });
  } catch (err: any) {
    console.error('Error generating progress insights:', err);
    return res.status(500).json({
      error: 'insights_failed',
      message: err?.message || 'Failed to generate progress insights',
    });
  }
});

// ------------------------------------------------------------
// Vite Integration (Dev Middleware & Static Serving)
// ------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    // In development, mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built dist directory
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fit en Casa server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
