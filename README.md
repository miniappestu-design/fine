# Fit en Casa — Aplicación Premium de Bienestar

> **«Pequeños hábitos. Una vida más saludable»**  
> Aplicación interactiva de ejercicio adaptado en casa, alimentación equilibrada, seguimiento de hábitos e inteligencia artificial con Gemini.

---

## 1. Visión y Propósito

**Fit en Casa** es un compañero digital que responde a la pregunta cotidiana:
*«¿Qué puedo hacer hoy para cuidarme mejor, teniendo en cuenta mi tiempo, mis preferencias y mi nivel de experiencia?»*

La aplicación promueve un progreso sostenible, seguro y sin presiones extremas, con enfoque preventivo y motivador.

---

## 2. Características Principales

1. **Navegación Fija Inferior (5 Secciones Centrales)**:
   - **Inicio**: Saludo personalizado, resumen de metas, propuesta equilibrada del día (movimiento, nutrición, hábito, descanso) y acciones rápidas.
   - **Entrenamiento**: Catálogo estructurado de ejercicios con instrucciones, alternativas de menor impacto y precauciones. Reproductor de rutinas con temporizador activo, avisos sonoros (Web Audio API) y registro real de sesiones. Generador de rutinas con Gemini AI.
   - **Alimentación**: Catálogo de recetas balanceadas con ingredientes, tiempos, pasos y alérgenos conocidos. Planificador semanal (Lunes a Domingo) y lista de compras consolidada editable. Asistente culinario con Gemini AI.
   - **Asistente IA (Fit en Casa AI)**: Conversación inteligente y empática con Gemini 3.8 Flash en el servidor, adaptada al perfil, objetivos y restricciones del usuario.
   - **Progreso**: Historial real de actividades, racha de días activos, consistencia semanal, resumen motivador con Gemini AI y exportación/reinicio de datos en JSON.

2. **Onboarding y Perfil Personalizado**:
   - Asistente de bienvenida paso a paso: metas, nivel (Principiante, Intermedio, Avanzado), tiempo disponible diario (10 a 40+ min), equipamiento en casa y preferencias alimentarias/alérgenos.
   - Configuración de recordatorios suaves mediante la API de notificaciones del navegador.

3. **Sistema Multilingüe Integral (7 Idiomas)**:
   - 🇪🇸 **Español** (`es` - predeterminado)
   - 🇵🇹 **Português de Portugal** (`pt-PT`)
   - 🇧🇷 **Português do Brasil** (`pt-BR`)
   - 🇺🇸 **English (United States)** (`en-US`)
   - 🇬🇧 **English (United Kingdom)** (`en-GB`)
   - 🇫🇷 **Français** (`fr`)
   - 🇮🇹 **Italiano** (`it`)
   - Selector accesible en la cabecera. Cambio inmediato y sincronizado en toda la interfaz sin recargar.

4. **Panel Administrativo Protegido**:
   - Acceso con clave de seguridad (`ADMIN_SECRET_PASSKEY`).
   - Monitor de salud de servicios (estado de clave Gemini, persistencia, entorno).
   - Métricas de catálogo e ingreso de nuevos ejercicios y recetas.

5. **PWA y Funcionamiento Offline**:
   - Web App Manifest configurado con display standalone e iconos vectoriales de alta fidelidad.
   - Modal guiado para instalación en iOS Safari y disparador automático para Android / Chrome.
   - Detección de conectividad con banner discreto en modo sin conexión.

---

## 3. Arquitectura Técnica

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Backend**: Servidor Express fullstack (`server.ts`) con middlewares de Vite en desarrollo y servicio de estáticos en producción.
- **Inteligencia Artificial**: `@google/genai` (modelo `gemini-3.8-flash`) ejecutado exclusivamente en el servidor con encabezado `User-Agent: aistudio-build`.
- **Persistencia**: Almacenamiento unificado en cliente (`localStorage`) con sincronización asíncrona en el servidor (`data_store/server-store.json`).
- **Seguridad**: No se exponen claves de API al navegador ni datos médicos confidenciales.

---

## 4. Variables de Entorno

Definidas en `.env.example`:
```env
# Clave de API de Gemini (inyectada automáticamente en Google AI Studio)
GEMINI_API_KEY="TU_CLAVE_GEMINI"

# URL pública del applet
APP_URL="https://tu-app.run.app"

# Clave de acceso al panel administrativo (predeterminada: fitencasa-admin)
ADMIN_SECRET_PASSKEY="fitencasa-admin"
```

---

## 5. Instrucciones de Ejecución

### Instalación de dependencias:
```bash
npm install
```

### Ejecución en desarrollo:
```bash
npm run dev
```
Inicia el servidor fullstack Express en `http://localhost:3000`.

### Verificación de tipos y linting:
```bash
npm run lint
```

### Compilación para producción:
```bash
npm run build
```

### Inicio en producción:
```bash
npm start
```
