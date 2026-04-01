import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User } from '../types/user';
import userService from '../services/userService';
import {
  Loader2, AlertCircle, UserPlus, Search, RefreshCw,
  Trash2, Edit, LogOut, BookOpen, Users, LayoutDashboard,
  X, CheckCircle, AlertTriangle
} from 'lucide-react';

// ─── Toast System ───────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; message: string; type: ToastType; }

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto
          animate-[slideUp_0.2s_ease-out]
          ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-amber-50 text-amber-800 border border-amber-200'}`}
      >
        {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> :
          t.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> :
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />}
        <span>{t.message}</span>
        <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, show, dismiss };
};

// ─── Role Badge ──────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const styles: Record<string, string> = {
    ADMIN: 'bg-violet-50 text-violet-700 border-violet-200',
    GIA_SU: 'bg-amber-50 text-amber-700 border-amber-200',
    HOC_VIEN: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const labels: Record<string, string> = { ADMIN: 'Admin', GIA_SU: 'Gia sư', HOC_VIEN: 'Học viên' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[role] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {labels[role] ?? role}
    </span>
  );
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ user: User }> = ({ user }) => {
  const colors = ['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'];
  const color = colors[(user.fullName?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden ${color}`}>
      {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.fullName?.charAt(0)?.toUpperCase()}
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ active: string; onNavigate: (path: string) => void; onLogout: () => void }> = ({ active, onNavigate, onLogout }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Người dùng', path: '/users' },
    { icon: BookOpen, label: 'Lớp học', path: '/admin/classes' },
    { icon: Trash2, label: 'Thùng rác', path: '/users/deleted' },
  ];
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-gray-100 bg-white">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => onNavigate(path)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active === path
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { toasts, show: showToast, dismiss } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || [user.fullName, user.email, user.username].some(f => f?.toLowerCase().includes(q))) &&
      (!roleFilter || user.role === roleFilter)
    );
  });

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Xóa người dùng này?')) return;
    try {
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('Đã xóa người dùng thành công.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Xóa thất bại.', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar active="/users" onNavigate={navigate} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Người dùng</h1>
              <p className="text-sm text-gray-500 mt-0.5">Quản lý tài khoản trong hệ thống</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                <UserPlus className="w-4 h-4" />
                Thêm mới
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all placeholder:text-gray-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 outline-none text-gray-700 cursor-pointer"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Admin</option>
              <option value="GIA_SU">Gia sư</option>
              <option value="HOC_VIEN">Học viên</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
              </div>
            ) : error && users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-gray-500 max-w-xs">{error}</p>
                <button onClick={fetchUsers} className="text-sm text-gray-700 underline underline-offset-2">
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Người dùng</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Vai trò</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar user={user} />
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">{user.fullName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            <span className="text-xs text-gray-500">{user.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-sm text-gray-400">
                    Không tìm thấy người dùng nào.
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
                  <span className="text-xs text-gray-400">{filteredUsers.length} người dùng</span>
                  <code className="text-xs text-gray-400">
                    {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}
                  </code>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};

export default UsersPage;