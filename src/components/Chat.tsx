import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, X, Bot, User, Copy, Zap } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: {
    data: string;
    name: string;
    type: string;
  };
}

// Pequeño hook para efecto "typewriter"
const useTypewriter = (
  phrases: string[],
  typingSpeedMs: number = 80,
  pauseMs: number = 1200
) => {
  const [text, setText] = useState('');
  const indexRef = useRef(0);
  const charRef = useRef(0);
  const deletingRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const currentPhrase = phrases[indexRef.current];
      if (!deletingRef.current) {
        charRef.current += 1;
        setText(currentPhrase.slice(0, charRef.current));
        if (charRef.current === currentPhrase.length) {
          deletingRef.current = true;
          return pauseMs;
        }
        return typingSpeedMs;
      } else {
        charRef.current -= 1;
        setText(currentPhrase.slice(0, Math.max(0, charRef.current)));
        if (charRef.current === 0) {
          deletingRef.current = false;
          indexRef.current = (indexRef.current + 1) % phrases.length;
          return typingSpeedMs;
        }
        return Math.max(typingSpeedMs / 2, 30);
      }
    };

    let timeoutId: number;
    const schedule = (delay: number) => {
      timeoutId = window.setTimeout(() => {
        const nextDelay = tick();
        schedule(nextDelay);
      }, delay);
    };
    schedule(typingSpeedMs);
    return () => window.clearTimeout(timeoutId);
  }, [phrases, typingSpeedMs, pauseMs]);

  return text;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    data: string;
    name: string;
    type: string;
    preview: string;
  } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [modalImage, setModalImage] = useState<{ src: string; name: string } | null>(null);

  // Textos para efectos de escritura
  // Títulos estáticos (typewriter solo se usa en el input)
  const typedInput = useTypewriter([
    'Escribe /ayuda para ver comandos…',
    'Pregunta algo como: "Resume este texto"…',
    'Arrastra una imagen y pide: "Mejora la calidad"…'
  ], 60, 1400);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAttachedImage({
        data: result,
        name: file.name,
        type: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // simulate submit
      const form = (e.currentTarget.closest('form')) as HTMLFormElement | null;
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleImageSelect(fakeEvent);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim() || (attachedImage ? 'Imagen adjunta' : ''),
      sender: 'user',
      timestamp: new Date(),
      ...(attachedImage && { image: {
        data: attachedImage.data,
        name: attachedImage.name,
        type: attachedImage.type,
      }}),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);
    setShowChat(true);

    try {
      const payload = {
        Json: {
          message: userMessage.text || '',
          timestamp: userMessage.timestamp.toISOString(),
          'id-Message': userMessage.id,
          ...(userMessage.image && {
            image: {
              data: userMessage.image.data,
              name: userMessage.image.name,
              type: userMessage.image.type,
            }
          }),
        }
      };

      const response = await fetch('https://n8n.srv880021.hstgr.cloud/webhook/Mkt-vortexia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.text();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseData || 'Respuesta recibida del webhook',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Error al enviar mensaje al webhook. Por favor, intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const suggestions = [
    {
      text: "Marketing site redesign",
      icon: "🚀"
    },
    {
      text: "Create new document",
      icon: "📄"
    },
    {
      text: "Hola, ¿cómo estás?",
      icon: "👋"
    },
    {
      text: "¿Puedes ayudarme con una pregunta?",
      icon: "❓"
    }
  ];

  return (
    <div className="min-h-screen text-white relative z-10 font-brand">
      {/* Fondo minimalista animado */}
      <div className="bg-animated"></div>
      {/* Encabezado simplificado */}
      <header className="flex items-center justify-center px-8 py-6">
        {/* Marca tipográfica elegante */}
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl text-white font-brand">Media+</h1>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-8 pt-16 scene-3d">

        {/* Título principal estático sin movimiento */}
        <div className="text-center mb-16">
          <h1 className="font-brand text-5xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
            Crea videos utilizando inteligencia artificial
          </h1>
          <p className="font-future text-lg md:text-xl text-gray-300/90 max-w-3xl mx-auto leading-relaxed">
            Herramientas de creación y edición elevadas a una experiencia minimalista y futurista.
          </p>
        </div>

        {/* Área de chat movida encima del input */}
        {showChat && (
          <div className="max-w-5xl mx-auto mt-16">
            <div className="rounded-3xl p-8 max-h-96 overflow-y-auto chat-scrollbar scrollbar-hide scrollbar-none" role="log" aria-live="polite" aria-relevant="additions text">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-slide-in`}
                    role="article"
                    aria-label={`Mensaje de ${message.sender === 'user' ? 'Tú' : 'Ultimate Media'}`}
                  >
                    <div className={`max-w-xl px-5 py-4 rounded-2xl chatgpt-bubble ${message.sender === 'user' ? 'chatgpt-user' : 'chatgpt-bot'}`}>
                      {/* Encabezado del agente removido por solicitud */}
                      {/* Image */}
                      {message.image && (
                        <div className="mb-3">
                          <img
                            src={message.image.data}
                            alt={message.image.name}
                            className="max-w-full h-auto rounded-xl border border-gray-600 cursor-zoom-in"
                            style={{ maxHeight: '200px' }}
                            onClick={() => setModalImage({ src: message.image!.data, name: message.image!.name })}
                          />
                          <p className="text-xs mt-2 opacity-70">
                            📎 {message.image.name}
                          </p>
                        </div>
                      )}
                      {/* Text */}
                      {message.text && (
                        <p className="font-future text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      )}
                      {/* Botón copiar solo en respuestas del bot */}
                      {message.sender !== 'user' && (
                        <button
                          onClick={() => copyMessage(message.text)}
                          className="mt-3 p-2 text-xs opacity-70 hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg"
                          title="Copiar mensaje"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start message-slide-in">
                    <div className="max-w-lg px-6 py-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                        <span className="text-sm opacity-80">Enviando mensaje...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Área de entrada con efecto typewriter como ilustración */}
        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={sendMessage} className="relative" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} aria-label="Área de entrada de mensaje">
            <div className={`relative card-3d ${isDragOver ? 'chat-dnd' : ''}`}>
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                rows={1}
                className="font-future w-full resize-none px-16 py-4 bg-gray-900/50 border-2 border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all duration-300 backdrop-blur-sm text-lg input-glow"
                aria-label="Escribe tu mensaje"
                placeholder="Escribe tu mensaje"
              />
              {/* Texto ilustrativo animado cuando el input está vacío */}
              
              
            </div>

            {/* Image preview with 3D effect */}
            {attachedImage && (
              <div className="mt-6 p-6 rounded-2xl border attach-preview-elegant backdrop-blur-sm message-slide-in">
                <div className="flex items-start gap-4">
                  <img
                    src={attachedImage.preview}
                    alt={attachedImage.name}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">
                      {attachedImage.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {attachedImage.type} • {(attachedImage.data.length * 3 / 4 / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={removeAttachedImage}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex space-x-4">
                {suggestions.slice(0, 2).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setInputText(suggestion.text)}
                    className="flex items-center space-x-3 px-6 py-4 bg-gray-900/50 text-white rounded-xl hover:bg-gray-800/50 transition-all duration-300 card-3d backdrop-blur-sm border border-gray-700 button-pulse"
                  >
                    <span className="text-xl">{suggestion.icon}</span>
                    <span className="font-future text-sm font-medium">{suggestion.text}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-4 text-gray-300 rounded-xl transition-all duration-500 disabled:opacity-50 backdrop-blur-sm border border-gray-700 attach-elegant"
                  title="Adjuntar imagen"
                aria-label="Adjuntar imagen"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedImage) || isLoading}
                  className="font-future flex items-center space-x-3 px-6 py-4 bg-gray-900/50 text-white rounded-xl hover:bg-gray-800/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed card-3d backdrop-blur-sm border border-gray-700 button-pulse"
                aria-label="Enviar mensaje"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>Generar</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        

        
      </main>

      {/* Modal de imagen */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-label={modalImage.name}
          onClick={() => setModalImage(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setModalImage(null); }}
          tabIndex={-1}
        >
          <div className="max-w-5xl max-h-[85vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={modalImage.src}
              alt={modalImage.name}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
            <div className="mt-3 text-center text-sm text-gray-300 font-future">{modalImage.name}</div>
                    </div>
                  </div>
                )}

    </div>
  );
};

export default Chat;
