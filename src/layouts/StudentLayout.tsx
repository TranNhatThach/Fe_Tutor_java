import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Search, BookOpen, LogOut, User, Menu, X, CreditCard, Users, UserCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/cn';
import { NotificationBell } from '../components/NotificationBell';

export function StudentLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/student/search', icon: Search, label: 'Tìm gia sư' },
    { to: '/student/requests', icon: FileText, label: 'Yêu cầu của tôi' },
    { to: '/student/applicants', icon: Users, label: 'Gia sư ứng tuyển' },
    { to: '/student/classes', icon: BookOpen, label: 'Lớp học của tôi' },
    { to: '/student/profile', icon: UserCircle, label: 'Hồ sơ cá nhân' },
    { to: '/student/payments', icon: CreditCard, label: 'Thanh toán' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col shadow-sm">
        <div className="p-8 flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-200">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">TutorConnect</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group",
                location.pathname === item.to
                  ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 mr-3 transition-colors",
                location.pathname === item.to ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <button onClick={() => navigate('/student/profile')}>
                <User className="w-6 h-6 hover:cursor-pointer" />
              </button>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">Học viên</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">TutorConnect</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 items-center justify-between px-10 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chào mừng trở lại, {user?.name}! 👋</h2>
            <p className="text-sm text-slate-500">Hôm nay bạn muốn học gì?</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/student/search')} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <NotificationBell />
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border-2 border-white shadow-sm">
              <button onClick={() => navigate('/student/profile')}>
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-white pt-20 px-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-4 rounded-xl transition-all",
                    location.pathname === item.to
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-6 h-6 mr-4" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-4 text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-6 h-6 mr-4" />
                <span className="font-bold">Đăng xuất</span>
              </button>
            </nav>
          </div>
        )}
      </main>
    </div>
  );
}
