import { useShared } from '../../hooks/useShared';
import { useAuthStore } from '../../store/authStore';
import {
  Calendar, User, BookOpen, Loader2, ChevronRight, Clock, CheckCircle2,
  Edit2, X, Save, Star, MessageSquarePlus, CheckSquare, AlertTriangle,
  PlusCircle, DollarSign, Info, ListChecks, Zap, TrendingUp, Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';
import { Class, BuoiHoc } from '../../hooks/useShared';
import { DanhGiaModal } from '../../components/DanhGiaModal';
import { useDanhGia } from '../../hooks/useDanhGia';

// ── Nút đánh giá ──────────────────────────────────────────────────────────────
function ClassReviewButton({ cls }: { cls: Class }) {
  const { getDanhGiaByLop } = useDanhGia();
  const { data: reviews } = getDanhGiaByLop(cls.maLop);
  const [showModal, setShowModal] = useState(false);
  const existingReview = reviews && reviews.length > 0 ? reviews[0] : null;

  if (cls.trangThai !== 'HOAN_THANH') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100">
        <AlertTriangle className="w-3.5 h-3.5" />
        Chưa hoàn thành
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all
          bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-500 hover:text-white hover:border-amber-500 hover:shadow-lg hover:shadow-amber-100"
      >
        {existingReview ? (
          <>
            <Star className="w-4 h-4 fill-current" />
            <span className="flex items-center gap-1">
              {existingReview.diem}
              <span className="text-amber-400">★</span>
              Đã đánh giá
            </span>
          </>
        ) : (
          <>
            <MessageSquarePlus className="w-4 h-4" />
            Đánh giá ngay
          </>
        )}
      </button>
      {showModal && (
        <DanhGiaModal
          cls={cls}
          existingDanhGia={existingReview}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Parse lịch học ────────────────────────────────────────────────────────────
function parseLichHoc(lich?: string) {
  if (!lich) return { days: [] as number[], timeLabel: '' };
  const l = lich.toLowerCase();
  const days = new Set<number>();

  // Xử lý format "thứ 3,5,7" hoặc "thứ 2, 4, 6" hoặc "thứ 2 thứ 4 thứ 6"
  // Tìm tất cả số ngay sau "thứ" và cả các số tiếp theo được ngăn bởi dấu phẩy/khoảng trắng
  const thuPattern = /thứ\s*([\d](?:[\s,，]*[\d])*)/g;
  let m: RegExpExecArray | null;
  while ((m = thuPattern.exec(l)) !== null) {
    // Split by comma or whitespace to get individual day numbers
    m[1].split(/[,，\s]+/).forEach(s => {
      const n = parseInt(s.trim());
      if (!isNaN(n) && n >= 2 && n <= 7) days.add(n);
    });
  }

  // Cũng xử lý khi "thứ" xuất hiện riêng lẻ (VD: "thứ 2, thứ 4, thứ 6")
  const singlePattern = /thứ\s*(\d)/g;
  while ((m = singlePattern.exec(l)) !== null) {
    const n = parseInt(m[1]);
    if (n >= 2 && n <= 7) days.add(n);
  }

  // Format "t2", "t3"... standalone
  [2, 3, 4, 5, 6, 7].forEach(d => {
    if (new RegExp(`\\bt${d}\\b`).test(l)) days.add(d);
  });

  const numOnlyMatch = l.match(/(?<![a-zA-Z0-9])([2-7])(?![a-zA-Z0-9])/g);
  if (numOnlyMatch) {
    numOnlyMatch.forEach(m => {
      days.add(parseInt(m));
    });
  }

  // Chủ nhật
  if (l.includes('chủ nhật') || l.includes('chu nhat') || /\bcn\b/.test(l)) days.add(1);

  const timeMatch = lich.match(/(\d{1,2}h\d{0,2}\s*[-–]\s*\d{1,2}h\d{0,2})/i)
    || lich.match(/(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/);
  return { days: Array.from(days).sort(), timeLabel: timeMatch ? timeMatch[1] : '' };
}

const DAY_NAMES = ['', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_FULL = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// ── Buổi học tiếp theo ────────────────────────────────────────────────────────
function getNextSession(cls: Class): { dayName: string; daysUntil: number; timeLabel: string } | null {
  const { days, timeLabel } = parseLichHoc(cls.lichHoc);
  if (!days.length || cls.trangThai === 'HOAN_THANH') return null;
  const jsDay = new Date().getDay();
  const sysToday = jsDay === 0 ? 1 : jsDay + 1;
  const upcoming = days
    .map(d => ({ d, diff: ((d - sysToday + 7) % 7) || 7 }))
    .sort((a, b) => a.diff - b.diff)[0];
  return upcoming ? { dayName: DAY_FULL[upcoming.d], daysUntil: upcoming.diff, timeLabel } : null;
}

// ── Nhóm buổi theo tuần ───────────────────────────────────────────────────────
function groupByWeek(sessions: BuoiHoc[]): { label: string; items: BuoiHoc[] }[] {
  if (!sessions.length) return [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  weekStart.setHours(0, 0, 0, 0);
  const groups = new Map<string, BuoiHoc[]>();
  [...sessions].reverse().forEach(s => {
    const diff = Math.floor((weekStart.getTime() - new Date(s.thoiGianBatDau).getTime()) / weekMs);
    const label = diff <= 0 ? 'Tuần này' : diff === 1 ? 'Tuần trước' : `${diff} tuần trước`;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(s);
  });
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

// ── Tab: Thông tin lớp ────────────────────────────────────────────────────────
function InfoTab({ cls, isGiaSu, onEdit }: { cls: Class; isGiaSu: boolean; onEdit: () => void }) {
  const { days, timeLabel } = parseLichHoc(cls.lichHoc);
  const done = cls.tongSoBuoi != null ? (cls.tongSoBuoi - (cls.soBuoiConLai ?? cls.tongSoBuoi)) : 0;
  const pct = cls.tongSoBuoi ? Math.round((done / cls.tongSoBuoi) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Trạng thái + môn */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-emerald-900 text-base">{cls.tenMonHoc || 'Chưa cập nhật'}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Lớp #{cls.maLop}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
          cls.trangThai === 'HOAN_THANH' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {cls.trangThai === 'HOAN_THANH' ? 'Hoàn thành' : 'Đang học'}
        </span>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            {isGiaSu ? 'Học viên' : 'Gia sư'}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 truncate">
              {isGiaSu ? cls.tenHocVien : cls.tenGiaSu}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ngày bắt đầu</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm font-bold text-slate-700">
              {cls.ngayBatDau ? format(new Date(cls.ngayBatDau), 'dd/MM/yyyy') : '—'}
            </p>
          </div>
        </div>

        {cls.hocPhiThoaThuan != null && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Học phí</p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-slate-700">
                {cls.hocPhiThoaThuan.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tiến trình</p>
          <p className="text-sm font-bold text-slate-700">
            {cls.tongSoBuoi ? `${done}/${cls.tongSoBuoi} buổi (${pct}%)` : 'Chưa cài số buổi'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {cls.tongSoBuoi != null && (
        <div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-medium text-right">
            {cls.soBuoiConLai === 0 ? '🎉 Đã hoàn thành tất cả buổi!' : `Còn ${cls.soBuoiConLai} buổi nữa`}
          </p>
        </div>
      )}

      {/* Ghi chú / Dặn dò — hiện trước lịch học để dễ thấy */}
      {cls.ghiChu ? (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              📌 Ghi chú / Dặn dò
            </p>
            {isGiaSu && (
              <button onClick={onEdit} className="flex items-center gap-1 text-xs text-amber-600 font-bold hover:underline">
                <Edit2 className="w-3 h-3" /> Sửa
              </button>
            )}
          </div>
          <p className="text-sm text-amber-800 font-medium whitespace-pre-line leading-relaxed">{cls.ghiChu}</p>
        </div>
      ) : isGiaSu ? (
        <button
          onClick={onEdit}
          className="w-full p-3 rounded-2xl border border-dashed border-amber-200 text-amber-500 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Thêm ghi chú / dặn dò cho học viên
        </button>
      ) : null}

      {/* Lịch học */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Lịch học
          </p>
          {isGiaSu && (
            <button onClick={onEdit} className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline">
              <Edit2 className="w-3 h-3" /> Sửa
            </button>
          )}
        </div>
        {cls.lichHoc ? (
          <>
            <p className="text-sm font-bold text-slate-700 mb-2">{cls.lichHoc}</p>
            {days.length > 0 && (
              <div className="grid grid-cols-7 gap-1">
                {[1,2,3,4,5,6,7].map(d => (
                  <div key={d} className={`text-center py-1.5 rounded-lg text-[10px] font-black ${
                    days.includes(d) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {DAY_NAMES[d]}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400 italic">Chưa cập nhật lịch học</p>
        )}
      </div>

    </div>
  );
}

// ── Tab: Buổi học ─────────────────────────────────────────────────────────────
function BuoiHocTab({ cls, isGiaSu }: { cls: Class; isGiaSu: boolean }) {
  const { getBuoiHocByLop, setCongSoBuoi, hoanThanhBuoi } = useShared();
  const { data: buoiHocs = [], isLoading } = getBuoiHocByLop(cls.maLop);

  const [showAddBuoi, setShowAddBuoi] = useState(false);
  const [themSoBuoi, setThemSoBuoi] = useState('');
  const [confirmDay, setConfirmDay] = useState<string | null>(null);

  const { days: sessionDays, timeLabel } = parseLichHoc(cls.lichHoc);
  const canManage = isGiaSu && cls.trangThai !== 'HOAN_THANH';
  const next = getNextSession(cls);

  const doneSessions = buoiHocs.filter(b => b.trangThai === 'DA_HOC');
  const done = cls.tongSoBuoi != null
    ? (cls.tongSoBuoi - (cls.soBuoiConLai ?? cls.tongSoBuoi))
    : doneSessions.length;
  const pct = cls.tongSoBuoi ? Math.round((done / cls.tongSoBuoi) * 100) : 0;
  const estWeeks = sessionDays.length && cls.soBuoiConLai
    ? Math.ceil(cls.soBuoiConLai / sessionDays.length) : null;
  const estEnd = estWeeks ? new Date(Date.now() + estWeeks * 7 * 86400000) : null;

  const handleThemBuoi = async (e: React.FormEvent) => {
    e.preventDefault();
    const delta = parseInt(themSoBuoi);
    if (isNaN(delta) || delta < 1) return;
    await setCongSoBuoi.mutateAsync({ id: cls.maLop, tongSoBuoi: (cls.tongSoBuoi ?? 0) + delta });
    setThemSoBuoi('');
    setShowAddBuoi(false);
  };

  const handleMarkDone = async () => {
    await hoanThanhBuoi.mutateAsync(cls.maLop);
    setConfirmDay(null);
  };

  const formatDT = (dt: string) => {
    try { return format(new Date(dt), 'EEE, dd/MM · HH:mm', { locale: vi }); }
    catch { return dt; }
  };

  const weekGroups = groupByWeek(doneSessions);
  const jsToday = new Date().getDay();
  const sysToday = jsToday === 0 ? 1 : jsToday + 1;

  return (
    <div className="space-y-5">

      {/* ① Upcoming Session Banner */}
      {next && (
        <div className="relative p-4 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute right-2 -bottom-4 w-12 h-12 rounded-full bg-white/5" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Buổi học tiếp theo</p>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-2xl font-black tracking-tight">{next.dayName}</p>
              <p className="text-sm opacity-90 font-medium mt-0.5">
                {next.daysUntil === 0 ? '🔥 Hôm nay!' : next.daysUntil === 1 ? '⏰ Ngày mai' : `📅 Còn ${next.daysUntil} ngày`}
                {next.timeLabel && <span className="ml-2 opacity-70">· {next.timeLabel}</span>}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Zap className="w-7 h-7" />
            </div>
          </div>
        </div>
      )}

      {/* ② Progress Stats Card */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tiến trình học</p>
            <p className="text-3xl font-black text-slate-800 leading-none">
              {done}
              <span className="text-lg font-bold text-slate-300">/{cls.tongSoBuoi ?? '?'}</span>
              <span className="text-xs font-bold text-slate-400 ml-1.5">buổi</span>
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => { setShowAddBuoi(!showAddBuoi); setThemSoBuoi(''); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Thêm buổi
            </button>
          )}
        </div>
        {cls.tongSoBuoi != null && (
          <>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold">
              <span className="text-slate-400">
                {cls.soBuoiConLai === 0 ? '🎉 Đã hoàn thành tất cả!' : `Còn ${cls.soBuoiConLai} buổi nữa`}
              </span>
              {estEnd && (
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Target className="w-3 h-3" />
                  Dự kiến xong {format(estEnd, 'dd/MM/yyyy')}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Form thêm buổi */}
      {showAddBuoi && canManage && (
        <form onSubmit={handleThemBuoi} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
          <p className="text-xs font-bold text-emerald-700">
            Muốn thêm bao nhiêu buổi?
            {cls.tongSoBuoi && <span className="font-normal text-emerald-600 ml-1">(Hiện tại: {cls.tongSoBuoi} · Đã dạy: {done})</span>}
          </p>
          <div className="flex gap-2">
            <input
              type="number" min={1} placeholder="Số buổi thêm (VD: 2)"
              value={themSoBuoi} onChange={e => setThemSoBuoi(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button type="submit" disabled={setCongSoBuoi.isPending}
              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
              {setCongSoBuoi.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Lưu
            </button>
            <button type="button" onClick={() => setShowAddBuoi(false)}
              className="p-2 hover:bg-red-50 hover:text-red-400 rounded-lg text-slate-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {themSoBuoi && parseInt(themSoBuoi) > 0 && cls.tongSoBuoi && (
            <p className="text-[10px] text-emerald-600 font-medium bg-emerald-100 px-3 py-1.5 rounded-lg">
              ✅ {cls.tongSoBuoi} + {themSoBuoi} = <strong>{cls.tongSoBuoi + parseInt(themSoBuoi)} buổi</strong>
              {' '}· Còn lại: <strong>{(cls.soBuoiConLai ?? 0) + parseInt(themSoBuoi)} buổi</strong>
            </p>
          )}
        </form>
      )}

      {/* ③ Lưới ngày học — bấm hoàn thành */}
      {canManage && (
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Bấm ngày học → ghi nhận đã dạy
            {timeLabel && <span className="text-slate-400 font-normal normal-case ml-1">· {timeLabel}</span>}
          </p>
          {sessionDays.length > 0 ? (
            <div className="grid grid-cols-7 gap-1.5">
              {[1,2,3,4,5,6,7].map(d => {
                const isSession = sessionDays.includes(d);
                const noMore = cls.tongSoBuoi != null && (cls.soBuoiConLai ?? 0) <= 0;
                const disabled = !isSession || noMore || hoanThanhBuoi.isPending;
                const isToday = d === sysToday;
                return (
                  <button key={d}
                    disabled={disabled}
                    onClick={() => isSession && !noMore && setConfirmDay(DAY_FULL[d])}
                    title={isSession ? (noMore ? 'Hết buổi' : `Ghi nhận buổi ${DAY_FULL[d]}`) : DAY_NAMES[d]}
                    className={`relative flex flex-col items-center justify-center py-3 rounded-2xl text-[11px] font-black transition-all select-none
                      ${isSession && !noMore
                        ? isToday
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 hover:scale-105 active:scale-95 ring-2 ring-offset-1 ring-emerald-400'
                          : 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600 hover:scale-105 active:scale-95'
                        : noMore && isSession
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-300 cursor-default'
                      }`}
                  >
                    {isToday && isSession && !noMore && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                    )}
                    <span>{DAY_NAMES[d]}</span>
                    {isSession && <span className="w-1.5 h-1.5 rounded-full bg-white/70 mt-1" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
              ⚠️ Chưa xác định được lịch học. Hãy cập nhật (VD: "Thứ 2, 4, 6 19h-21h").
            </div>
          )}
        </div>
      )}

      {/* Confirm popup */}
      {confirmDay && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <p className="text-sm font-bold text-emerald-800">✅ Xác nhận hoàn thành buổi {confirmDay}?</p>
          <p className="text-xs text-emerald-600">
            Còn lại: <span className="font-bold">{cls.soBuoiConLai}</span> → <span className="font-bold">{(cls.soBuoiConLai ?? 1) - 1}</span>
          </p>
          <div className="flex gap-2">
            <button onClick={handleMarkDone} disabled={hoanThanhBuoi.isPending}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {hoanThanhBuoi.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Xác nhận
            </button>
            <button onClick={() => setConfirmDay(null)}
              className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ④ Session Timeline */}
      <div>
        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Lịch sử ({doneSessions.length} buổi đã học)
        </p>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /></div>
        ) : doneSessions.length === 0 ? (
          <div className="text-center py-6 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <TrendingUp className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-xs text-slate-400">Chưa có buổi nào được hoàn thành</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {weekGroups.map(({ label, items }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
                  <span className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="relative pl-5">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-emerald-100 rounded-full" />
                  <div className="space-y-2">
                    {items.map((b) => {
                      const num = doneSessions.length - doneSessions.indexOf(b);
                      return (
                        <div key={b.maBuoi} className="flex items-start gap-3">
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200 shrink-0 mt-1.5 z-10" />
                          <div className="flex-1 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-emerald-100 transition-colors">
                            <p className="text-xs font-black text-slate-700">Buổi {num}</p>
                            <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {formatDT(b.thoiGianBatDau)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal chi tiết lớp học ────────────────────────────────────────────────────
function ClassDetailModal({
  cls, isGiaSu, onClose,
  onKetThuc, isKetThucPending
}: {
  cls: Class;
  isGiaSu: boolean;
  onClose: () => void;
  onKetThuc: () => void;
  isKetThucPending: boolean;
}) {
  const [tab, setTab] = useState<'info' | 'buoi'>('info');
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [scheduleInput, setScheduleInput] = useState(cls.lichHoc || '');
  const [noteInput, setNoteInput] = useState(cls.ghiChu || '');
  const { updateSchedule } = useShared();

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSchedule.mutateAsync({ id: cls.maLop, lichHoc: scheduleInput, ghiChu: noteInput });
    setShowEditSchedule(false);
  };

  const TABS = [
    { id: 'info', label: 'Thông tin', icon: Info },
    { id: 'buoi', label: 'Buổi học', icon: ListChecks },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right-8 duration-300 flex flex-col border-l border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <div>
            <h3 className="text-lg font-black text-slate-900">Chi tiết lớp học</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {cls.tenMonHoc} · Lớp #{cls.maLop}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-white sticky top-[73px] z-10">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'info' | 'buoi')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                tab === t.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 flex-1">
          {tab === 'info' && !showEditSchedule && (
            <InfoTab cls={cls} isGiaSu={isGiaSu} onEdit={() => setShowEditSchedule(true)} />
          )}

          {tab === 'info' && showEditSchedule && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setShowEditSchedule(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <h4 className="font-bold text-slate-800">Cập nhật lịch học</h4>
              </div>
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Lịch học mong muốn của học viên
                  </label>
                  <textarea
                    autoFocus rows={3}
                    placeholder="VD: Thứ 2, 4, 6 (19h30 - 21h00)"
                    value={scheduleInput}
                    onChange={e => setScheduleInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-slate-900 font-medium resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Ghi chú / Dặn dò</label>
                  <textarea
                    rows={3}
                    placeholder="Nhắc học viên bài mới, chuẩn bị kiểm tra..."
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-emerald-900 font-medium resize-none"
                  />
                </div>
                {/* Preview lịch */}
                {scheduleInput && (() => {
                  const { days } = parseLichHoc(scheduleInput);
                  return days.length > 0 ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 font-bold mb-2 uppercase tracking-wider">Preview lịch tuần</p>
                      <div className="grid grid-cols-7 gap-1">
                        {[1,2,3,4,5,6,7].map(d => (
                          <div key={d} className={`text-center py-1.5 rounded-lg text-[10px] font-black ${
                            days.includes(d) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                          }`}>
                            {DAY_NAMES[d]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEditSchedule(false)}
                    className="flex-1 py-3 font-bold rounded-xl border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
                    Hủy
                  </button>
                  <button type="submit" disabled={updateSchedule.isPending}
                    className="flex-1 py-3 font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex justify-center items-center gap-2 transition-all disabled:opacity-70">
                    {updateSchedule.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lưu lịch
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'buoi' && <BuoiHocTab cls={cls} isGiaSu={isGiaSu} />}
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 border-t border-slate-100 space-y-3">
          {isGiaSu && cls.trangThai !== 'HOAN_THANH' && (
            <button
              onClick={onKetThuc}
              disabled={isKetThucPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100 disabled:opacity-50"
            >
              {isKetThucPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
              Kết thúc lớp học
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Agenda View (Mobile) ─────────────────────────────────────────────────────
function AgendaView({
  classes, today, setSelectedClass, isGiaSu,
}: {
  classes?: Class[];
  today: Date;
  setSelectedClass: (cls: Class) => void;
  isGiaSu: boolean;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm divide-y divide-slate-50">
      {days.map(day => {
        const jsDay = day.getDay();
        const sysDay = jsDay === 0 ? 1 : jsDay + 1;
        const isToday = day.toDateString() === today.toDateString();
        const dayClasses = classes?.filter(cls => {
          if (cls.trangThai === 'HOAN_THANH') return false;
          const { days: sDs } = parseLichHoc(cls.lichHoc);
          return sDs.includes(sysDay);
        }) || [];

        if (!isToday && dayClasses.length === 0) return null;

        return (
          <div key={day.toDateString()} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${isToday ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isToday ? '🟢 Hôm nay' : DAY_FULL[sysDay]}
              </span>
              <span className={`text-xs font-medium ${isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                · {format(day, 'dd/MM')}
              </span>
            </div>
            {dayClasses.length === 0 ? (
              <p className="text-xs text-slate-300 italic pl-4 pb-1">Không có lịch học</p>
            ) : (
              <div className="space-y-2 pl-2">
                {dayClasses.map(cls => {
                  const { timeLabel } = parseLichHoc(cls.lichHoc);
                  return (
                    <div
                      key={cls.maLop}
                      onClick={() => setSelectedClass(cls)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                        isToday
                          ? 'bg-white border-emerald-100 border-l-[3px] border-l-emerald-500'
                          : 'bg-slate-50 border-slate-100 border-l-[3px] border-l-slate-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isToday ? 'text-slate-800' : 'text-slate-600'}`}>
                          {cls.tenMonHoc}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5 flex-wrap">
                          {timeLabel && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeLabel}</span>}
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{isGiaSu ? cls.tenHocVien : cls.tenGiaSu}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MyClassesPage() {
  const { user } = useAuthStore();
  const { getMyClasses, updateStatus } = useShared();

  const { data: classes, isLoading } = getMyClasses();

  const sortedClasses = React.useMemo(() => {
    if (!classes) return [];
    return [...classes].sort((a, b) => {
      if (a.trangThai === 'HOAN_THANH' && b.trangThai !== 'HOAN_THANH') return 1;
      if (a.trangThai !== 'HOAN_THANH' && b.trangThai === 'HOAN_THANH') return -1;
      return 0;
    });
  }, [classes]);

  const [view, setView] = useState<'list' | 'schedule'>('list');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isGiaSu = user?.role === 'GIA_SU';

  const handleKetThucLop = async (cls: Class) => {
    if (!window.confirm(`Bạn có chắc muốn kết thúc lớp "${cls.tenMonHoc}"?`)) return;
    try {
      await updateStatus.mutateAsync({ id: cls.maLop, status: 'HOAN_THANH' });
      setSelectedClass(null);
    } catch {
      alert('Không thể cập nhật trạng thái lớp học.');
    }
  };

  const today = new Date();
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { name, dateStr: format(d, 'dd/MM') };
  });

  // Tìm class mới nhất từ cache nếu có (để modal cập nhật sau khi mutate)
  const currentSelectedClass = selectedClass
    ? (classes?.find(c => c.maLop === selectedClass.maLop) ?? selectedClass)
    : null;

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Lớp học của tôi</h1>
          <p className="text-slate-500 text-lg">Quản lý lộ trình học tập và thanh toán</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start">
          <button
            onClick={() => setView('list')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === 'list' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Danh sách
          </button>
          <button
            onClick={() => setView('schedule')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              view === 'schedule' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Lịch học
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Đang tải dữ liệu lớp học...</p>
        </div>
      ) : (
        <>
          {view === 'list' ? (
            <div className="grid grid-cols-1 gap-6">
              {sortedClasses.map((cls) => {
                const done = cls.tongSoBuoi != null ? (cls.tongSoBuoi - (cls.soBuoiConLai ?? cls.tongSoBuoi)) : 0;
                const pct = cls.tongSoBuoi ? Math.round((done / cls.tongSoBuoi) * 100) : 0;
                const { days } = parseLichHoc(cls.lichHoc);

                return (
                  <div
                    key={cls.maLop}
                    onClick={() => setSelectedClass(cls)}
                    className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative">
                      {/* Left: môn + lịch + progress */}
                      <div className="flex items-start gap-5 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          cls.trangThai === 'HOAN_THANH' ? 'bg-blue-50' : 'bg-emerald-50'
                        }`}>
                          <BookOpen className={`w-7 h-7 ${cls.trangThai === 'HOAN_THANH' ? 'text-blue-500' : 'text-emerald-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{cls.tenMonHoc || 'Chưa cập nhật'}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              cls.trangThai === 'HOAN_THANH' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {cls.trangThai === 'HOAN_THANH' ? 'Hoàn thành' : 'Đang học'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {isGiaSu ? cls.tenHocVien : cls.tenGiaSu}
                            </span>
                            {cls.lichHoc && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {cls.lichHoc}
                              </span>
                            )}
                          </div>
                          {/* Mini lịch tuần */}
                          {days.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {[1,2,3,4,5,6,7].map(d => (
                                <span key={d} className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  days.includes(d) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                                }`}>
                                  {DAY_NAMES[d]}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Progress */}
                          {cls.tongSoBuoi != null && (
                            <div className="flex items-center gap-3 mt-2.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                {done}/{cls.tongSoBuoi} buổi
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                        {user?.role === 'HOC_VIEN' && <ClassReviewButton cls={cls} />}
                        <button
                          onClick={() => setSelectedClass(cls)}
                          className="bg-slate-50 p-3.5 rounded-2xl text-slate-400 hover:bg-emerald-600 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-emerald-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : isMobile ? (
            <AgendaView
              classes={classes}
              today={today}
              setSelectedClass={setSelectedClass}
              isGiaSu={isGiaSu}
            />
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="flex border-b border-slate-100 bg-slate-50 sticky top-0 z-20">
                <div className="w-[80px] md:w-[100px] shrink-0 border-r border-slate-100 bg-white flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1 grid grid-cols-7">
                  {weekDays.map(day => {
                    const isToday = day.dateStr === format(today, 'dd/MM');
                    return (
                      <div key={day.name} className={`relative text-center py-2 border-r border-slate-100 last:border-r-0 flex flex-col justify-center pb-3 ${
                        isToday ? 'bg-emerald-50' : ''
                      }`}>
                        {isToday && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Hôm nay</span>}
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${
                          isToday ? 'text-emerald-600' : 'text-slate-500'
                        }`}>{day.name}</span>
                        <span className={`text-[10px] font-bold mt-0.5 ${
                          isToday ? 'text-emerald-500' : 'text-slate-400'
                        }`}>{day.dateStr}</span>
                        {isToday && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col bg-slate-50/30 overflow-y-auto">
                {[
                  { id: 'Sáng', label: 'Sáng', desc: '07:00 - 11:30' },
                  { id: 'Chiều', label: 'Chiều', desc: '13:00 - 17:30' },
                  { id: 'Tối', label: 'Tối', desc: '18:00 - 22:00' },
                  { id: 'Khác', label: 'Khác', desc: 'Chưa rõ giờ' }
                ].map((slot) => {
                  const classesInSlot = classes?.filter(cls => {
                    if (cls.trangThai === 'HOAN_THANH') return false;
                    if (!cls.lichHoc) return slot.id === 'Khác';
                    const l = cls.lichHoc.toLowerCase();
                    let timeSlot = 'Khác';
                    const matchHour = l.match(/(\d{1,2})(?:h|:)/);
                    if (l.includes('sáng')) timeSlot = 'Sáng';
                    else if (l.includes('chiều')) timeSlot = 'Chiều';
                    else if (l.includes('tối')) timeSlot = 'Tối';
                    else if (matchHour) {
                      const hour = parseInt(matchHour[1]);
                      if (hour >= 5 && hour <= 12) timeSlot = 'Sáng';
                      else if (hour > 12 && hour < 18) timeSlot = 'Chiều';
                      else if (hour >= 18 || hour < 5) timeSlot = 'Tối';
                    }
                    return timeSlot === slot.id;
                  }) || [];

                  if (slot.id === 'Khác' && classesInSlot.length === 0) return null;

                  return (
                    <div key={slot.id} className="flex border-b border-slate-100 last:border-b-0 min-h-[140px] group">
                      <div className="w-[80px] md:w-[100px] shrink-0 border-r border-slate-100 bg-white p-2 flex flex-col items-center justify-center text-center group-hover:bg-slate-50 transition-colors">
                        <span className="font-black text-slate-700 text-xs md:text-sm">{slot.label}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1">{slot.desc}</span>
                      </div>

                      <div className="flex-1 grid grid-cols-7">
                        {['2', '3', '4', '5', '6', '7', 'cn'].map((dayKey) => {
                          const cellClasses = classesInSlot.filter(cls => {
                            if (!cls.lichHoc) return false;
                            const l = cls.lichHoc.toLowerCase();
                            if (dayKey === 'cn') return l.includes('cn') || l.includes('chủ nhật');
                            return l.includes(`thứ ${dayKey}`) || l.includes(`t${dayKey}`) || l.match(new RegExp(`\\b${dayKey}\\b`));
                          });

                          return (
                            <div key={`${slot.id}-${dayKey}`} className="border-r border-slate-100 last:border-r-0 p-1.5 md:p-2.5 flex flex-col gap-2 hover:bg-emerald-50/30 transition-colors">
                              {cellClasses.map((cls, i) => (
                                <div
                                  key={`${cls.maLop}-${i}`}
                                  onClick={() => setSelectedClass(cls)}
                                  className={`bg-white rounded-xl p-2 md:p-3 border shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] border-l-[3px] hover:shadow-lg transition-all cursor-pointer group/card ${
                                    cls.ghiChu
                                      ? 'border-amber-100 border-l-amber-400 hover:border-amber-300'
                                      : 'border-emerald-100 border-l-emerald-500 hover:border-emerald-300'
                                  }`}
                                >
                                  <h4 className="font-bold text-emerald-800 text-[10px] md:text-xs mb-1 md:mb-1.5 leading-tight group-hover/card:text-emerald-600 transition-colors line-clamp-2">
                                    {cls.tenMonHoc || 'Môn học'}
                                  </h4>
                                  <p className="text-[9px] md:text-[10px] font-medium text-slate-500 leading-relaxed truncate">
                                    {cls.lichHoc}
                                  </p>
                                  {cls.tongSoBuoi && (
                                    <p className="text-[9px] font-bold text-emerald-600 mt-1">
                                      Còn {cls.soBuoiConLai}/{cls.tongSoBuoi} buổi
                                    </p>
                                  )}
                                  {cls.ghiChu && (
                                    <div className="mt-1.5 pt-1.5 border-t border-amber-100">
                                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-wide mb-0.5">📌 Dặn dò</p>
                                      <p className="text-[9px] md:text-[10px] text-amber-700 font-medium leading-snug line-clamp-2">
                                        {cls.ghiChu}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {classes?.length === 0 && (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lớp học nào</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Hãy tìm kiếm gia sư và bắt đầu hành trình học tập của bạn ngay hôm nay!</p>
            </div>
          )}

          {/* Modal chi tiết lớp học */}
          {currentSelectedClass && (
            <ClassDetailModal
              cls={currentSelectedClass}
              isGiaSu={isGiaSu}
              onClose={() => setSelectedClass(null)}
              onKetThuc={() => handleKetThucLop(currentSelectedClass)}
              isKetThucPending={updateStatus.isPending}
            />
          )}
        </>
      )}
    </div>
  );
}
