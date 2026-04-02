import { useAuthStore } from '../../store/authStore';
import { useShared } from '../../hooks/useShared';
import { BookOpen, Clock, Calendar, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useQueries } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

// Helper tìm N ngày học tiếp theo của một lớp
function getNextSessions(lichHoc?: string, limit: number = 3): { date: Date; label: string; daysRemaining: number }[] {
  if (!lichHoc || lichHoc.trim() === '') {
    return [{ date: new Date(), label: 'Chưa xếp lịch', daysRemaining: -1 }];
  }
  const l = lichHoc.toLowerCase();
  
  const scheduleDays = new Set<number>();
  
  const dayMatch = l.match(/thứ\s*(\d)|t(\d)/g);
  if (dayMatch) {
    dayMatch.forEach(m => {
      const numMatch = m.match(/\d/);
      if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (num >= 2 && num <= 7) scheduleDays.add(num);
      }
    });
  }

  const numOnlyMatch = l.match(/(?<![a-zA-Z0-9])([2-7])(?![a-zA-Z0-9])/g);
  if (numOnlyMatch) {
    numOnlyMatch.forEach(m => {
      scheduleDays.add(parseInt(m));
    });
  }
  
  if (l.includes('cn') || l.includes('chủ nhật')) {
    scheduleDays.add(1); // Quy ước 1 = Chủ Nhật
  }

  if (scheduleDays.size === 0) {
    return [{ date: new Date(), label: lichHoc, daysRemaining: -1 }];
  }

  const timeMatch = l.match(/(\d{1,2}(?::\d{2})?\s*(?:h|g)(?:iờ)?\s*(?:sáng|chiều|tối)?)/);
  const timeLabel = timeMatch ? timeMatch[1].trim() : '';

  const today = new Date();
  const sessions: { date: Date; label: string; daysRemaining: number }[] = [];
  
  for (let offset = 0; offset < 30; offset++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + offset);
    
    // JS getDay(): 0 = Sun, 1 = Mon...
    const jsDay = testDate.getDay();
    const sysDay = jsDay === 0 ? 1 : jsDay + 1; // 1 = Chủ Nhật, 2 = Thứ 2...
    
    if (scheduleDays.has(sysDay)) {
      sessions.push({
        date: testDate,
        label: timeLabel || lichHoc,
        daysRemaining: offset
      });
      if (sessions.length >= limit) break;
    }
  }

  return sessions;
}

export function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { getMyClasses } = useShared();
  const { data: classes } = getMyClasses();

  const classIds = classes?.map(c => c.maLop) || [];
  const buoiHocQueries = useQueries({
    queries: classIds.map(id => ({
      queryKey: ['buoi-hoc', id],
      queryFn: () => apiClient<any[]>(`/buoi-hoc/lop/${id}`),
      enabled: !!id,
    }))
  });

  let activeClasses = 0;
  let hoursStudied = 0;
  const upcoming: any[] = [];

  classes?.forEach((cls, idx) => {
    if (cls.trangThai !== 'HOAN_THANH') activeClasses++;
    
    const doneSessions = cls.tongSoBuoi != null ? (cls.tongSoBuoi - (cls.soBuoiConLai ?? cls.tongSoBuoi)) : 0;
    
    const buoiHocs = buoiHocQueries[idx]?.data || [];
    let sessionHours = 2; // mặc định 2 giờ nếu chưa có buổi học mẫu
    if (buoiHocs.length > 0) {
      for (const b of buoiHocs) {
        if (b.thoiGianBatDau && b.thoiGianKetThuc) {
          const start = new Date(b.thoiGianBatDau).getTime();
          const end = new Date(b.thoiGianKetThuc).getTime();
          const hrs = (end - start) / (1000 * 60 * 60);
          if (!isNaN(hrs) && hrs > 0 && hrs <= 10) {
            sessionHours = hrs;
            break;
          }
        }
      }
    }
    
    hoursStudied += (doneSessions * sessionHours);

    if (cls.trangThai !== 'HOAN_THANH') {
      const nextList = getNextSessions(cls.lichHoc, 3);
      nextList.forEach(next => {
        upcoming.push({ ...next, cls });
      });
    }
  });

  upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const nextClasses = upcoming.slice(0, 3);
  
  // Assuming classes map back to their Tutors
  const totalTutors = new Set(classes?.map(c => c.tenGiaSu).filter(Boolean)).size;

  const stats = [
    { label: 'Lớp đang học', value: activeClasses.toString(), icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Giờ đã học', value: `${Number.isInteger(hoursStudied) ? hoursStudied : hoursStudied.toFixed(1)}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
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
                        <span className="text-xs font-black uppercase">{item.daysRemaining === -1 ? '--' : shortDay}</span>
                        <span className="text-lg font-black leading-none">{item.daysRemaining === -1 ? '--' : dateStr.split('/')[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{item.cls.tenMonHoc || 'Môn học'}</h3>
                        <p className="text-sm text-slate-500 truncate mt-0.5">Gia sư: {item.cls.tenGiaSu}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                        {item.daysRemaining === -1 ? 'CHƯA RÕ' : item.daysRemaining === 0 ? 'HÔM NAY' : item.daysRemaining === 1 ? 'NGÀY MAI' : `+${item.daysRemaining} NGÀY`}
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
