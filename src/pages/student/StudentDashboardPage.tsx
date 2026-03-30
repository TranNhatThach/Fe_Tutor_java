import { useAuthStore } from '../../store/authStore';
import { useShared } from '../../hooks/useShared';
import { BookOpen, Clock, Calendar, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

export function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { getMyClasses } = useShared();
  const { data: classes } = getMyClasses();

  let activeClasses = 0;
  let hoursStudied = 0;
  const upcoming: any[] = [];

  classes?.forEach(cls => {
    if (cls.trangThai !== 'HOAN_THANH') activeClasses++;
    
    const doneSessions = cls.tongSoBuoi != null ? (cls.tongSoBuoi - (cls.soBuoiConLai ?? cls.tongSoBuoi)) : 0;
    hoursStudied += (doneSessions * 2);

    if (cls.trangThai !== 'HOAN_THANH' && cls.lichHoc) {
      const next = getNextSession(cls.lichHoc);
      if (next) {
        upcoming.push({ ...next, cls });
      }
    }
  });

  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const nextClasses = upcoming.slice(0, 3);
  
  // Assuming classes map back to their Tutors
  const totalTutors = new Set(classes?.map(c => c.tenGiaSu).filter(Boolean)).size;

  const stats = [
    { label: 'Lớp đang học', value: activeClasses.toString(), icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Giờ đã học', value: `${hoursStudied}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Buổi học tới', value: nextClasses.length > 0 ? (nextClasses[0].daysRemaining === 0 ? 'Hôm nay' : nextClasses[0].daysRemaining === 1 ? 'Ngày mai' : `+${nextClasses[0].daysRemaining} ngày`) : 'Chưa có', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Gia sư theo học', value: totalTutors.toString(), icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];


  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại, {user?.name}! 👋</h1>
          <p className="text-slate-500 text-lg">Hôm nay bạn muốn bắt đầu bài học nào?</p>
        </div>
        <Link 
          to="/student/search" 
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          Tìm gia sư mới <ArrowRight className="w-4 h-4" />
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
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Lịch học sắp tới
            </h2>
            <Link to="/student/classes" className="text-sm font-bold text-emerald-600 hover:underline">Xem tất cả</Link>
          </div>
          
          <div className="space-y-4">
            {nextClasses.length > 0 ? (
              nextClasses.map((item, idx) => {
                const dayName = format(item.date, 'EEEE', { locale: vi });
                const shortDay = dayName.replace('Thứ ', 'T').replace('Chủ nhật', 'CN');
                const dateStr = format(item.date, 'dd/MM');
                
                return (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <span className="text-xs font-black uppercase">{shortDay}</span>
                        <span className="text-lg font-black leading-none">{dateStr.split('/')[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{item.cls.tenMonHoc || 'Môn học'}</h3>
                        <p className="text-sm text-slate-500 truncate mt-0.5">Gia sư: {item.cls.tenGiaSu}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                        {item.daysRemaining === 0 ? 'HÔM NAY' : item.daysRemaining === 1 ? 'NGÀY MAI' : `+${item.daysRemaining} NGÀY`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-500 italic">Bạn chưa có buổi học nào sắp tới.</p>
              </div>
            )}
          </div>

        </div>

        {/* Recent Activity / Recommendations */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Gợi ý cho bạn
          </h2>
          <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <h3 className="text-xl font-bold mb-4 relative z-10">Nâng cao kỹ năng Tiếng Anh?</h3>
            <p className="text-emerald-50 mb-6 text-sm leading-relaxed relative z-10 opacity-90">
              Chúng tôi vừa cập nhật danh sách 50+ gia sư IELTS 8.0+ mới. Đừng bỏ lỡ cơ hội học tập tốt nhất!
            </p>
            <Link 
              to="/student/search" 
              className="inline-block bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all relative z-10"
            >
              Khám phá ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
