import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';
import userService from '../services/userService';
import {
  Loader2, AlertCircle, RefreshCw, Undo, Trash2, ArrowLeft,
  X, CheckCircle, Users, BookOpen, LayoutDashboard, LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// ─── Toast ───────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface Toast { id: number; message: string; type: ToastType; }

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto
          ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-amber-50 text-amber-800 border border-amber-200'}`}
      >
        <CheckCircle className="w-4 h-4 shrink-0" />
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ active: string; onNavigate: (p: string) => void; onLogout: () => void }> = ({ active, onNavigate, onLogout }) => {
  const items = [
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
        {items.map(({ icon: Icon, label, path }) => (
          <button key={path} onClick={() => onNavigate(path)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active === path ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />Đăng xuất
        </button>
      </div>
    </aside>
  );
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
    {name?.charAt(0)?.toUpperCase()}
  </div>
);

// ─── RoleBadge ───────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const s: Record<string, string> = {
    ADMIN: 'bg-violet-50 text-violet-700 border-violet-200',
    GIA_SU: 'bg-amber-50 text-amber-700 border-amber-200',
    HOC_VIEN: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const l: Record<string, string> = { ADMIN: 'Admin', GIA_SU: 'Gia sư', HOC_VIEN: 'Học viên' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${s[role] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {l[role] ?? role}
    </span>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const DeletedUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { toasts, show: showToast, dismiss } = useToast();

  const fetchDeletedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getDeletedUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeletedUsers(); }, [fetchDeletedUsers]);

  const handleRestore = async (id: number | string) => {
    try {
      await userService.restoreUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('Khôi phục tài khoản thành công.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Khôi phục thất bại.', 'error');
    }
  };

  const handlePermanentDelete = async (id: number | string) => {
    if (!window.confirm('Xóa vĩnh viễn tài khoản này? Hành động không thể hoàn tác.')) return;
    try {
      await userService.permanentDeleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('Đã xóa vĩnh viễn.', 'warning');
    } catch (err: any) {
      showToast(err.message || 'Xóa thất bại.', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar active="/users/deleted" onNavigate={navigate} onLogout={() => { logout(); navigate('/login'); }} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/users')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">Thùng rác</h1>
              <p className="text-sm text-gray-500 mt-0.5">Khôi phục hoặc xóa vĩnh viễn tài khoản đã xóa</p>
            </div>
            <button
              onClick={fetchDeletedUsers}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Warning banner */}
          {users.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span>Các tài khoản trong thùng rác có thể được khôi phục hoặc xóa vĩnh viễn. Xóa vĩnh viễn sẽ không thể hoàn tác.</span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400">
                <Trash2 className="w-8 h-8 text-gray-200" />
                <p className="text-sm">Thùng rác đang trống.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Người dùng</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Vai trò</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.fullName} />
                            <div>
                              <p className="font-medium text-gray-700 leading-tight">{user.fullName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestore(user.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <Undo className="w-3 h-3" />
                              Khôi phục
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(user.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Xóa vĩnh viễn
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                  <span className="text-xs text-gray-400">{users.length} tài khoản trong thùng rác</span>
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

export default DeletedUsersPage;