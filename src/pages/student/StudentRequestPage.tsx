import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import {
  Plus, BookOpen, MapPin, DollarSign, Clock, Calendar,
  Loader2, X, ChevronDown, Info, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';

interface MonHoc {
  maMon: number;
  tenMon: string;
}

interface YeuCau {
  maYeuCau: number;
  moTa: string;
  trangThai: string;
  monHoc?: { tenMon: string };
  trinhDo?: string;
  diaDiem?: string;
  hinhThuc?: string;
  lichHocDuKien?: string;
  nganSachMin?: number;
  nganSachMax?: number;
  ngayTao?: string;
  hocVien?: { maHocVien: number };
}

const TRINH_DO_OPTIONS = ['Tiểu học', 'THCS', 'THPT', 'Đại học', 'Người đi làm'];
const HINH_THUC_OPTIONS = ['Tại nhà', 'Online', 'Cả hai'];

const defaultForm = {
  tenMon: '',
  trinhDo: '',
  lichHocDuKien: '',
  hinhThuc: '',
  diaDiem: '',
  nganSachMin: '',
  nganSachMax: '',
  moTa: '',
};

export function StudentRequestPage() {
  const { user } = useAuthStore();
  const [monHocList, setMonHocList] = useState<MonHoc[]>([]);
  const [yeuCauList, setYeuCauList] = useState<YeuCau[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [monHocs, myRequests] = await Promise.all([
        apiClient<MonHoc[]>('/mon-hoc'),
        user?.userId ? apiClient<YeuCau[]>(`/danh-sach-yeu-cau/${user.userId}`) : Promise.resolve([]),
      ]);
      setMonHocList(monHocs || []);
      setYeuCauList(myRequests || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) {
      setErrorMsg('Không xác định được tài khoản. Vui lòng đăng nhập lại.');
      return;
    }
    if (!form.tenMon.trim()) {
      setErrorMsg('Vui lòng nhập môn học.');
      return;
    }
    const min = form.nganSachMin ? parseInt(form.nganSachMin) : null;
    const max = form.nganSachMax ? parseInt(form.nganSachMax) : null;

    if (min !== null && min < 0) {
      setErrorMsg('Ngân sách không thể là số âm.');
      return;
    }
    if (max !== null && max < 0) {
      setErrorMsg('Ngân sách không thể là số âm.');
      return;
    }
    if (min !== null && max !== null && min > max) {
      setErrorMsg('Ngân sách tối đa phải lớn hơn hoặc bằng ngân sách tối thiểu.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiClient('/dang-bai', {
        method: 'POST',
        body: JSON.stringify({
          tenMon: form.tenMon,
          maHocVien: user.userId,
          trinhDo: form.trinhDo,
          lichHocDuKien: form.lichHocDuKien,
          hinhThuc: form.hinhThuc,
          diaDiem: form.diaDiem,
          nganSachMin: min,
          nganSachMax: max,
          moTa: form.moTa,
        }),
      });
      setSuccessMsg('Đăng yêu cầu thành công! Gia sư sẽ sớm ứng tuyển.');
      setForm(defaultForm);
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg('Lỗi: ' + (err.message || 'Không thể đăng yêu cầu.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CHỜ DUYỆT': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'TRỰC TIẾP': return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'ĐANG TÌM':
      case 'MỞ':        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'ĐÃ GHÉP':
      case 'ĐÃ GIAO':   return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'HỦY':
      case 'TỪ CHỐI':   return 'bg-red-50 text-red-500 border border-red-200';
      default:          return 'bg-slate-50 text-slate-500 border border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Yêu cầu tìm gia sư</h1>
          <p className="text-slate-500 text-lg mt-1">Đăng yêu cầu để gia sư phù hợp ứng tuyển cho bạn</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setErrorMsg(''); setSuccessMsg(''); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Đóng' : 'Đăng yêu cầu'}
        </button>
      </div>

      {/* Thông báo */}
      {successMsg && (
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Form đăng yêu cầu */}
      {showForm && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thông tin yêu cầu</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Môn học */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Môn học <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="mon-hoc-list"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Nhập hoặc chọn môn học..."
                    value={form.tenMon}
                    onChange={(e) => setForm({ ...form, tenMon: e.target.value })}
                    required
                  />
                  <datalist id="mon-hoc-list">
                    {monHocList.map((m) => (
                      <option key={m.maMon} value={m.tenMon} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Trình độ */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Trình độ</label>
                <div className="relative">
                  <select
                    aria-label="Chọn trình độ"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                    value={form.trinhDo}
                    onChange={(e) => setForm({ ...form, trinhDo: e.target.value })}
                  >
                    <option value="">-- Chọn trình độ --</option>
                    {TRINH_DO_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Lịch học */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Lịch học dự kiến
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ví dụ: Thứ 2, 4, 6 - 18:00-20:00"
                  value={form.lichHocDuKien}
                  onChange={(e) => setForm({ ...form, lichHocDuKien: e.target.value })}
                />
              </div>

              {/* Hình thức */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Hình thức học
                </label>
                <div className="flex gap-2">
                  {HINH_THUC_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setForm({ ...form, hinhThuc: h })}
                      className={`flex-1 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                        form.hinhThuc === h
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Địa điểm */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Địa điểm
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ví dụ: Cầu Giấy, Hà Nội"
                  value={form.diaDiem}
                  onChange={(e) => setForm({ ...form, diaDiem: e.target.value })}
                />
              </div>

              {/* Ngân sách */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Ngân sách (đ/giờ)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Từ"
                    min="0"
                    value={form.nganSachMin}
                    onChange={(e) => setForm({ ...form, nganSachMin: e.target.value })}
                  />
                  <span className="text-slate-400 font-bold shrink-0">–</span>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Đến"
                    min="0"
                    value={form.nganSachMax}
                    onChange={(e) => setForm({ ...form, nganSachMax: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Mô tả chi tiết yêu cầu</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                placeholder="Mô tả thêm về nhu cầu học của bạn, mục tiêu, yêu cầu đặc biệt với gia sư..."
                value={form.moTa}
                onChange={(e) => setForm({ ...form, moTa: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(defaultForm); }}
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Đăng yêu cầu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách yêu cầu */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Yêu cầu của tôi
          <span className="ml-2 px-2.5 py-0.5 text-sm bg-slate-100 text-slate-500 rounded-full font-semibold">
            {yeuCauList.length}
          </span>
        </h2>

        {yeuCauList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Info className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có yêu cầu nào</h3>
            <p className="text-slate-500 mb-6">Hãy đăng yêu cầu để tìm gia sư phù hợp với bạn!</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-5 h-5" /> Đăng yêu cầu đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {yeuCauList.map((yc) => (
              <div
                key={yc.maYeuCau}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {yc.monHoc?.tenMon || 'Môn học'}
                        </h3>
                        {yc.trinhDo && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-full">
                            {yc.trinhDo}
                          </span>
                        )}
                      </div>
                      {yc.moTa && (
                        <p className="text-slate-500 text-sm line-clamp-2 mb-2">{yc.moTa}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
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
                        {yc.lichHocDuKien && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {yc.lichHocDuKien}
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
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusStyle(yc.trangThai)}`}>
                      {yc.trangThai}
                    </span>
                    {yc.ngayTao && (
                      <span className="text-xs text-slate-400">
                        {new Date(yc.ngayTao).toLocaleDateString('vi-VN')}
                      </span>
                    )}
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
