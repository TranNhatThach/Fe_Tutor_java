import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Paperclip, File, Download, Loader2, Image as ImageIcon, Smile } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { apiClient } from '../api/client';

interface ChatMessage {
  id?: string;
  sender: string;
  senderId?: number;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  time?: string;
}

export function FloatingChat() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(isOpen);
  
  // Sync state to ref to use inside WebSocket callback
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0); // Clear on open
    }
  }, [isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showStickers, setShowStickers] = useState(false);

  const STICKERS = [
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Grinning%20Face%20with%20Smiling%20Eyes.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Rolling%20on%20the%20Floor%20Laughing.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pleading%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Holding%20Back%20Tears.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Partying%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Exploding%20Head.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Shushing%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Saluting%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Waving%20Hand.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Thumbs%20Up.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Folded%20Hands.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Hand%20with%20Index%20Finger%20and%20Thumb%20Crossed.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Dog%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Monkey%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Bear.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Panda.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Penguin.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Pig%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Halo.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Zany%20Face.png',
    'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Nerd%20Face.png'
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Load history when opening chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      apiClient<any[]>('/chat/history/public')
        .then(res => {
          const loaded: ChatMessage[] = res.map(m => ({
            id: m.id,
            sender: m.senderName || m.from,
            content: m.text,
            type: m.fileType || m.type || (m.fileUrl ? (m.fileType === 'IMAGE' ? 'IMAGE' : 'FILE') : 'CHAT'),
            fileUrl: m.fileUrl,
            fileName: m.fileName,
            fileType: m.fileType,
            time: m.time
          }));
          setMessages(loaded);
        })
        .catch(err => console.error("Could not load chat history", err));
    }
  }, [isOpen]);

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
        client.subscribe('/topic/chat/public', (payload) => {
          const parsedMsg = JSON.parse(payload.body) as ChatMessage;
          setMessages((prev) => {
            if (parsedMsg.id && prev.some(m => m.id === parsedMsg.id)) return prev;
            
            if (!isOpenRef.current && String(parsedMsg.senderId) !== String(user.id) && String(parsedMsg.senderId) !== String(user.userId)) {
              setUnreadCount(prev => prev + 1);
            }
            
            return [...prev, parsedMsg];
          });
        });

        client.publish({
          destination: '/app/chat/public',
          body: JSON.stringify({ senderName: user.name, senderId: user.id || user.userId, text: '', type: 'JOIN' }),
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stompClient || !stompClient.active || !user) return;
    if (!inputMessage.trim() && !selectedFile) return;

    let finalFileUrl = undefined;
    let finalFileName = undefined;
    let finalFileType = undefined;
    let finalType: ChatMessage['type'] = 'CHAT';

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const uploadRes = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api') + '/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        finalFileUrl = data.url;
        finalFileName = data.fileName;
        finalFileType = data.type;
        finalType = data.type;
      } catch (err) {
        console.error("Lỗi upload", err);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    }

    const chatMessage = {
      senderName: user.name,
      senderId: user.id || user.userId,
      text: inputMessage,
      type: finalType,
      fileUrl: finalFileUrl,
      fileName: finalFileName,
      fileType: finalFileType
    };

    stompClient.publish({
      destination: '/app/chat/public',
      body: JSON.stringify(chatMessage)
    });

    setInputMessage('');
  };

  const handleSendSticker = (stickerUrl: string) => {
    if (!stompClient || !stompClient.active || !user) return;
    const chatMessage = {
      senderName: user.name,
      senderId: user.id || user.userId,
      text: '',
      type: 'IMAGE',
      fileUrl: stickerUrl,
      fileName: 'sticker.png',
      fileType: 'IMAGE'
    };
    stompClient.publish({
      destination: '/app/chat/public',
      body: JSON.stringify(chatMessage)
    });
    setShowStickers(false);
  };

  const API_URL_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8080');

  const fixUrl = (url: string) => url.replace('http://localhost:8080', API_URL_BASE);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all z-50 group border-2 border-white"
        title="Chat cộng đồng"
      >
        <MessageCircle className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`} />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
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

          <div className="flex-1 max-h-[400px] min-h-[300px] p-4 overflow-y-auto space-y-4 bg-slate-50 relative">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <MessageCircle className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-medium">Bắt đầu trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = (msg.sender || (msg as any).senderName) === user?.name;
                const senderName = msg.sender || (msg as any).senderName;
                const mType = (msg as any).fileType || msg.type || 'CHAT';
                const fileUrl = fixUrl(msg.fileUrl || '');

                if (mType === 'JOIN' || mType === 'LEAVE') {
                  return (
                    <div key={index} className="flex justify-center my-2">
                      <span className="bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center">
                        {senderName} {mType === 'JOIN' ? 'đã tham gia' : 'đã rời khỏi'}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={index} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className={`max-w-[70%] group relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        {isMe ? <>{msg.time} · {senderName}</> : <>{senderName} · {msg.time}</>}
                      </p>

                      {/* Image/Sticker Message */}
                      {mType === 'IMAGE' && msg.fileUrl && (
                        <div className={`mb-1 ${msg.fileName === 'sticker.png' ? '' : 'rounded-xl overflow-hidden border border-slate-200 bg-white'}`}>
                          {msg.fileName === 'sticker.png' ? (
                            <img src={fileUrl} alt="Sticker" className="w-24 h-24 object-contain hover:scale-110 transition-transform" />
                          ) : (
                            <a href={fileUrl} target="_blank" rel="noreferrer">
                              <img src={fileUrl} alt={msg.fileName || 'Image'} className="max-w-[200px] max-h-[200px] object-cover hover:opacity-90 transition-opacity" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* File Message */}
                      {mType === 'FILE' && msg.fileUrl && (
                        <a href={fileUrl} target="_blank" rel="noreferrer" download className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-1 transition-colors ${isMe ? 'bg-emerald-700/50 border-emerald-500 text-white hover:bg-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}>
                          <div className={`p-1.5 rounded-lg ${isMe ? 'bg-white/20' : 'bg-slate-100'}`}>
                            <File className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold truncate max-w-[120px]">{msg.fileName}</span>
                          <Download className="w-3.5 h-3.5 opacity-70 shrink-0 ml-1" />
                        </a>
                      )}

                      {msg.content && msg.content.trim() !== '' && (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe
                            ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-200 leading-relaxed'
                            : 'bg-white text-slate-700 rounded-bl-none shadow-sm border border-slate-100 leading-relaxed'
                          }`}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sticker Popover */}
          {showStickers && (
            <div className="absolute bottom-[72px] left-3 bg-white border border-slate-200 shadow-xl rounded-2xl p-3 w-72 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
                {STICKERS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendSticker(url)}
                    className="p-1 hover:bg-slate-100 rounded-xl transition-all hover:scale-110 active:scale-95"
                  >
                    <img src={url} alt="Sticker" className="w-10 h-10 object-contain drop-shadow-sm" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 relative">
            {selectedFile ? (
               <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl mb-2 border border-emerald-100">
                   <div className="flex items-center gap-2 overflow-hidden">
                       <Paperclip className="w-3.5 h-3.5 shrink-0" />
                       <span className="truncate">{selectedFile.name}</span>
                   </div>
                   <button type="button" onClick={() => { 
                     setSelectedFile(null); 
                     if (fileInputRef.current) fileInputRef.current.value = ''; 
                     if (imageInputRef.current) imageInputRef.current.value = ''; 
                   }} className="p-1 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors">
                       <X className="w-3.5 h-3.5" />
                   </button>
               </div>
            ) : null}
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <div className="flex items-center gap-1 shrink-0 pb-0.5 relative z-10">
                <button
                  type="button"
                  onClick={() => setShowStickers(!showStickers)}
                  className={`w-9 h-9 flex justify-center items-center rounded-full transition-colors ${showStickers ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-100'}`}
                  title="Gửi nhãn dán"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()}
                  className="w-9 h-9 flex justify-center items-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors"
                  title="Gửi hình ảnh"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 flex justify-center items-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors"
                  title="Gửi đính kèm (PDF, Word...)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <input 
                 type="file" 
                 accept="image/*"
                 className="hidden" 
                 ref={imageInputRef} 
                 onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              />
              <input 
                 type="file" 
                 accept="*/*"
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              />
              <textarea
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="flex-1 max-h-[80px] min-h-[36px] bg-transparent text-sm font-medium text-slate-700 focus:outline-none placeholder:text-slate-400 resize-none py-2 ml-1"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSendMessage();
                   }
                }}
              />
              <button 
                type="submit" 
                disabled={(!inputMessage.trim() && !selectedFile) || isUploading}
                className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors mb-0.5 shadow-md shadow-emerald-200"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
