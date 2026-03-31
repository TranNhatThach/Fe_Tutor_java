import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  Loader2, Send, BookOpen, Info, ChevronRight,
  DollarSign, Clock, MapPin, CheckCircle2, XCircle
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

interface YeuCau {
  maYeuCau: number;
  moTa?: string;
  trangThai?: string;
  monHoc?: { tenMon: string };
  trinhDo?: string;
  diaDiem?: string;
  hocVien?: {
    maHocVien: number;
    taiKhoan: { hoTen: string; email: string };
  };
}

interface UngTuyen {
  giaSu: { maGiaSu: number };
  yeuCauTimGiaSu: YeuCau;
  loiNhan?: string;
  mucHocPhiDeXuat?: number;
  trangThai: string;
  ngayUngTuyen?: string;
}

interface ChatMessage {
  id: string;
  from: 'tutor' | 'student';
  text: string;
  time: string;
  senderId?: number;
  senderName?: string;
}

const nowTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const statusStyle = (s: string) => {
  switch (s) {
    case 'CHỜ HỌC VIÊN XÁC NHẬN':
    case 'CHỜ GIA SƯ XÁC NHẬN':
      return 'bg-amber-100 text-amber-700';
    case 'ĐỒNG Ý':
      return 'bg-emerald-100 text-emerald-700';
    case 'HỌC VIÊN TỪ CHỐI':
    case 'GIA SƯ TỪ CHỐI':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

const statusLabel = (s: string) => {
  switch (s) {
    case 'CHỜ HỌC VIÊN XÁC NHẬN': return 'Chờ học viên duyệt';
    case 'CHỜ GIA SƯ XÁC NHẬN':   return 'Chờ bạn xác nhận';
    case 'ĐỒNG Ý':                 return 'Đã duyệt ✓';
    case 'HỌC VIÊN TỪ CHỐI':      return 'Học viên từ chối';
    case 'GIA SƯ TỪ CHỐI':        return 'Bạn đã từ chối';
    default:                       return s;
  }
};

export function TutorApplicationsPage() {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<UngTuyen | null>(null);
  const [chatRooms, setChatRooms] = useState<Record<string, ChatMessage[]>>({});
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['tutor-applications', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      const data = await apiClient<UngTuyen[]>(`/tuyen-dung/da-ung-tuyen/${user.userId}`);
      return data || [];
    },
    enabled: !!user?.userId,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected, chatRooms]);

  // ─── Load lịch sử chat khi chọn đơn ứng tuyển ──────────────────────────────
  useEffect(() => {
    if (!selected) return;
    const roomId = `${selected.yeuCauTimGiaSu.maYeuCau}_${selected.giaSu.maGiaSu}`;
    // Chỉ load nếu chưa có trong cache
    if (chatRooms[roomId] && chatRooms[roomId].length > 0) return;
    
    apiClient<ChatMessage[]>(`/chat/history/${roomId}`)
      .then(messages => {
        setChatRooms(prev => ({
          ...prev,
          [roomId]: messages || []
        }));
      })
      .catch(err => console.error('Lỗi tải lịch sử chat:', err));
  }, [selected]);

  // ─── Kết nối WebSocket ─────────────────────────────────────────────────────
  const stompClientRef = useRef<Client | null>(null);
  const appIds = applications.map(app => `${app.yeuCauTimGiaSu.maYeuCau}_${app.giaSu.maGiaSu}`).join(',');

  useEffect(() => {
    if (!user || applications.length === 0) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') + '/ws' 
      : 'http://localhost:8080/ws';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => console.log('[STOMP Tutor] ', msg),
      onConnect: () => {
        // Đăng ký nhận tin nhắn từ tất cả phòng chat mà gia sư này đã ứng tuyển
        applications.forEach(app => {
          const roomId = `${app.yeuCauTimGiaSu.maYeuCau}_${app.giaSu.maGiaSu}`;
          client.subscribe(`/topic/chat/${roomId}`, (payload) => {
            const message = JSON.parse(payload.body) as ChatMessage;
            setChatRooms(prev => {
              const current = prev[roomId] || [];
              if (current.some(m => m.id === message.id)) return prev;
              return {
                ...prev,
                [roomId]: [...current, message]
              };
            });
          });
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) client.deactivate();
    };
  }, [appIds, user]);

  const sendMessage = () => {
    if (!inputMsg.trim() || !selected || !stompClientRef.current?.active) return;
    
    const key = selected.yeuCauTimGiaSu.maYeuCau;
    const maGiaSu = selected.giaSu.maGiaSu;
    const roomId = `${key}_${maGiaSu}`;

    const msg: ChatMessage = {
      id: `temp_${Date.now()}`,
      from: 'tutor',
      text: inputMsg.trim(),
      time: nowTime(),
      senderId: user?.userId,
      senderName: user?.name,
    };
    
    // Gửi tin nhắn qua STOMP (server sẽ lưu DB rồi broadcast lại)
    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(msg)
    });

    setInputMsg('');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải...</p>
      </div>
    );
  }

  const currentRoomId = selected
    ? `${selected.yeuCauTimGiaSu.maYeuCau}_${selected.giaSu.maGiaSu}`
    : null;
  const messages = currentRoomId ? (chatRooms[currentRoomId] || []) : [];

  return (
    <div className="font-sans h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đơn ứng tuyển của tôi</h1>
        <p className="text-slate-500 mt-1">Theo dõi trạng thái và trao đổi với học viên</p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── LEFT: Danh sách ứng tuyển ─────────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800">Đã ứng tuyển</span>
            <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {applications.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <Info className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">Bạn chưa ứng tuyển yêu cầu nào</p>
                <p className="text-slate-300 text-xs mt-1">Hãy vào "Việc làm mới" để tìm kiếm</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {applications.map((app) => {
                  const yc = app.yeuCauTimGiaSu;
                  const isSelected = selected?.yeuCauTimGiaSu.maYeuCau === yc.maYeuCau;
                  const hocVienName = yc.hocVien?.taiKhoan?.hoTen || 'Học viên';
                  return (
                    <div
                      key={yc.maYeuCau}
                      onClick={() => setSelected(app)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                          {hocVienName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-slate-900 text-sm truncate">
                              {yc.monHoc?.tenMon || 'Môn học'}
                            </p>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                          </div>
                          <p className="text-xs text-blue-600 font-semibold mb-1">{hocVienName}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-2">
                            {yc.trinhDo && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {yc.trinhDo}
                              </span>
                            )}
                            {yc.diaDiem && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {yc.diaDiem}
                              </span>
                            )}
                            {app.mucHocPhiDeXuat != null && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <DollarSign className="w-3 h-3" /> {app.mucHocPhiDeXuat.toLocaleString()}đ/h
                              </span>
                            )}
                          </div>
                          {app.loiNhan && (
                            <p className="text-xs text-slate-500 italic line-clamp-1 mb-1.5">"{app.loiNhan}"</p>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle(app.trangThai)}`}>
                            {statusLabel(app.trangThai)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-w-0">
          {selected ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {(selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'H')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">
                    {selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'Học viên'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Môn: {selected.yeuCauTimGiaSu.monHoc?.tenMon || '—'}
                    {selected.yeuCauTimGiaSu.diaDiem && ` · ${selected.yeuCauTimGiaSu.diaDiem}`}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle(selected.trangThai)}`}>
                  {statusLabel(selected.trangThai)}
                </span>
              </div>

              {/* Info bar */}
              {selected.yeuCauTimGiaSu.moTa && (
                <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 text-xs text-slate-500 italic">
                  📋 {selected.yeuCauTimGiaSu.moTa}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/30">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
                      <Send className="w-7 h-7 text-emerald-300" />
                    </div>
                    <p className="font-bold text-slate-700 mb-1">Chưa có tin nhắn</p>
                    <p className="text-sm text-slate-400">
                      Gửi lời chào tới <span className="font-semibold">{selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'học viên'}</span> để bắt đầu trao đổi
                    </p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.from === 'tutor';
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        isMe
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                      }`}>
                        {isMe ? (user?.name?.[0] || 'T').toUpperCase()
                               : (selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen?.[0] || 'H').toUpperCase()}
                      </div>
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-4 border-t border-slate-100 bg-white shrink-0">
                <div className="flex gap-3 items-center bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
                    placeholder={`Nhắn tin với ${selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'học viên'}...`}
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    type="button"
                    title="Gửi tin nhắn"
                    onClick={sendMessage}
                    disabled={!inputMsg.trim()}
                    className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-40 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6">
                <Send className="w-9 h-9 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chọn một đơn ứng tuyển</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Chọn một yêu cầu bên trái để xem chi tiết và nhắn tin với học viên
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
