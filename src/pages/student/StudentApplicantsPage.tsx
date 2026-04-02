import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  Loader2, CheckCircle2, XCircle, Clock, DollarSign,
  GraduationCap, Send, Info, ChevronRight, BookOpen, User,
  Paperclip, File, Download, Image as ImageIcon, Smile,
  Search, X, LayoutGrid, FileText, Images
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

interface YeuCau {
  maYeuCau: number;
  moTa: string;
  trangThai: string;
  monHoc?: { tenMon: string };
  trinhDo?: string;
  diaDiem?: string;
  hocVien?: { maHocVien: number };
}

interface UngVien {
  giaSu: {
    maGiaSu: number;
    taiKhoan: { hoTen: string; email: string; viTri: string };
    truongDaiHoc?: string;
    chuyenNganh?: string;
    soNamKinhNghiem?: number;
  };
  yeuCauTimGiaSu: { maYeuCau: number; monHoc?: { tenMon: string } };
  loiNhan?: string;
  mucHocPhiDeXuat?: number;
  trangThai: string;
}

interface ChatMessage {
  id: string;
  from: 'student' | 'tutor';
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

// Tạo giờ hiện tại dạng HH:MM
const nowTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export function StudentApplicantsPage() {
  const { user } = useAuthStore();

  const [allApplicants, setAllApplicants] = useState<(UngVien & { monHoc?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [unreadRooms, setUnreadRooms] = useState<Record<string, number>>({});
  const selectedRoomIdRef = useRef<string | null>(null);

  // ─── State chat ─────────────────────────────────────────────────────────────
  const [selectedApplicant, setSelectedApplicant] = useState<(UngVien & { monHoc?: string }) | null>(null);
  const [chatRooms, setChatRooms] = useState<Record<string, ChatMessage[]>>({});
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
    fetchAll();
  }, []);

  // Update selectedRoomIdRef and clear unread when switching rooms
  useEffect(() => {
    if (selectedApplicant) {
      const roomId = `${selectedApplicant.yeuCauTimGiaSu.maYeuCau}_${selectedApplicant.giaSu.maGiaSu}`;
      selectedRoomIdRef.current = roomId;
      setUnreadRooms(prev => ({ ...prev, [roomId]: 0 }));
    } else {
      selectedRoomIdRef.current = null;
    }
  }, [selectedApplicant]);

  // Cuộn chat xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedApplicant, chatRooms]);

  // ─── Load lịch sử chat khi chọn ứng viên ──────────────────────────────────
  useEffect(() => {
    if (!selectedApplicant) return;
    const roomId = `${selectedApplicant.yeuCauTimGiaSu.maYeuCau}_${selectedApplicant.giaSu.maGiaSu}`;
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
  }, [selectedApplicant]);

  // ─── Kết nối WebSocket ─────────────────────────────────────────────────────
  const stompClientRef = useRef<Client | null>(null);
  const applicantIds = allApplicants.map(uv => `${uv.yeuCauTimGiaSu.maYeuCau}_${uv.giaSu.maGiaSu}`).join(',');

  useEffect(() => {
    if (!user || allApplicants.length === 0) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') + '/ws' 
      : 'http://localhost:8080/ws';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => console.log('[STOMP Student] ', msg),
      onConnect: () => {
        // Đăng ký nhận tin nhắn từ tất cả phòng chat của các ứng viên
        allApplicants.forEach(uv => {
          const roomId = `${uv.yeuCauTimGiaSu.maYeuCau}_${uv.giaSu.maGiaSu}`;
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
                return !(sameText && sameFile);
              });
              
              if (selectedRoomIdRef.current !== roomId && message.from !== 'student') {
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
  }, [applicantIds, user]);

  // Tải tất cả yêu cầu của học viên rồi fetch ứng viên từng yêu cầu
  const fetchAll = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    try {
      // Gọi API mới để lấy tất cả đơn ứng tuyển dành cho Học viên này
      const applicants = await apiClient<UngVien[]>(`/tuyen-dung/danh-sach-ung-tuyen-cho-hoc-vien/${user.userId}`);

      // Bổ sung thông tin tên môn học từ yeuCauTimGiaSu nếu cần
      const formatted = (applicants || []).map(a => ({
        ...a,
        monHoc: a.yeuCauTimGiaSu.monHoc?.tenMon
      }));

      setAllApplicants(formatted);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (uv: UngVien & { monHoc?: string }) => {
    const key = `approve-${uv.giaSu.maGiaSu}`;
    setActionLoading(key);
    try {
      await apiClient('/tuyen-dung/hoc-vien-duyet', {
        method: 'POST',
        params: {
          maHocVien: user?.userId,
          maGiaSu: uv.giaSu.maGiaSu,
          maYeuCau: uv.yeuCauTimGiaSu.maYeuCau,
        },
      });
      await fetchAll();
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể duyệt.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uv: UngVien & { monHoc?: string }) => {
    const key = `reject-${uv.giaSu.maGiaSu}`;
    setActionLoading(key);
    try {
      await apiClient('/tuyen-dung/hoc-vien-tu-choi', {
        method: 'POST',
        params: {
          maHocVien: user?.userId,
          maGiaSu: uv.giaSu.maGiaSu,
          maYeuCau: uv.yeuCauTimGiaSu.maYeuCau,
        },
      });
      await fetchAll();
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể từ chối.'));
    } finally {
      setActionLoading(null);
    }
  };

  const sendMessage = async () => {
    if (!selectedApplicant || !stompClientRef.current?.active) return;
    if (!inputMsg.trim() && !selectedFile) return;
    
    const maGiaSu = selectedApplicant.giaSu.maGiaSu;
    const maYeuCau = selectedApplicant.yeuCauTimGiaSu.maYeuCau;
    const roomId = `${maYeuCau}_${maGiaSu}`;

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

    const newMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      from: 'student',
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
      [roomId]: [...(prev[roomId] || []), newMsg]
    }));

    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(newMsg)
    });
    
    setInputMsg('');
  };

