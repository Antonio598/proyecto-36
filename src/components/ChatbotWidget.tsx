'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, ChevronDown, Stethoscope } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // hook de Vercel AI SDK (maneja estao de API de forma agnóstica)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! Soy el asistente virtual de la clínica. 🏥 ¿Te ayudo a agendar una cita o tienes alguna duda sobre nuestros servicios?'
      }
    ]
  });

  // Auto-scroll al final del chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300',
          isOpen ? 'bg-red-500 hover:bg-red-600 scale-90' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-110 shadow-blue-500/50 hover:shadow-blue-500/80 animate-bounce cursor-pointer'
        ].join(' ')}
      >
        {isOpen ? <X className="w-7 h-7 text-white" /> : <Bot className="w-8 h-8 text-white" />}
      </button>

      {/* Ventana de Chat */}
      <div 
        className={[
          'fixed bottom-24 right-6 z-50 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-3xl transition-all duration-300 origin-bottom-right',
          isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'
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
                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                 En línea
               </p>
             </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Zona de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50/50">
          {messages.map((m) => (
            <div key={m.id} className={['flex', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
              <div
                className={['flex gap-2 max-w-[85%]', m.role === 'user' ? 'flex-row-reverse' : 'flex-row'].join(' ')}
              >
                {/* Avatar */}
                <div className={[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
                  m.role === 'user' ? 'bg-indigo-100 border border-indigo-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400'
                ].join(' ')}>
                  {m.role === 'user' ? (
                    <User className="w-4 h-4 text-indigo-700" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                {/* Burbuja */}
                <div
                  className={[
                    'px-4 py-2.5 rounded-2xl text-[0.9rem] leading-relaxed shadow-sm',
                    m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  ].join(' ')}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {/* Manejo de llamadas de herramientas vacías o de carga intermedia */}
                  {m.content.length > 0 ? (
                    m.content
                  ) : m.toolInvocations && m.toolInvocations.length > 0 ? (
                    <div className="italic text-gray-400 text-xs flex items-center gap-2">
                       <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                       Consultando base de datos...
                    </div>
                  ) : (
                    <span className="text-gray-300">...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Indicador de "Escribiendo..." */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
               <div className="flex gap-2 items-center bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm max-w-[85%]">
                 <div className="flex gap-1">
                   <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                   <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulario / Input */}
        <div className="p-3 bg-white border-t border-gray-100 rounded-b-2xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all"
          >
            <input
              className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:outline-none placeholder-gray-400"
              value={input}
              placeholder="Escribe tu mensaje aquí..."
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-center text-gray-400 mt-2">
            Desarrollado con Gemini Pro
          </div>
        </div>
      </div>
    </>
  );
}
