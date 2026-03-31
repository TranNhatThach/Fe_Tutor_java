import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export function AIAssistant() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: 'ai' | 'user', text: string }[]>([
    { from: 'ai', text: 'Chào ' + user?.name + '! Tôi là Trợ lý AI của TutorConnect. Bạn cần hỗ trợ gì về việc tìm gia sư hay chính sách học tập không?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setMessages(prev => [...prev, { from: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      // Gọi API Proxy về Local Model
      const res = await apiClient<{ answer: string }>('/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText })
      });

      setMessages(prev => [...prev, { from: 'ai', text: res.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { from: 'ai', text: 'Rất tiếc, tôi đang mất kết nối với máy chủ AI local. Hãy thử lại sau nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Nút bong bóng chat AI */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all group border-2 border-white/20 animate-bounce"
          title="Hỏi trợ lý AI"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
          </span>
        </button>
      )}

      {/* Cửa sổ chat AI */}
      {isOpen && (
        <div className="w-80 h-[450px] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-right-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-bold leading-none">AI TutorConnect</h3>
                <span className="text-[10px] text-indigo-200">Trợ lý ảo thông minh</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Body Chat */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.from === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-2xl border border-slate-200 flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI đang suy nghĩ...
                </div>
              </div>
            )}
          </div>

          {/* Input Chat */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-1 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <input
                type="text"
                placeholder="Hỏi AI về gia sư..."
                className="flex-1 bg-transparent py-2 outline-none text-sm text-slate-700 font-medium"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
