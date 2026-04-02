import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  Mail, BookOpen, MapPin, DollarSign, Clock, Loader2,
  CheckCircle2, XCircle, Info, MessageSquare, User
} from 'lucide-react';

interface UngTuyen {
  giaSu: { maGiaSu: number };
  yeuCauTimGiaSu: {
    maYeuCau: number;
    moTa?: string;
    trangThai?: string;
    monHoc?: { tenMon: string };
    trinhDo?: string;
    diaDiem?: string;
    hinhThuc?: string;
    nganSachMin?: number;
    nganSachMax?: number;
    hocVien?: {
      maHocVien: number;
      taiKhoan: { hoTen: string; email: string };
    };
  };
  loiNhan?: string;
  mucHocPhiDeXuat?: number;
  trangThai: string;
  ngayUngTuyen?: string;
}

const statusStyle = (s: string) => {
  if (!s) return 'bg-slate-100 text-slate-500';
  const upper = s.toUpperCase();
  if (upper.includes('ĐỒNG Ý') || upper.includes('DONG Y') || upper.includes('ĐÃ DUYỆT')) return 'bg-emerald-100 text-emerald-700';
  if (upper.includes('TỪ CHỐI') || upper.includes('TU CHOI')) return 'bg-red-100 text-red-600';
  return 'bg-amber-100 text-amber-700'; // Chờ xử lý
};

export function TutorInvitationsPage() {
  const { user } = useAuthStore();
  const [invitations, setInvitations] = useState<UngTuyen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { fetchInvitations(); }, []);

  const fetchInvitations = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    try {
      // GET /api/tuyen-dung/loi-moi/{maGiaSu}
      const data = await apiClient<UngTuyen[]>(`/tuyen-dung/loi-moi/${user.userId}`);
      setInvitations(data || []);
    } catch (err) {
      console.error('Lỗi tải lời mời:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (maYeuCau: number) => {
    setActionLoading(maYeuCau);
    setSuccessMsg(''); setErrorMsg('');
    try {
      await apiClient('/tuyen-dung/gia-su-dong-y', {
        method: 'POST',
        params: { maGiaSu: user?.userId, maYeuCau },
      });
      setSuccessMsg('Đã đồng ý lời mời! Lớp học đã được tạo.');
      await fetchInvitations();
    } catch (err: any) {
      setErrorMsg('Lỗi: ' + (err.message || 'Không thể đồng ý.'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (maYeuCau: number) => {
    setActionLoading(maYeuCau * -1);
    setSuccessMsg(''); setErrorMsg('');
    try {
      await apiClient('/tuyen-dung/gia-su-tu-choi', {
        method: 'POST',
        params: { maGiaSu: user?.userId, maYeuCau },
      });
      setSuccessMsg('Đã từ chối lời mời.');
      await fetchInvitations();
    } catch (err: any) {
      setErrorMsg('Lỗi: ' + (err.message || 'Không thể từ chối.'));
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải lời mời...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Mail className="w-8 h-8 text-emerald-600" /> Lời mời dạy học
        </h1>
        <p className="text-slate-500 text-lg mt-1">
          Các lời mời từ học viên muốn mời bạn dạy trực tiếp
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-medium">
          <XCircle className="w-5 h-5 shrink-0" /> {errorMsg}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Info className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lời mời nào</h3>
          <p className="text-slate-500">Học viên chưa gửi lời mời trực tiếp cho bạn.</p>
          <p className="text-slate-400 text-sm mt-1">Hãy hoàn thiện hồ sơ để được chú ý hơn!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const yc = inv.yeuCauTimGiaSu;
            const hocVienName = yc.hocVien?.taiKhoan?.hoTen || 'Học viên';
            const isAccepting = actionLoading === yc.maYeuCau;
            const isRejecting = actionLoading === yc.maYeuCau * -1;
            const isPending = !inv.trangThai?.toUpperCase().includes('DONG Y')
                           && !inv.trangThai?.toUpperCase().includes('ĐỒNG Ý')
                           && !inv.trangThai?.toUpperCase().includes('TU CHOI')
                           && !inv.trangThai?.toUpperCase().includes('TỪ CHỐI');

            return (
              <div key={yc.maYeuCau} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start gap-5">
                  {/* Avatar học viên */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm">
                    {hocVienName[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {yc.monHoc?.tenMon || 'Môn học'}
                      </h3>
                      {yc.trinhDo && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-full">
                          {yc.trinhDo}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ml-auto ${statusStyle(inv.trangThai)}`}>
                        {inv.trangThai || 'Chờ duyệt'}
                      </span>
                    </div>

                    <p className="text-sm text-blue-600 font-semibold mb-2">
                      <User className="w-3.5 h-3.5 inline mr-1" />
                      {hocVienName}
                      {yc.hocVien?.taiKhoan?.email && (
                        <span className="text-slate-400 font-normal ml-2">{yc.hocVien.taiKhoan.email}</span>
                      )}
                    </p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 mb-3">
                      {yc.hinhThuc && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {yc.hinhThuc}
                        </span>
                      )}
                      {yc.diaDiem && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {yc.diaDiem}
                        </span>
                      )}
                      {(yc.nganSachMin != null || yc.nganSachMax != null) && (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <DollarSign className="w-3 h-3" />
                          {(() => {
                            const min = yc.nganSachMin;
                            const max = yc.nganSachMax;
                            if (min != null && max != null) {
                              const trueMin = Math.min(min, max);
                              const trueMax = Math.max(min, max);
                              return `${trueMin.toLocaleString()}đ – ${trueMax.toLocaleString()}đ/giờ`;
                            } else if (min != null) {
                              return `Từ ${min.toLocaleString()}đ/giờ`;
                            } else if (max != null) {
                              return `Đến ${max.toLocaleString()}đ/giờ`;
                            }
                            return '?/giờ';
                          })()}
                        </span>
                      )}
                    </div>

                    {yc.moTa && (
                      <p className="text-sm text-slate-500 italic bg-slate-50 px-4 py-2.5 rounded-xl border border-dashed border-slate-200 mb-3 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        {yc.moTa}
                      </p>
                    )}

                    {/* Nút action */}
                    {isPending && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(yc.maYeuCau)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-60 text-sm"
                        >
                          {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Đồng ý dạy
                        </button>
                        <button
                          onClick={() => handleReject(yc.maYeuCau)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-all disabled:opacity-60 text-sm"
                        >
                          {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
