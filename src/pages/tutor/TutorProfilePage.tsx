import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import provincesData from '../../constants/provinces.json';
import { User, Mail, Phone, MapPin, BookOpen, Award, Save, Loader2, Camera, GraduationCap, Briefcase, Plus, Trash2, Edit2, DollarSign, X } from 'lucide-react';
import { useTutorSubjects } from '../../hooks/useTutorSubjects';
import { uploadImageToImgBB } from '../../utils/imageUpload';

interface TutorProfileData {
  hoTen: string;
  email: string;
  soDienThoai: string;
  viTri: string;
  gioiTinh: string;
  truongDaiHoc: string;
  chuyenNganh: string;
  namSinh: string;
  soNamKinhNghiem: string;
  diemDanhGia: number;
  soDanhGia: number;
  moTa: string;
  avatar?: string;
}

export function TutorProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const currentProvinceData = provincesData.find((p: any) => p.name === selectedProvince);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value;
    setSelectedProvince(province);
    setSelectedDistrict('');
    setFormData(prev => ({ ...prev, viTri: province }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setFormData(prev => ({
      ...prev,
      viTri: district ? `${district}, ${selectedProvince}` : selectedProvince
    }));
  };
  const [formData, setFormData] = useState<TutorProfileData>({
    hoTen: '',
    email: '',
    soDienThoai: '',
    viTri: '',
    gioiTinh: '',
    truongDaiHoc: '',
    chuyenNganh: '',
    namSinh: '',
    soNamKinhNghiem: '',
    diemDanhGia: 0,
    soDanhGia: 0,
    moTa: '',
    avatar: '',
  });

  const { getMySubjects, addSubject, removeSubject } = useTutorSubjects();
  const { data: subjects = [], isLoading: isLoadingSubjects } = getMySubjects();
  
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    tenMon: '',
    trinhDo: 'Sinh viên',
    hocPhiMoiGio: 150000,
  });

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.tenMon.trim()) {
      alert("Vui lòng nhập tên môn học");
      return;
    }
    try {
      await addSubject.mutateAsync(subjectForm);
      setShowSubjectModal(false);
      setSubjectForm({ tenMon: '', trinhDo: 'Sinh viên', hocPhiMoiGio: 150000 });
      setSuccessMsg("Thêm môn học thành công!");
    } catch (err: any) {
      alert("Lỗi khi thêm môn học: " + err.message);
    }
  };

  const handleRemoveSubject = async (maMon: number) => {
    if (confirm("Bạn có chắc muốn xóa môn học này khỏi hồ sơ?")) {
      try {
        await removeSubject.mutateAsync(maMon);
        setSuccessMsg("Xóa môn học thành công!");
      } catch (err: any) {
        alert("Lỗi khi xóa: " + err.message);
      }
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadImageToImgBB(file);
      setFormData(prev => ({ ...prev, avatar: url }));
      setSuccessMsg('Tải ảnh lên thành công. Đừng quên bấm "Lưu thay đổi"');
      // Optional: Update in authStore immediately if you want, but wait for Save is better.
    } catch (err) {
      setErrorMsg('Tải ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient<any>('/tai-khoan/profile');
        const viTriParts = data.viTri ? data.viTri.split(', ') : [];
        if (viTriParts.length === 2) {
          setSelectedDistrict(viTriParts[0]);
          setSelectedProvince(viTriParts[1]);
        } else if (viTriParts.length === 1) {
          setSelectedProvince(viTriParts[0]);
        }

        setFormData({
          hoTen: data.hoTen || '',
          email: data.email || '',
          soDienThoai: data.soDienThoai || '',
          viTri: data.viTri || '',
          gioiTinh: data.gioiTinh || '',
          truongDaiHoc: data.truongDaiHoc || '',
          chuyenNganh: data.chuyenNganh || '',
          namSinh: data.namSinh ? String(data.namSinh) : '',
          soNamKinhNghiem: data.soNamKinhNghiem ? String(data.soNamKinhNghiem) : '',
          diemDanhGia: data.diemDanhGia || 0,
          soDanhGia: data.soDanhGia || 0,
          moTa: data.moTa || '',
          avatar: data.avatar || '',
        });
      } catch (err) {
        console.error('Lỗi khi tải hồ sơ:', err);
        setErrorMsg('Không thể tải hồ sơ. Vui lòng thử lại.');
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
      const payload: any = { ...formData };
      if (payload.namSinh) payload.namSinh = parseInt(payload.namSinh);
      if (payload.soNamKinhNghiem) payload.soNamKinhNghiem = parseInt(payload.soNamKinhNghiem);

      await apiClient('/tai-khoan/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setSuccessMsg('Cập nhật hồ sơ thành công!');
      // Đồng bộ tên mới vào authStore (cập nhật sidebar/header)
      updateUser({ 
        name: payload.hoTen || user?.name, 
        avatar: payload.avatar !== undefined ? payload.avatar : user?.avatar 
      });
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
        <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 text-lg">Hoàn thiện thông tin để thu hút nhiều học viên hơn</p>
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
            <div className="absolute top-0 left-0 w-full h-24 bg-emerald-500/10 -z-10"></div>
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-3xl bg-white shadow-xl border-4 border-white overflow-hidden mx-auto">
                <img
                  src={formData.avatar || `https://picsum.photos/seed/${user?.id}/200/200`}
                  alt={user?.name}
                  className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{formData.hoTen || user?.name}</h2>
            <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">Gia sư chuyên nghiệp</p>

            <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-50">
              <div className="text-center">
                <p className="text-xl font-black text-amber-500">{formData.diemDanhGia || '0'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đánh giá</p>
              </div>
              <div className="w-px h-8 bg-slate-100"></div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-900">{formData.soDanhGia || '0'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học viên</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 mb-2">Trạng thái hồ sơ</h3>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${calculateProfileCompletion(formData)}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Hồ sơ của bạn đã hoàn thiện {calculateProfileCompletion(formData)}%. Thêm thông tin để đạt 100%.
            </p>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            {/* Thông tin cơ bản */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 text-base">Thông tin cơ bản</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" /> Họ và tên
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none opacity-70 cursor-not-allowed"
                    value={formData.email}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" /> Số điện thoại
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.soDienThoai}
                    onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" /> Tỉnh / Thành
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={selectedProvince}
                      onChange={handleProvinceChange}
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {provincesData.map((p: any) => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      Quận / Huyện
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                      disabled={!selectedProvince || !currentProvinceData}
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {currentProvinceData?.districts?.map((d: any) => (
                        <option key={d.code} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Giới tính</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.gioiTinh}
                    onChange={(e) => setFormData({ ...formData, gioiTinh: e.target.value })}
                  >
                    <option value="">-- Chọn --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Năm sinh</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.namSinh}
                    onChange={(e) => setFormData({ ...formData, namSinh: e.target.value })}
                    placeholder="Ví dụ: 2000"
                    min="1950"
                    max="2010"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin chuyên môn */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 text-base">Thông tin chuyên môn</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" /> Trường đại học
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.truongDaiHoc}
                    onChange={(e) => setFormData({ ...formData, truongDaiHoc: e.target.value })}
                    placeholder="Ví dụ: ĐH Bách Khoa HN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" /> Chuyên ngành
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.chuyenNganh}
                    onChange={(e) => setFormData({ ...formData, chuyenNganh: e.target.value })}
                    placeholder="Ví dụ: Sư phạm Toán"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" /> Số năm kinh nghiệm
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={formData.soNamKinhNghiem}
                    onChange={(e) => setFormData({ ...formData, soNamKinhNghiem: e.target.value })}
                    placeholder="Ví dụ: 3"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Giới thiệu */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" /> Giới thiệu bản thân
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                value={formData.moTa}
                onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                placeholder="Mô tả kinh nghiệm, phương pháp giảng dạy của bạn..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Lưu thay đổi
              </button>
            </div>
          </form>
          
          {/* Quản lý môn học */}
          <div className="mt-8 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Môn dạy & Học phí</h3>
                <p className="text-sm text-slate-500">Cập nhật môn học, trình độ và mức học phí bạn mong muốn.</p>
              </div>
              <button
                onClick={() => setShowSubjectModal(true)}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
              >
                <Plus className="w-5 h-5" /> Thêm môn
              </button>
            </div>

            {isLoadingSubjects ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : subjects.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-600">Bạn chưa đăng ký môn học nào.</p>
                <p className="text-sm text-slate-500">Hãy thêm môn học để học viên có thể tìm thấy bạn!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {subjects.map((s) => (
                  <div key={s.maMon} className="p-5 border border-slate-200 rounded-2xl hover:border-emerald-300 transition-colors bg-white shadow-sm flex items-start justify-between group">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                        {s.tenMon} 
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{s.trinhDo}</span>
                      </h4>
                      <p className="text-emerald-600 font-bold flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> {s.hocPhiMoiGio.toLocaleString()}đ <span className="text-sm text-slate-400 font-normal">/ giờ</span>
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleRemoveSubject(s.maMon)}
                        title="Xóa môn học"
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal Thêm/Sửa Môn Học */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSubjectModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 z-10 p-8">
            <button onClick={() => setShowSubjectModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Thêm môn dạy</h2>
            
            <form onSubmit={handleAddSubject} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tên môn học (Ví dụ: Toán, Tiếng Anh)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={subjectForm.tenMon}
                  onChange={e => setSubjectForm({...subjectForm, tenMon: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Trình độ giảng dạy</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={subjectForm.trinhDo}
                  onChange={e => setSubjectForm({...subjectForm, trinhDo: e.target.value})}
                >
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Giáo viên">Giáo viên</option>
                  <option value="Giảng viên">Giảng viên</option>
                  <option value="Cử nhân">Cử nhân</option>
                  <option value="Thạc sĩ">Thạc sĩ</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Giá theo giờ (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={subjectForm.hocPhiMoiGio}
                  onChange={e => setSubjectForm({...subjectForm, hocPhiMoiGio: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={addSubject.isPending}
                  className="w-full bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {addSubject.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Lưu môn học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function calculateProfileCompletion(data: TutorProfileData): number {
  const fields = [
    data.hoTen, data.email, data.soDienThoai, data.viTri,
    data.gioiTinh, data.truongDaiHoc, data.chuyenNganh,
    data.namSinh, data.soNamKinhNghiem, data.moTa
  ];
  const filled = fields.filter((f) => f && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}
