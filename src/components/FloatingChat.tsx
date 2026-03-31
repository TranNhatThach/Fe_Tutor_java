import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

interface ChatMessage {
  sender: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
}

export function FloatingChat() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [stompClient, setStompClient] = useState<Client | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') + '/ws' 
      : 'http://localhost:8080/ws';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Subscribe to public chat
        client.subscribe('/topic/public', (payload) => {
          const message = JSON.parse(payload.body) as ChatMessage;
          setMessages((prev) => [...prev, message]);
        });

        // Broadcast JOIN message
        client.publish({
          destination: '/app/chat.addUser',
          body: JSON.stringify({ sender: user.name, type: 'JOIN' }),
        });
      },
      onDisconnect: () => {
        console.log("Disconnected from Chat");
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !stompClient || !stompClient.active || !user) return;

    const chatMessage: ChatMessage = {
      sender: user.name,
      content: inputMessage,
      type: 'CHAT'
    };

    stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(chatMessage)
    });
    
    setInputMessage('');
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all z-50 group border-2 border-white"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && !isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="p-4 bg-emerald-600 text-white flex items-center justify-between shadow-md z-10 w-full rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-emerald-600 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold">Cộng đồng tự do</h3>
                <p className="text-xs text-emerald-100">Kênh hỗ trợ realtime</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat box */}
          <div className="flex-1 max-h-[400px] min-h-[300px] p-4 overflow-y-auto space-y-4 bg-slate-50 relative">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <MessageCircle className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-medium">Bắt đầu trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender === user?.name;
                
                if (msg.type === 'JOIN' || msg.type === 'LEAVE') {
                  return (
                    <div key={index} className="flex justify-center my-2">
                      <span className="bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center">
                        {msg.sender} {msg.type === 'JOIN' ? 'đã tham gia' : 'đã rời khỏi'}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={index} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className={`max-w-[70%] group relative ${isMe ? 'items-end' : 'items-start'}`}>
                      <p className={`text-[10px] font-bold text-slate-400 mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {msg.sender}
                      </p>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-200' 
                          : 'bg-white text-slate-700 rounded-bl-none shadow-sm border border-slate-100'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 bg-transparent text-sm font-medium text-slate-700 focus:outline-none placeholder:text-slate-400"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
              >
                <Send className="w-4 h-4 mr-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
