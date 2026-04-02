import React, { useState } from 'react';
import { useTutor, Job } from '../../hooks/useTutor';
import { useAuthStore } from '../../store/authStore';
import { Briefcase, MapPin, Clock, DollarSign, Loader2, X, Send, MessageSquare, Calendar } from 'lucide-react';
import { number } from 'motion';

export function JobListPage() {
  const { getJobList, applyJob } = useTutor();
  const { data: jobs, isLoading } = getJobList();
  const { user } = useAuthStore();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loiNhan, setLoiNhan] = useState('');
  const [mucHocPhi, setMucHocPhi] = useState<number>(0);

  const handleOpenModal = (job: Job) => {
    setSelectedJob(job);
    setMucHocPhi(job.budget);
    setLoiNhan('');
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !user?.userId) return;

    try {
      await applyJob.mutateAsync({
        maGiaSu: user.userId,
        maYeuCau: parseInt(selectedJob.id),
        loiNhan: loiNhan,
        mucHocPhiDeXuat: mucHocPhi
      });
      alert('Ứng tuyển thành công!');
      setSelectedJob(null);
    } catch (err) {
      alert('Có lỗi xảy ra khi ứng tuyển.');
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Việc làm mới nhất</h1>
          <p className="text-slate-500 text-lg">Tìm kiếm các yêu cầu học tập phù hợp với chuyên môn của bạn</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Đang tải danh sách việc làm...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs?.map((job) => (
            <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                        {job.subject}
                      </span>
                      <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                        {job.grade}
                      </span>
                    </div>
                    {job.moTaChiTiet && (
                      <p className="text-slate-500 text-sm line-clamp-2 mt-3">{job.moTaChiTiet}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm pt-2">
                  {job.hinhThuc && (
                    <div className="flex items-center text-slate-500 font-medium">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      {job.hinhThuc}
                    </div>
                  )}
                  <div className="flex items-center text-slate-500 font-medium">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {job.location}
                  </div>
                  {job.lichHocDuKien && (
                    <div className="flex items-center text-slate-500 font-medium">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      {job.lichHocDuKien}
                    </div>
                  )}
                  {(job.nganSachMin != null || job.nganSachMax != null) ? (
                    <div className="flex items-center text-emerald-600 font-bold bg-emerald-50/50 px-3 py-1 rounded-xl">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {(() => {
                        const min = job.nganSachMin;
                        const max = job.nganSachMax;
                        if (min != null && max != null) {
                          const trueMin = Math.min(min, max);
                          const trueMax = Math.max(min, max);
                          return `${trueMin.toLocaleString()}đ – ${trueMax.toLocaleString()}đ / giờ`;
                        } else if (min != null) {
                          return `Từ ${min.toLocaleString()}đ / giờ`;
                        } else if (max != null) {
                          return `Đến ${max.toLocaleString()}đ / giờ`;
                        }
                        return '? / giờ';
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center text-emerald-600 font-bold bg-emerald-50/50 px-3 py-1 rounded-xl">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {job.budget?.toLocaleString() || '0'}đ / giờ
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => handleOpenModal(job)}
                  className="w-full md:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  Ứng tuyển ngay
                </button>
              </div>
            </div>
          ))}

          {jobs?.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có yêu cầu mới</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Hiện chưa có yêu cầu mới nào phù hợp. Hãy quay lại sau nhé!</p>
            </div>
          )}
        </div>
      )}

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Ứng tuyển dạy học</h2>
                <p className="text-sm text-slate-500 mt-1">Gửi lời nhắn tới phụ huynh/học viên</p>
              </div>
              <button
                type="button"
                title="Close modal"
                onClick={() => setSelectedJob(null)}
                className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-8 space-y-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2">Đang ứng tuyển cho</h4>
                <p className="font-bold text-emerald-900 text-lg">{selectedJob.title}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-sm text-emerald-700 flex items-center gap-1 font-medium">
                    <DollarSign className="w-4 h-4" /> Ngân sách gốc: {selectedJob.budget.toLocaleString()}đ
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Mức phí đề xuất (đ/buổi)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-lg text-slate-900"
                    placeholder="Nhập mức phí mong muốn..."
                    value={mucHocPhi}
                    onChange={(e) => setMucHocPhi(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                    <MessageSquare className="w-4 h-4 text-emerald-600" /> Lời nhắn gửi học viên
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-slate-700"
                    placeholder="Giới thiệu nhanh về kinh nghiệm của bạn cho môn học này..."
                    value={loiNhan}
                    onChange={(e) => setLoiNhan(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={applyJob.isPending}
                  className="flex-[2] px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {applyJob.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Gửi đơn ứng tuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
