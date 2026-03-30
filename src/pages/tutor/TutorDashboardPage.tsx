import { useAuthStore } from '../../store/authStore';
import { useTutor } from '../../hooks/useTutor';
import { useShared } from '../../hooks/useShared';
import { Briefcase, Clock, Users, DollarSign, ArrowRight, BookOpen, Calendar, Mail, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper tìm ngày học tiếp theo
function getNextSession(lichHoc?: string): { date: Date; label: string; daysRemaining: number } | null {
  if (!lichHoc) return null;
  const l = lichHoc.toLowerCase();
  const dayMatch = l.match(/thứ\s*(\d)|t(\d)/g);
  const isWeekend = l.includes('cn') || l.includes('chủ nhật');
  
  if (!dayMatch && !isWeekend) return null;
  
  const scheduleDays: number[] = [];
  if (dayMatch) {
    dayMatch.forEach(m => {
      const num = parseInt(m.match(/\d/)?.[0] || '0');
      if (num >= 2 && num <= 7) scheduleDays.push(num);
    });
  }
  if (isWeekend) scheduleDays.push(1); // 1 = Sunday in our logic below

  if (scheduleDays.length === 0) return null;

  const today = new Date();
  const currentJsDay = today.getDay(); // 0 is Sunday
  const currentSysDay = currentJsDay === 0 ? 1 : currentJsDay + 1; // 1: Sun, 2: Mon, ... 7: Sat

  let minDiff = 7;
  scheduleDays.forEach(d => {
    let diff = d - currentSysDay;
    if (diff < 0) diff += 7;
    if (diff < minDiff) minDiff = diff;
  });

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + minDiff);

  const timeMatch = l.match(/(\d{1,2}(?::\d{2})?\s*(?:h|g)(?:iờ)?\s*(?:sáng|chiều|tối)?)/);
  const timeLabel = timeMatch ? timeMatch[1].trim() : '';

  return { date: nextDate, label: timeLabel, daysRemaining: minDiff };
}

export function TutorDashboardPage() {
  const { user } = useAuthStore();
  const { getJobList, getInvitations } = useTutor();
  const { getMyClasses } = useShared();
  
  const { data: jobs, isLoading: jobsLoading } = getJobList();
  const { data: invitations } = getInvitations(user?.userId?.toString() || user?.id?.toString() || '');
  const { data: classes } = getMyClasses();

  let activeClasses = 0;
  let hoursTaught = 0;
  let estimatedIncome = 0;
  const upcoming: any[] = [];

  classes?.forEach(cls => {
    if (cls.trangThai !== 'HOAN_THANH') activeClasses++;
    
    const doneSessions = cls.tongSoBuoi != null ? (cls.tongSoBuoi - (cls.soBuoiConLai ?? cls.tongSoBuoi)) : 0;
    hoursTaught += (doneSessions * 2);
    
    if (cls.trangThai === 'DANG_HOC' || cls.trangThai === 'HOAN_THANH') {
       estimatedIncome += (cls.hocPhiThoaThuan || 0);
    }

    if (cls.trangThai !== 'HOAN_THANH' && cls.lichHoc) {
      const next = getNextSession(cls.lichHoc);
      if (next) {
        upcoming.push({ ...next, cls });
      }
    }
  });

  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const nextClasses = upcoming.slice(0, 3);

  const newInvitations = (invitations as any[])?.filter(inv => {
    const st = inv.trangThai?.toUpperCase() || '';
    return !st.includes('DONG Y') && !st.includes('ĐỒNG Ý') && !st.includes('TU CHOI') && !st.includes('TỪ CHỐI');
  }).length || 0;

  const stats = [
    { label: 'Lớp đang dạy', value: activeClasses.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Giờ đã dạy', value: `${hoursTaught}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Thu nhập dự kiến', value: estimatedIncome >= 1000000 ? `${(estimatedIncome / 1000000).toFixed(1)}M` : `${(estimatedIncome / 1000)}k`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Lời mời mới', value: newInvitations.toString(), icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // Map real jobs to the dashboard format
  const recentJobs = jobs?.slice(0, 3).map(job => ({
    id: job.id,
    title: job.title,
    budget: `${job.budget.toLocaleString()}đ/buổi`,
    location: job.location,
    time: 'Mới đăng'
  })) || [];


  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại, {user?.name}! 👋</h1>
          <p className="text-slate-500 text-lg">Bạn đã sẵn sàng cho những buổi dạy mới chưa?</p>
        </div>
        <Link 
          to="/tutor/jobs" 
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          Tìm việc làm mới <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" /> Việc làm mới nhất
            </h2>
            <Link to="/tutor/jobs" className="text-sm font-bold text-emerald-600 hover:underline">Xem tất cả</Link>
          </div>
          
          <div className="space-y-4">
            {jobsLoading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-500">{job.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{job.budget}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{job.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-500 italic">Hiện tại chưa có yêu cầu mới nào.</p>
              </div>
            )}
          </div>

        </div>

        {/* Lịch học tiếp theo */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" /> Lịch dạy sắp tới
          </h2>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            {nextClasses.length > 0 ? (
              nextClasses.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-emerald-600 uppercase leading-none mt-0.5">
                      {item.daysRemaining === 0 ? 'HÔM NAY' : item.daysRemaining === 1 ? 'NGÀY MAI' : `+${item.daysRemaining} NGÀY`}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.cls.tenMonHoc || 'Môn học'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3" /> {item.label || item.cls.lichHoc}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 mt-1.5 line-clamp-1">
                      Học viên: {item.cls.tenHocVien}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Chưa có lịch dạy nào sắp tới</p>
              </div>
            )}
            <div className="pt-2">
              <Link 
                to="/tutor/classes" 
                className="flex items-center justify-center gap-2 w-full bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-all border border-slate-200 hover:border-emerald-200"
              >
                Đến lớp học của tôi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
