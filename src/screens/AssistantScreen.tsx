import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  AlertCircle,
  RotateCcw,
  User,
  Bot,
  Shield,
  Lightbulb,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { ChatMessage, UserProfile } from '../types';
import { storage } from '../services/storage';
import { chatWithGemini, checkServerHealth } from '../services/gemini';

interface AssistantScreenProps {
  profile: UserProfile;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({ profile }) => {
  const { t, tObj, locale } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = storage.getChatMessages();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: t('assistant.welcomeMessage'),
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkServerHealth().then((res) => {
      setHasGeminiKey(res.hasGeminiKey);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    storage.saveChatMessages(messages);
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputPrompt).trim();
    if (!content || isThinking) return;

    setInputPrompt('');
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsThinking(true);

    const result = await chatWithGemini({
      messages: updated.map((m) => ({ role: m.role, content: m.content })),
      userProfile: profile,
      language: locale,
    });

    setIsThinking(false);

    if (result.success && result.text) {
      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
      };
      setMessages([...updated, assistantMsg]);
    } else {
      // If error or unconfigured
      if (result.error?.includes('gemini_not_configured')) {
        setHasGeminiKey(false);
      }
      setErrorMessage(result.error || t('common.error'));

      const fallbackMsg: ChatMessage = {
        id: `msg-ai-fallback-${Date.now()}`,
        role: 'assistant',
        content:
          hasGeminiKey === false
            ? `${t('assistant.geminiUnconfigured')}\n\nPara tu día de hoy, te sugiero comenzar con una rutina suave de movilidad ("${
                storage.getRoutines()[0]?.title[locale] || 'Despertar y Movilidad'
              }") y mantener una hidratación pausada.`
            : 'Ha ocurrido un error al procesar tu solicitud con el modelo. Por favor, intenta de nuevo en unos momentos.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...updated, fallbackMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestions: string[] = tObj('assistant.suggestions') || [
    'Organiza mi día de bienestar',
    'Sugiere una rutina rápida de 15 minutos',
    '¿Qué puedo cenar ligero y nutritivo?',
    'Dame un consejo para no perder la constancia',
    'Tengo molestias en los hombros, ¿qué estiramiento hago?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-h-[820px] pb-6 animate-in fade-in duration-200">
      {/* Screen Header */}
      <div className="pb-3 border-b border-stone-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-stone-900 tracking-tight">
                {t('assistant.title')}
              </h1>
              <p className="text-[11px] text-stone-500">
                {t('assistant.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Gemini 3.8 Flash</span>
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-stone-500 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>{t('assistant.disclaimer')}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-stone-800 text-white'
                    : 'bg-emerald-100 text-emerald-800 font-bold'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                  isUser
                    ? 'bg-emerald-700 text-white font-medium rounded-tr-none'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-stone-200 rounded-tl-none text-xs text-stone-500 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>{t('assistant.thinking')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {messages.length <= 2 && (
        <div className="mb-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>{t('assistant.quickSuggestionsTitle')}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {quickSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 text-stone-700 text-[11px] font-medium whitespace-nowrap transition cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="pt-2 border-t border-stone-200 shrink-0">
        <div className="relative flex items-center gap-2 bg-white rounded-2xl border border-stone-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 p-1.5 shadow-2xs">
          <textarea
            rows={1}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('assistant.inputPlaceholder')}
            className="flex-1 px-3 py-1.5 text-xs text-stone-900 outline-none resize-none max-h-24"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isThinking}
            className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition active:scale-95 cursor-pointer shrink-0"
            title={t('assistant.sendBtn')}
            aria-label={t('assistant.sendBtn')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
