import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  Loader2, Send, BookOpen, Info, ChevronRight,
  DollarSign, MapPin, CheckCircle2, XCircle,
  Paperclip, File, Download, Image as ImageIcon, Smile,
  Search, X, LayoutGrid, FileText, Images
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
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

const API_URL_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8080');
const fixUrl = (url: string) => url.replace('http://localhost:8080', API_URL_BASE);

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
  const [unreadRooms, setUnreadRooms] = useState<Record<string, number>>({});
  const selectedRoomIdRef = useRef<string | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMediaPanel, setShowMediaPanel] = useState(false);

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

  useEffect(() => {
    if (selected) {
      const roomId = `${selected.yeuCauTimGiaSu.maYeuCau}_${selected.giaSu.maGiaSu}`;
      selectedRoomIdRef.current = roomId;
      setUnreadRooms(prev => ({ ...prev, [roomId]: 0 }));
    } else {
      selectedRoomIdRef.current = null;
    }
  }, [selected]);

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
              // Skip if already have exact message
              if (current.some(m => m.id === message.id)) return prev;
              // Remove matching temp message (null-safe fileUrl comparison)
              const withoutTemp = current.filter(m => {
                if (!m.id?.startsWith('temp_')) return true;
                const sameText = (m.text || '') === (message.text || '');
                const sameFile = (m.fileUrl || '') === (message.fileUrl || '');
                return !(sameText && sameFile); // remove temp if content matches
              });

              // Show unread if: not in this room AND message is NOT from tutor (i.e. from student)
              const isFromOtherUser = message.from !== 'tutor';
              if (selectedRoomIdRef.current !== roomId && isFromOtherUser) {
                setUnreadRooms(ur => ({ ...ur, [roomId]: (ur[roomId] || 0) + 1 }));
              }
              
              return {
                ...prev,
                [roomId]: [...withoutTemp, message]
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

  const sendMessage = async () => {
    if (!selected || !stompClientRef.current?.active) return;
    if (!inputMsg.trim() && !selectedFile) return;
    
    const key = selected.yeuCauTimGiaSu.maYeuCau;
    const maGiaSu = selected.giaSu.maGiaSu;
    const roomId = `${key}_${maGiaSu}`;

    let finalFileUrl = undefined;
    let finalFileName = undefined;
    let finalFileType = undefined;
    let finalType = 'CHAT';

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

    const msg: ChatMessage = {
      id: `temp_${Date.now()}`,
      from: 'tutor',
      text: inputMsg.trim(),
      time: nowTime(),
      senderId: user?.userId,
      senderName: user?.name,
      type: finalType,
      fileUrl: finalFileUrl,
      fileName: finalFileName,
      fileType: finalFileType
    };

    // Optimistic local insert
    setChatRooms(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), msg]
    }));
    
    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(msg)
    });

    setInputMsg('');
  };

  const handleSendSticker = (stickerUrl: string) => {
    if (!selected || !stompClientRef.current?.active) return;
    
    const key = selected.yeuCauTimGiaSu.maYeuCau;
    const maGiaSu = selected.giaSu.maGiaSu;
    const roomId = `${key}_${maGiaSu}`;

    const msg: ChatMessage = {
      id: `temp_${Date.now()}`,
      from: 'tutor',
      text: '',
      time: nowTime(),
      senderId: user?.userId,
      senderName: user?.name,
      type: 'IMAGE',
      fileUrl: stickerUrl,
      fileName: 'sticker.png',
      fileType: 'IMAGE'
    };

    // Optimistic local insert
    setChatRooms(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), msg]
    }));
    
    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(msg)
    });
    
    setShowStickers(false);
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

  const filteredApplications = applications.filter((app) => {
    const term = searchQuery.toLowerCase();
    const yc = app.yeuCauTimGiaSu;
    const name = yc.hocVien?.taiKhoan?.hoTen?.toLowerCase() || '';
    const mon = yc.monHoc?.tenMon?.toLowerCase() || '';
    return name.includes(term) || mon.includes(term);
  });

  return (
    <div className="font-sans h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đơn ứng tuyển của tôi</h1>
        <p className="text-slate-500 mt-1">Theo dõi trạng thái và trao đổi với học viên</p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── LEFT: Danh sách ứng tuyển ─────────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-800">Đã ứng tuyển</span>
              <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {applications.length}
              </span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học viên, môn..."
                className="w-full bg-slate-50 text-sm border border-slate-100 outline-none py-2 pl-9 pr-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <Info className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">{searchQuery ? 'Không tìm thấy kết quả' : 'Bạn chưa ứng tuyển yêu cầu nào'}</p>
                {!searchQuery && <p className="text-slate-300 text-xs mt-1">Hãy vào "Việc làm mới" để tìm kiếm</p>}
              </div>
            ) : (
            <div className="divide-y divide-slate-50">
                {filteredApplications.map((app) => {
                  const yc = app.yeuCauTimGiaSu;
                  const isSelected = selected?.yeuCauTimGiaSu.maYeuCau === yc.maYeuCau;
                  const hocVienName = yc.hocVien?.taiKhoan?.hoTen || 'Học viên';
                  const roomKey = `${yc.maYeuCau}_${app.giaSu.maGiaSu}`;
                  const unreadCount = unreadRooms[roomKey] || 0;
                  const hasUnread = unreadCount > 0;

                  // Last message preview logic
                  const roomMsgs = chatRooms[roomKey] || [];
                  const lastMsg = roomMsgs[roomMsgs.length - 1];
                  let previewText = "";
                  if (lastMsg) {
                    const mType = lastMsg.fileType || lastMsg.type || 'CHAT';
                    if (mType === 'IMAGE') previewText = lastMsg.fileName === 'sticker.png' ? '[Nhãn dán]' : '[Hình ảnh]';
                    else if (mType === 'FILE') previewText = `[Tệp] ${lastMsg.fileName || 'đính kèm'}`;
                    else previewText = lastMsg.text || 'Tin nhắn mới';
                  } else if (app.loiNhan) {
                    previewText = `"${app.loiNhan}"`;
                  } else {
                    previewText = 'Chưa có tin nhắn';
                  }

                  return (
                    <div
                      key={yc.maYeuCau}
                      onClick={() => setSelected(app)}
                      className={`p-4 cursor-pointer transition-all relative ${
                        isSelected
                          ? 'bg-emerald-50 border-l-4 border-emerald-500'
                          : hasUnread
                          ? 'bg-red-50/60 border-l-4 border-red-400 hover:bg-red-50'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {hocVienName[0].toUpperCase()}
                          </div>
                          {hasUnread && !isSelected && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1 shadow-md animate-bounce">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className={`font-bold text-sm truncate ${hasUnread && !isSelected ? 'text-slate-900' : 'text-slate-900'}`}>
                              {yc.monHoc?.tenMon || 'Môn học'}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {hasUnread && !isSelected && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {unreadCount} mới
                                </span>
                              )}
                              <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : hasUnread ? 'text-red-400' : 'text-slate-300'}`} />
                            </div>
                          </div>
                          <p className={`text-xs font-semibold mb-1 ${hasUnread && !isSelected ? 'text-red-500' : 'text-blue-600'}`}>{hocVienName}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-1">
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
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-1">
                            <p className={`text-[11.5px] line-clamp-1 pr-2 flex-1 ${hasUnread && !isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                              {lastMsg && (
                                <span className={lastMsg.from === 'tutor' ? 'text-slate-400' : 'text-emerald-600 font-medium'}>
                                  {lastMsg.from === 'tutor' ? 'Bạn: ' : ''}
                                </span>
                              )}
                              {previewText}
                            </p>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${statusStyle(app.trangThai)}`}>
                              {statusLabel(app.trangThai)}
                            </span>
                          </div>
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
              <div className="px-5 py-3.5 border-b border-slate-100/80 flex items-center gap-3 bg-gradient-to-r from-white to-emerald-50/30 shrink-0">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200/50">
                    {(selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'H')[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-[15px]">
                    {selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'Học viên'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {selected.yeuCauTimGiaSu.monHoc?.tenMon || '—'}
                    {selected.yeuCauTimGiaSu.diaDiem && ` · ${selected.yeuCauTimGiaSu.diaDiem}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide ${statusStyle(selected.trangThai)}`}>
                    {statusLabel(selected.trangThai)}
                  </span>
                  <button
                    onClick={() => setShowMediaPanel(!showMediaPanel)}
                    className={`p-2 rounded-xl transition-all shrink-0 ml-1 flex items-center gap-1.5 border ${
                      showMediaPanel 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' 
                        : 'bg-white text-slate-400 border-transparent hover:border-slate-200 hover:text-emerald-600 hover:shadow-sm'
                    }`}
                    title="Ảnh & File đính kèm"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex min-h-0 relative">
                <div className="flex-1 flex flex-col min-w-0">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 bg-gradient-to-b from-slate-50/80 to-white" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16,185,129,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.03) 0%, transparent 50%)'}}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center mb-5 shadow-inner">
                      <Send className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="font-bold text-slate-700 mb-1.5 text-lg">Bắt đầu trò chuyện</p>
                    <p className="text-sm text-slate-400 max-w-[260px]">
                      Gửi lời chào tới <span className="font-semibold text-emerald-600">{selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'học viên'}</span> để trao đổi
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                {messages.map((msg, index) => {
                  const isMe = msg.from === 'tutor';
                  const mType = msg.fileType || msg.type || 'CHAT';
                  const fileUrl = msg.fileUrl ? fixUrl(msg.fileUrl) : '';
                  const showAvatar = index === 0 || messages[index - 1]?.from !== msg.from;

                  if (mType === 'JOIN' || mType === 'LEAVE') return null;

                  return (
                    <div key={msg.id || index} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-4' : 'mt-0.5'}`}>
                      {showAvatar ? (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                        }`}>
                          {isMe ? (user?.name?.[0] || 'T').toUpperCase()
                                 : (selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen?.[0] || 'H').toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      <div className={`max-w-[65%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sticker */}
                        {mType === 'IMAGE' && msg.fileUrl && msg.fileName === 'sticker.png' && (
                          <img src={fileUrl} alt="Sticker" className="w-28 h-28 object-contain hover:scale-105 transition-transform drop-shadow-md" />
                        )}
                        {/* Image */}
                        {mType === 'IMAGE' && msg.fileUrl && msg.fileName !== 'sticker.png' && (
                          <a href={fileUrl} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border-2 border-white">
                            <img src={fileUrl} alt={msg.fileName || 'Image'} className="max-w-[220px] max-h-[220px] object-cover" />
                          </a>
                        )}
                        {/* File */}
                        {mType === 'FILE' && msg.fileUrl && (
                          <a href={fileUrl} target="_blank" rel="noreferrer" download className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                              isMe
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500/30 text-white shadow-md shadow-emerald-200/30'
                                : 'bg-white border-slate-100 text-slate-700 shadow-md shadow-slate-100/50'
                          }`}>
                            <div className={`p-2 rounded-xl ${isMe ? 'bg-white/20' : 'bg-slate-50'}`}>
                              <File className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold truncate block max-w-[140px]">{msg.fileName}</span>
                              <span className={`text-[10px] ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>Tệp đính kèm</span>
                            </div>
                            <Download className="w-4 h-4 opacity-60 shrink-0" />
                          </a>
                        )}
                        {/* Text */}
                        {msg.text && msg.text.trim() !== '' && (
                          <div className={`px-4 py-2.5 text-[13.5px] leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-2xl rounded-br-md shadow-md shadow-emerald-200/30'
                              : 'bg-white text-slate-800 border border-slate-100/80 shadow-md shadow-slate-100/30 rounded-2xl rounded-bl-md'
                          }`}>
                            {msg.text}
                          </div>
                        )}
                        <span className={`text-[10px] px-1.5 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
                </div>
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t border-slate-100/80 shrink-0 relative">
                {selectedFile ? (
                   <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl mb-2 border border-emerald-100/80">
                       <div className="flex items-center gap-2 overflow-hidden">
                           <Paperclip className="w-3.5 h-3.5 shrink-0" />
                           <span className="truncate">{selectedFile.name}</span>
                       </div>
                       <button type="button" onClick={() => { 
                         setSelectedFile(null); 
                         if (fileInputRef.current) fileInputRef.current.value = ''; 
                         if (imageInputRef.current) imageInputRef.current.value = ''; 
                       }} className="p-1 hover:bg-emerald-200/50 rounded-full text-emerald-600 transition-colors">
                           <XCircle className="w-4 h-4" />
                       </button>
                   </div>
                ) : null}

                {/* Sticker Popover */}
                {showStickers && (
                  <div className="absolute bottom-[72px] left-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-2xl p-3 w-[300px] z-50">
                    <p className="text-xs font-bold text-slate-500 mb-2 px-1">Nhãn dán</p>
                    <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {STICKERS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendSticker(url)}
                          className="p-1.5 hover:bg-emerald-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                        >
                          <img src={url} alt="Sticker" className="w-10 h-10 object-contain drop-shadow-sm" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-end bg-slate-50/80 rounded-2xl border border-slate-200/60 px-2 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all">
                  <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
                    <button
                      type="button"
                      onClick={() => setShowStickers(!showStickers)}
                      className={`w-8 h-8 flex justify-center items-center rounded-lg transition-colors ${showStickers ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      title="Nhãn dán"
                    >
                      <Smile className="w-[18px] h-[18px]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()}
                      className="w-8 h-8 flex justify-center items-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Gửi hình ảnh"
                    >
                      <ImageIcon className="w-[18px] h-[18px]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 flex justify-center items-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Đính kèm"
                    >
                      <Paperclip className="w-[18px] h-[18px]" />
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
                    rows={1}
                    className="flex-1 bg-transparent max-h-[80px] min-h-[36px] py-2 outline-none text-sm text-slate-800 placeholder-slate-400 resize-none"
                    placeholder={`Nhắn tin với ${selected.yeuCauTimGiaSu.hocVien?.taiKhoan?.hoTen || 'học viên'}...`}
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           sendMessage();
                       }
                    }}
                  />
                  <button
                    type="button"
                    title="Gửi"
                    onClick={sendMessage}
                    disabled={(!inputMsg.trim() && !selectedFile) || isUploading}
                    className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-30 shrink-0 shadow-md shadow-emerald-200/40 mb-0.5"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Media Panel */}
            {showMediaPanel && (
              <div className="w-[300px] border-l border-slate-100/80 bg-slate-50/30 flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300">
                <div className="px-5 py-4 border-b border-slate-100/80 flex items-center justify-between bg-white shrink-0">
                  <span className="font-bold text-sm text-slate-800">Ảnh & File đính kèm</span>
                  <button onClick={() => setShowMediaPanel(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-1.5 rounded-lg hover:bg-red-50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {(() => {
                    const allMedia = messages.filter(m => (m.type === 'IMAGE' || m.fileType === 'IMAGE' || m.type === 'FILE' || m.fileType === 'FILE') && m.fileUrl);
                    const dImages = allMedia.filter(m => (m.type === 'IMAGE' || m.fileType === 'IMAGE') && m.fileName !== 'sticker.png');
                    const dFiles = allMedia.filter(m => m.type === 'FILE' || m.fileType === 'FILE');
                    
                    if (dImages.length === 0 && dFiles.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
                          <Images className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-sm font-medium text-slate-500">Chưa có phương tiện nào</p>
                          <p className="text-xs text-slate-400 mt-1">Ảnh và tệp đính kèm sẽ xuất hiện ở đây</p>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {dImages.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 text-slate-700">
                              <Images className="w-4 h-4 text-emerald-600" />
                              <h3 className="font-bold text-sm">Hình ảnh ({dImages.length})</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {dImages.map((img, i) => (
                                <a key={i} href={fixUrl(img.fileUrl!)} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-200/60 hover:border-emerald-400 hover:shadow-md transition-all group relative cursor-zoom-in">
                                  <img src={fixUrl(img.fileUrl!)} alt={img.fileName || 'Image'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {dImages.length > 0 && dFiles.length > 0 && <div className="h-px bg-slate-200/60"></div>}
                        
                        {dFiles.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 text-slate-700">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              <h3 className="font-bold text-sm">Tệp đính kèm ({dFiles.length})</h3>
                            </div>
                            <div className="space-y-2.5">
                              {dFiles.map((file, i) => (
                                <a key={i} href={fixUrl(file.fileUrl!)} target="_blank" rel="noreferrer" download className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all group">
                                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                    <File className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12.5px] font-bold text-slate-700 truncate group-hover:text-emerald-700 transition-colors">{file.fileName || 'Tệp đính kèm'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{file.time || ''}</p>
                                  </div>
                                  <Download className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            
          </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.05) 0%, transparent 70%)'}}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center mb-6 shadow-inner">
                <Send className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chọn một đơn ứng tuyển</h3>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Chọn một yêu cầu bên trái để xem chi tiết và nhắn tin với học viên
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
