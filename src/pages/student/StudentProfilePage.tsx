import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { User, Mail, Phone, MapPin, School, BookOpen, Save, Loader2, Camera, Heart } from 'lucide-react';

interface ProfileData {
  hoTen: string;
  email: string;
  soDienThoai: string;
  viTri: string;
  lopHoc: string;
  truongHoc: string;
  hinhThucHocUuTien: string;
  moTa: string;
}

export function StudentProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState<ProfileData>({
    hoTen: '',
    email: '',
    soDienThoai: '',
    viTri: '',
    lopHoc: '',
    truongHoc: '',
    hinhThucHocUuTien: 'Hoc tai nha',
    moTa: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient<any>('/tai-khoan/profile');
        setFormData({
          hoTen: data.hoTen || '',
          email: data.email || '',
          soDienThoai: data.soDienThoai || '',
          viTri: data.viTri || '',
          lopHoc: data.lopHoc || '',
          truongHoc: data.truongHoc || '',
          hinhThucHocUuTien: data.hinhThucHocUuTien || 'Hoc tai nha',
          moTa: data.moTa || '',
        });
      } catch (err) {
        console.error('Loi khi tai ho so:', err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const result = await apiClient<any>('/tai-khoan/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      // Cập nhật lại form từ dữ liệu server trả về
      setFormData({
        hoTen: result.hoTen || '',
        email: result.email || '',
        soDienThoai: result.soDienThoai || '',
        viTri: result.viTri || '',
        lopHoc: result.lopHoc || '',
        truongHoc: result.truongHoc || '',
        hinhThucHocUuTien: result.hinhThucHocUuTien || 'Hoc tai nha',
        moTa: result.moTa || '',
      });
      // Đồng bộ tên mới vào authStore (cập nhật sidebar/header)
      if (result.hoTen) updateUser({ name: result.hoTen });
      setSuccessMsg('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      setErrorMsg('Lỗi: ' + (err.message || 'Không thể cập nhật hồ sơ.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Dang tai ho so...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 text-lg">Cập nhật thông tin để nhận những gợi ý phù hợp nhất</p>
      </div>

      {successMsg && (
        <div className="mb-6 px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 px-5 py-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-medium">
          ✕ {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-blue-500/10 -z-10"></div>
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-3xl bg-white shadow-xl border-4 border-white overflow-hidden mx-auto">
                <img
                  src={`https://picsum.photos/seed/${user?.id || 'student'}/200/200`}
                  alt={formData.hoTen}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{formData.hoTen || user?.name}</h2>
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-4">Hoc vien</p>

            <div className="py-4 border-t border-slate-50 px-6 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Bạn đang nghĩ gì?</p>
              <textarea 
                placeholder="Hôm nay bạn muốn học gì thế..." 
                className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3 resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none hover:bg-white transition-all shadow-inner" 
                rows={3}
                value={formData.moTa}
                onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 mb-2">Trang thai ho so</h3>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${calculateProfileCompletion(formData)}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Ho so cua ban da hoan thien {calculateProfileCompletion(formData)}%. Hoan thien them thong tin de duoc goi y tot hon.
            </p>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> Ho va ten
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.hoTen}
                  onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" /> Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.email}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" /> So dien thoai
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.soDienThoai}
                  onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Dia chi
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.viTri}
                  onChange={(e) => setFormData({ ...formData, viTri: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Lop hoc
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.lopHoc}
                  onChange={(e) => setFormData({ ...formData, lopHoc: e.target.value })}
                  placeholder="Vi du: 10, 11, 12..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-600" /> Truong hoc
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.truongHoc}
                  onChange={(e) => setFormData({ ...formData, truongHoc: e.target.value })}
                  placeholder="Vi du: THPT Chu Van An"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-600" /> Hinh thuc hoc uu tien
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Hoc tai nha', 'Online', 'Ca hai'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({ ...formData, hinhThucHocUuTien: option })}
                    className={`px-4 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                      formData.hinhThucHocUuTien === option
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Luu thay doi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function calculateProfileCompletion(data: ProfileData): number {
  const fields = [data.hoTen, data.email, data.soDienThoai, data.viTri, data.lopHoc, data.truongHoc, data.hinhThucHocUuTien];
  const filled = fields.filter((f) => f && f.trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}