  const handleSendSticker = (stickerUrl: string) => {
    if (!selectedApplicant || !stompClientRef.current?.active) return;
    
    const maGiaSu = selectedApplicant.giaSu.maGiaSu;
    const maYeuCau = selectedApplicant.yeuCauTimGiaSu.maYeuCau;
    const roomId = `${maYeuCau}_${maGiaSu}`;

    const newMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      from: 'student',
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
      [roomId]: [...(prev[roomId] || []), newMsg]
    }));

    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(newMsg)
    });
    
    setShowStickers(false);
  };

  const statusBadge = (s: string) => {
    const status = (s || '').trim().toUpperCase();
    if (status.includes('CHỜ') || status.includes('XÁC NHẬN') || status.includes('CHO')) {
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    if (status.includes('ĐỒNG Ý') || status.includes('DA DUYET') || status.includes('ĐÃ DUYỆT')) {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
    if (status.includes('TỪ CHỐI') || status.includes('TU CHOI')) {
      return 'bg-red-100 text-red-600 border border-red-200';
    }
    return 'bg-slate-100 text-slate-500 border border-slate-200';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải...</p>
      </div>
    );
  }

  const currentRoomId = selectedApplicant 
    ? `${selectedApplicant.yeuCauTimGiaSu.maYeuCau}_${selectedApplicant.giaSu.maGiaSu}` 
    : null;
  const messages = currentRoomId ? (chatRooms[currentRoomId] || []) : [];

  const filteredApplicants = allApplicants.filter((uv) => {
    const term = searchQuery.toLowerCase();
    const name = uv.giaSu.taiKhoan.hoTen?.toLowerCase() || '';
    const mon = uv.monHoc?.toLowerCase() || '';
    return name.includes(term) || mon.includes(term);
  });

  return (
    <div className="font-sans h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gia sư ứng tuyển</h1>
        <p className="text-slate-500 mt-1">Xem, duyệt ứng viên và nhắn tin trực tiếp với gia sư</p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── LEFT PANEL: Danh sách ứng viên ──────────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-800">Ứng viên</span>
              <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {allApplicants.length}
              </span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm gia sư, môn học..."
                className="w-full bg-slate-50 text-sm border border-slate-100 outline-none py-2 pl-9 pr-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredApplicants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <Info className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">{searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có gia sư nào ứng tuyển'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredApplicants.map((uv) => {
                  const isSelected = selectedApplicant?.giaSu.maGiaSu === uv.giaSu.maGiaSu;
                  const approveKey = `approve-${uv.giaSu.maGiaSu}`;
                  const rejectKey = `reject-${uv.giaSu.maGiaSu}`;
                  
                  const status = (uv.trangThai || '').trim().toUpperCase();
                  const isPending = status === 'CHỜ HỌC VIÊN XÁC NHẬN' || 
                                    status === 'CHỜ DUYỆT' || 
                                    status === 'CHO DUYET' ||
                                    (status.includes('CHỜ') && status.includes('XÁC NHẬN'));

                  const roomKey = `${uv.yeuCauTimGiaSu.maYeuCau}_${uv.giaSu.maGiaSu}`;
                  const unreadCount = unreadRooms[roomKey] || 0;
                  const hasUnread = unreadCount > 0;

                  // Last message logic
                  const roomMsgs = chatRooms[roomKey] || [];
                  const lastMsg = roomMsgs[roomMsgs.length - 1];
                  let previewText = "";
                  if (lastMsg) {
                    const mType = lastMsg.fileType || lastMsg.type || 'CHAT';
                    if (mType === 'IMAGE') previewText = lastMsg.fileName === 'sticker.png' ? '[Nhãn dán]' : '[Hình ảnh]';
                    else if (mType === 'FILE') previewText = `[Tệp] ${lastMsg.fileName || 'đính kèm'}`;
                    else previewText = lastMsg.text || 'Tin nhắn mới';
                  } else if (uv.loiNhan) {
                    previewText = `"${uv.loiNhan}"`;
                  } else {
                    previewText = 'Chưa có tin nhắn';
                  }

                  return (
                    <div
                      key={`${uv.giaSu.maGiaSu}-${uv.yeuCauTimGiaSu.maYeuCau}`}
                      onClick={() => setSelectedApplicant(uv)}
                      className={`p-4 cursor-pointer transition-all relative ${
                        isSelected
                          ? 'bg-emerald-50 border-l-4 border-emerald-500'
                          : hasUnread
                          ? 'bg-red-50/60 border-l-4 border-red-400 hover:bg-red-50'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {(uv.giaSu.taiKhoan.hoTen || 'G')[0].toUpperCase()}
                          </div>
                          {hasUnread && !isSelected && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1 shadow-md animate-bounce">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-slate-900 text-sm truncate">{uv.giaSu.taiKhoan.hoTen}</p>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {hasUnread && !isSelected && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {unreadCount} mới
                                </span>
                              )}
                              <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : hasUnread ? 'text-red-400' : 'text-slate-300'}`} />
                            </div>
                          </div>

                          {uv.monHoc && (
                            <p className={`text-xs font-semibold mb-1 ${hasUnread && !isSelected ? 'text-red-500' : 'text-emerald-600'}`}>{uv.monHoc}</p>
                          )}

                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-1">
                            {uv.giaSu.truongDaiHoc && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" /> {uv.giaSu.truongDaiHoc}
                              </span>
                            )}
                            {uv.mucHocPhiDeXuat != null && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <DollarSign className="w-3 h-3" /> {uv.mucHocPhiDeXuat.toLocaleString()}đ/h
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-1">
                            <p className={`text-[11.5px] line-clamp-1 pr-2 flex-1 ${hasUnread && !isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                              {lastMsg && (
                                <span className={lastMsg.from === 'student' ? 'text-slate-400' : 'text-emerald-600 font-medium'}>
                                  {lastMsg.from === 'student' ? 'Bạn: ' : ''}
                                </span>
                              )}
                              {previewText}
                            </p>
                            
                            {isPending ? (
                              <div className="flex gap-2 relative z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(uv);
                                  }}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 text-[10px] font-bold"
                                >
                                  {actionLoading === approveKey
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <CheckCircle2 className="w-3 h-3" />
                                  }
                                  Duyệt
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(uv);
                                  }}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md hover:bg-red-100 transition-all shadow-sm disabled:opacity-50 text-[10px] font-bold"
                                >
                                  {actionLoading === rejectKey
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <XCircle className="w-3 h-3" />
                                  }
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${statusBadge(uv.trangThai)}`}>
                                {uv.trangThai}
                              </span>
                            )}
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

        {/* ── RIGHT PANEL: Chat ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-w-0">
          {selectedApplicant ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-slate-100/80 flex items-center gap-3 bg-gradient-to-r from-white to-emerald-50/30 shrink-0">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-200/50">
                    {(selectedApplicant.giaSu.taiKhoan.hoTen || 'G')[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-[15px]">{selectedApplicant.giaSu.taiKhoan.hoTen}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedApplicant.monHoc && `${selectedApplicant.monHoc} · `}
                    {selectedApplicant.giaSu.chuyenNganh || selectedApplicant.giaSu.truongDaiHoc || 'Gia sư'}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide ${statusBadge(selectedApplicant.trangThai)}`}>
                    {selectedApplicant.trangThai}
                  </span>
                  
                  {((s) => {
                    const status = (s || '').trim().toUpperCase();
                    return status.includes('CHỜ') || status.includes('XÁC NHẬN') || status.includes('CHO');
                  })(selectedApplicant.trangThai) && (
                    <div className="flex gap-2 border-l border-slate-100 pl-3 ml-1">
                      <button
                        onClick={() => handleApprove(selectedApplicant)}
                        disabled={!!actionLoading}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-200/30 active:scale-95 disabled:opacity-50"
                      >
                         {actionLoading === `approve-${selectedApplicant.giaSu.maGiaSu}`
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4" />
                        }
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(selectedApplicant)}
                        disabled={!!actionLoading}
                        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100 shadow-sm active:scale-95 disabled:opacity-50"
                      >
                         {actionLoading === `reject-${selectedApplicant.giaSu.maGiaSu}`
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <XCircle className="w-4 h-4" />
                        }
                        Từ chối
                      </button>
                    </div>
                  )}
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
                      Nhắn tin cho <span className="font-semibold text-emerald-600">{selectedApplicant.giaSu.taiKhoan.hoTen}</span> để trao đổi thêm về lịch học, học phí...
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                {messages.map((msg, index) => {
                  const isMe = msg.from === 'student';
                  const mType = msg.fileType || msg.type || 'CHAT';
                  const fileUrl = msg.fileUrl ? fixUrl(msg.fileUrl) : '';
                  const showAvatar = index === 0 || messages[index - 1]?.from !== msg.from;

                  if (mType === 'JOIN' || mType === 'LEAVE') return null;

                  return (
                    <div key={msg.id || index} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-4' : 'mt-0.5'}`}>
                      {showAvatar ? (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                        }`}>
                          {isMe ? (user?.name?.[0] || 'H').toUpperCase()
                                 : (selectedApplicant.giaSu.taiKhoan.hoTen?.[0] || 'G').toUpperCase()}
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
                        <span className="text-[10px] text-slate-400 px-1.5">{msg.time}</span>
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
                    placeholder={`Nhắn tin với ${selectedApplicant.giaSu.taiKhoan.hoTen}...`}
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
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chọn một gia sư</h3>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Chọn một ứng viên bên trái để bắt đầu trò chuyện hoặc xem thông tin chi tiết
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
