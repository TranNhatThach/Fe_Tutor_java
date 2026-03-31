import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  Loader2, CheckCircle2, XCircle, Clock, DollarSign,
  GraduationCap, Send, Info, ChevronRight, BookOpen, User
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
}

// Tạo giờ hiện tại dạng HH:MM
const nowTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export function StudentApplicantsPage() {
  const { user } = useAuthStore();

  // ─── State danh sách ứng viên ───────────────────────────────────────────────
  const [allApplicants, setAllApplicants] = useState<(UngVien & { monHoc?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── State chat ─────────────────────────────────────────────────────────────
  const [selectedApplicant, setSelectedApplicant] = useState<(UngVien & { monHoc?: string }) | null>(null);
  const [chatRooms, setChatRooms] = useState<Record<string, ChatMessage[]>>({});
  const [inputMsg, setInputMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

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
              // Tránh duplicate
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

  const sendMessage = () => {
    if (!inputMsg.trim() || !selectedApplicant || !stompClientRef.current?.active) return;
    
    const maGiaSu = selectedApplicant.giaSu.maGiaSu;
    const maYeuCau = selectedApplicant.yeuCauTimGiaSu.maYeuCau;
    const roomId = `${maYeuCau}_${maGiaSu}`;

    const newMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      from: 'student',
      text: inputMsg.trim(),
      time: nowTime(),
      senderId: user?.userId,
      senderName: user?.name,
    };

    // Gửi tin nhắn lên WebSocket (server sẽ lưu DB rồi broadcast lại)
    stompClientRef.current.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(newMsg)
    });
    
    setInputMsg('');
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

  return (
    <div className="font-sans h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gia sư ứng tuyển</h1>
        <p className="text-slate-500 mt-1">Xem, duyệt ứng viên và nhắn tin trực tiếp với gia sư</p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── LEFT PANEL: Danh sách ứng viên ──────────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800">Ứng viên</span>
            <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {allApplicants.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {allApplicants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <Info className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">Chưa có gia sư nào ứng tuyển</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {allApplicants.map((uv) => {
                  const isSelected = selectedApplicant?.giaSu.maGiaSu === uv.giaSu.maGiaSu;
                  const approveKey = `approve-${uv.giaSu.maGiaSu}`;
                  const rejectKey = `reject-${uv.giaSu.maGiaSu}`;
                  
                  const status = (uv.trangThai || '').trim().toUpperCase();
                  const isPending = status === 'CHỜ HỌC VIÊN XÁC NHẬN' || 
                                    status === 'CHỜ DUYỆT' || 
                                    status === 'CHO DUYET' ||
                                    (status.includes('CHỜ') && status.includes('XÁC NHẬN'));

                  return (
                    <div
                      key={`${uv.giaSu.maGiaSu}-${uv.yeuCauTimGiaSu.maYeuCau}`}
                      onClick={() => setSelectedApplicant(uv)}
                      className={`p-4 cursor-pointer transition-all ${isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-sm">
                          {(uv.giaSu.taiKhoan.hoTen || 'G')[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-slate-900 text-sm truncate">{uv.giaSu.taiKhoan.hoTen}</p>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                          </div>

                          {uv.monHoc && (
                            <p className="text-xs text-emerald-600 font-semibold mb-1">{uv.monHoc}</p>
                          )}

                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-2">
                            {uv.giaSu.truongDaiHoc && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" /> {uv.giaSu.truongDaiHoc}
                              </span>
                            )}
                            {uv.giaSu.soNamKinhNghiem != null && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {uv.giaSu.soNamKinhNghiem} năm KN
                              </span>
                            )}
                            {uv.mucHocPhiDeXuat != null && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <DollarSign className="w-3 h-3" /> {uv.mucHocPhiDeXuat.toLocaleString()}đ/h
                              </span>
                            )}
                          </div>

                          {uv.loiNhan && (
                            <p className="text-xs text-slate-500 italic line-clamp-1 mb-2">"{uv.loiNhan}"</p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(uv.trangThai)}`}>
                              {uv.trangThai}
                            </span>

                            {/* Nút duyệt / từ chối */}
                            {isPending && (
                              <div className="flex gap-2 relative z-10" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(uv);
                                  }}
                                  disabled={!!actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[10px] font-bold"
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
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[10px] font-bold"
                                >
                                  {actionLoading === rejectKey
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <XCircle className="w-3 h-3" />
                                  }
                                  Từ chối
                                </button>
                              </div>
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
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {(selectedApplicant.giaSu.taiKhoan.hoTen || 'G')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{selectedApplicant.giaSu.taiKhoan.hoTen}</p>
                  <p className="text-xs text-slate-400">
                    {selectedApplicant.monHoc && `Môn: ${selectedApplicant.monHoc} · `}
                    {selectedApplicant.giaSu.chuyenNganh || selectedApplicant.giaSu.truongDaiHoc || 'Gia sư'}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge(selectedApplicant.trangThai)}`}>
                    {selectedApplicant.trangThai}
                  </span>
                  
                  {/* Action buttons in right chat header */}
                  {((s) => {
                    const status = (s || '').trim().toUpperCase();
                    return status.includes('CHỜ') || status.includes('XÁC NHẬN') || status.includes('CHO');
                  })(selectedApplicant.trangThai) && (
                    <div className="flex gap-2 border-l border-slate-100 pl-3 ml-1">
                      <button
                        onClick={() => handleApprove(selectedApplicant)}
                        disabled={!!actionLoading}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
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
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/40">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
                      <Send className="w-7 h-7 text-emerald-400" />
                    </div>
                    <p className="font-bold text-slate-700 mb-1">Bắt đầu cuộc trò chuyện</p>
                    <p className="text-sm text-slate-400">
                      Nhắn tin cho <span className="font-semibold">{selectedApplicant.giaSu.taiKhoan.hoTen}</span> để trao đổi thêm về lịch học, học phí...
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.from === 'student';
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(selectedApplicant.giaSu.taiKhoan.hoTen || 'G')[0].toUpperCase()}
                        </div>
                      )}
                      {isMe && (
                        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
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
                    placeholder={`Nhắn tin với ${selectedApplicant.giaSu.taiKhoan.hoTen}...`}
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
            /* Trạng thái chưa chọn */
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6">
                <Send className="w-9 h-9 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chọn một gia sư</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                Chọn một ứng viên bên trái để bắt đầu trò chuyện hoặc xem thông tin chi tiết
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
