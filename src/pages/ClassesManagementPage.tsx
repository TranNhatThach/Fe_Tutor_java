import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classService, { ClassInfo } from '../services/classService';
import { useAuthStore } from '../store/authStore';
import {
  Loader2, AlertCircle, RefreshCw, BookOpen,
  GraduationCap, User, Users, Trash2, LayoutDashboard, LogOut, Search
} from 'lucide-react';

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

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { style: string; label: string }> = {
    DANG_HOC: { style: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Đang học' },
    HOAN_THANH: { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Hoàn thành' },
    DA_HUY: { style: 'bg-red-50 text-red-700 border-red-200', label: 'Đã hủy' },
  };
  const { style, label } = map[status] ?? { style: 'bg-gray-50 text-gray-600 border-gray-200', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'DANG_HOC' ? 'bg-sky-500' : status === 'HOAN_THANH' ? 'bg-emerald-500' : 'bg-red-400'
        }`} />
      {label}
    </span>
  );
};

// ─── Summary Cards ────────────────────────────────────────────────────────────
const SummaryCard: React.FC<{ label: string; value: number | string; sub?: string }> = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const ClassesManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classService.getAllClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const filtered = classes.filter(cls => {
    const q = search.toLowerCase();
    return (
      (!q || [cls.tenHocVien, cls.tenGiaSu, cls.tenMonHoc].some(f => f?.toLowerCase().includes(q))) &&
      (!statusFilter || cls.trangThai === statusFilter)
    );
  });

  // Stats
  const total = classes.length;
  const dangHoc = classes.filter(c => c.trangThai === 'DANG_HOC').length;
  const hoanThanh = classes.filter(c => c.trangThai === 'HOAN_THANH').length;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar active="/admin/classes" onNavigate={navigate} onLogout={() => { logout(); navigate('/login'); }} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Quản lý lớp học</h1>
              <p className="text-sm text-gray-500 mt-0.5">Theo dõi tất cả lớp học trong hệ thống</p>
            </div>
            <button
              onClick={fetchClasses}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Summary cards */}
          {!loading && classes.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <SummaryCard label="Tổng lớp học" value={total} />
              <SummaryCard label="Đang học" value={dangHoc} sub={`${Math.round((dangHoc / total) * 100)}% tổng số`} />
              <SummaryCard label="Hoàn thành" value={hoanThanh} />
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo học viên, gia sư, môn học..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all placeholder:text-gray-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900/10 outline-none text-gray-700 cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DANG_HOC">Đang học</option>
              <option value="HOAN_THANH">Hoàn thành</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>

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
                <button onClick={fetchClasses} className="text-sm text-gray-700 underline underline-offset-2">Thử lại</button>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400">
                <BookOpen className="w-8 h-8 text-gray-200" />
                <p className="text-sm">Chưa có lớp học nào.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Mã lớp</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Học viên / Gia sư</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Môn học</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tiến độ</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Học phí</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(cls => {
                      const pct = cls.tongSoBuoi ? Math.round(((cls.tongSoBuoi - cls.soBuoiConLai) / cls.tongSoBuoi) * 100) : 0;
                      return (
                        <tr key={cls.maLop} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{cls.maLop}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                <GraduationCap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                <span className="font-medium text-gray-800">{cls.tenHocVien}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{cls.tenGiaSu}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-medium text-gray-800">{cls.tenMonHoc}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="w-28">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{cls.tongSoBuoi - cls.soBuoiConLai}/{cls.tongSoBuoi} buổi</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gray-900 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-semibold text-gray-800">
                              {cls.hocPhiThoaThuan?.toLocaleString('vi-VN')}
                              <span className="font-normal text-gray-400 ml-0.5">đ</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={cls.trangThai} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <div className="text-center py-12 text-sm text-gray-400">
                    Không tìm thấy lớp học nào.
                  </div>
                )}

                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                  <span className="text-xs text-gray-400">{filtered.length} lớp học</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClassesManagementPage;