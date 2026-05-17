'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, ChevronDown, Stethoscope } from 'lucide-react';
import { useSede } from '@/context/SedeContext';
import { getAccountId } from '@/lib/apiFetch';

type Message = { role: 'user' | 'assistant'; text: string };

const WELCOME: Message = {
  role: 'assistant',
  text: '¡Hola! Soy el asistente virtual de la clínica. ¿Te ayudo a agendar una cita o tienes alguna duda sobre nuestros servicios?',
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { selectedSede } = useSede();
  const accountId = getAccountId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');
    const history: Message[] = [...messages, { role: 'user', text }];
    setMessages(history);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.text })),
          subaccountId: selectedSede,
          accountId,
        }),
      });

      if (!res.ok || !res.body) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Hubo un error. Por favor intenta de nuevo.' }]);
        return;
      }

      // Stream response chunk by chunk
      setMessages(prev => [...prev, { role: 'assistant', text: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', text: full };
          return updated;
        });
      }

      // If the stream ended with no text (model only called tools), show a fallback
      if (!full.trim()) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', text: 'Ocurrió un problema procesando tu solicitud. Por favor intenta de nuevo.' };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'No se pudo conectar con el asistente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300',
          isOpen
            ? 'bg-red-500 hover:bg-red-600 scale-90'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-110 shadow-blue-500/50 animate-bounce cursor-pointer',
        ].join(' ')}
      >
        {isOpen ? <X className="w-7 h-7 text-white" /> : <Bot className="w-8 h-8 text-white" />}
      </button>

      {/* Ventana de Chat */}
      <div
        className={[
          'fixed bottom-24 right-6 z-50 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right',
          isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full border border-white/30">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">Asistente Inteligente</h3>
              <p className="text-blue-100 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                En línea
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((m, i) => (
            <div key={i} className={['flex', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
              <div className={['flex gap-2 max-w-[85%]', m.role === 'user' ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
                <div className={[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
                  m.role === 'user'
                    ? 'bg-indigo-100 border border-indigo-200'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400',
                ].join(' ')}>
                  {m.role === 'user'
                    ? <User className="w-4 h-4 text-indigo-700" />
                    : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div
                  className={[
                    'px-4 py-2.5 rounded-2xl text-[0.9rem] leading-relaxed shadow-sm',
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm',
                  ].join(' ')}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {m.text || (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all"
          >
            <input
              className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:outline-none placeholder-gray-400"
              value={inputValue}
              placeholder="Escribe tu mensaje aquí..."
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex-shrink-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-400 mt-2">Asistente IA · Galenus AI</p>
        </div>
      </div>
    </>
  );
}
