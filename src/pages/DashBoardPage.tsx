import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import userService from '../services/userService';
import classService, { ClassInfo } from '../services/classService';
import { User } from '../types/user';
import {
    Users, BookOpen, Trash2, LayoutDashboard, LogOut,
    TrendingUp, GraduationCap, UserCheck, AlertCircle,
    ArrowUpRight, Loader2
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    label: string;
    value: number | string;
    sub: string;
    icon: React.ReactNode;
    accent: string; // tailwind bg class for icon bg
    iconColor: string;
    onClick?: () => void;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, accent, iconColor, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between ${onClick ? 'cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-colors group' : ''}`}
    >
        <div>
            <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 leading-none mb-1.5">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center shrink-0 ${onClick ? 'group-hover:scale-105 transition-transform' : ''}`}>
            <span className={iconColor}>{icon}</span>
        </div>
    </div>
);

// ─── Mini bar chart (pure CSS) ────────────────────────────────────────────────
const MiniBarChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-1.5 h-16">
            {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full bg-gray-900 rounded-sm transition-all"
                        style={{ height: `${Math.round((v / max) * 52)}px`, minHeight: v > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-400">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const s: Record<string, string> = {
        ADMIN: 'bg-violet-50 text-violet-700',
        GIA_SU: 'bg-amber-50 text-amber-700',
        HOC_VIEN: 'bg-sky-50 text-sky-700',
    };
    const l: Record<string, string> = { ADMIN: 'Admin', GIA_SU: 'Gia sư', HOC_VIEN: 'Học viên' };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s[role] ?? 'bg-gray-100 text-gray-600'}`}>
            {l[role] ?? role}
        </span>
    );
};

// ─── Status dot ───────────────────────────────────────────────────────────────
const StatusDot: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { dot: string; label: string }> = {
        DANG_HOC: { dot: 'bg-sky-500', label: 'Đang học' },
        HOAN_THANH: { dot: 'bg-emerald-500', label: 'Hoàn thành' },
        DA_HUY: { dot: 'bg-red-400', label: 'Đã hủy' },
    };
    const { dot, label } = map[status] ?? { dot: 'bg-gray-300', label: status };
    return (
        <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            <span className="text-xs text-gray-500">{label}</span>
        </div>
    );
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; src?: string }> = ({ name, src }) => {
    const colors = ['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700'];
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden ${color}`}>
            {src ? <img src={src} alt="av" className="w-full h-full object-cover" /> : name?.charAt(0)?.toUpperCase()}
        </div>
    );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [u, c] = await Promise.all([
                userService.getUsers(),
                classService.getAllClasses(),
            ]);
            setUsers(u);
            setClasses(c);
        } catch (err: any) {
            setError(err.message || 'Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Derived stats ──
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const tutors = users.filter(u => u.role === 'GIA_SU').length;
    const students = users.filter(u => u.role === 'HOC_VIEN').length;
    const totalClasses = classes.length;
    const activeClasses = classes.filter(c => c.trangThai === 'DANG_HOC').length;
    const doneClasses = classes.filter(c => c.trangThai === 'HOAN_THANH').length;

    // Simulated weekly new users (replace with real data if available)
    const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const weekData = [3, 7, 5, 8, 4, 6, 2]; // placeholder

    const recentUsers = [...users].slice(-5).reverse();
    const recentClasses = [...classes].slice(-5).reverse();

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar active="/dashboard" onNavigate={navigate} onLogout={() => { logout(); navigate('/login'); }} />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-8 py-8">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống gia sư</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                            <p className="text-sm text-gray-500">{error}</p>
                            <button onClick={fetchAll} className="text-sm text-gray-700 underline underline-offset-2">Thử lại</button>
                        </div>
                    ) : (
                        <>
                            {/* Stat cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard
                                    label="Tổng người dùng"
                                    value={totalUsers}
                                    sub={`${activeUsers} đang hoạt động`}
                                    icon={<Users className="w-4 h-4" />}
                                    accent="bg-gray-100"
                                    iconColor="text-gray-600"
                                    onClick={() => navigate('/users')}
                                />
                                <StatCard
                                    label="Gia sư"
                                    value={tutors}
                                    sub={`${students} học viên`}
                                    icon={<GraduationCap className="w-4 h-4" />}
                                    accent="bg-amber-50"
                                    iconColor="text-amber-600"
                                />
                                <StatCard
                                    label="Lớp đang học"
                                    value={activeClasses}
                                    sub={`${totalClasses} tổng số lớp`}
                                    icon={<BookOpen className="w-4 h-4" />}
                                    accent="bg-sky-50"
                                    iconColor="text-sky-600"
                                    onClick={() => navigate('/admin/classes')}
                                />
                                <StatCard
                                    label="Lớp hoàn thành"
                                    value={doneClasses}
                                    sub={`${totalClasses > 0 ? Math.round((doneClasses / totalClasses) * 100) : 0}% tỷ lệ hoàn thành`}
                                    icon={<UserCheck className="w-4 h-4" />}
                                    accent="bg-emerald-50"
                                    iconColor="text-emerald-600"
                                />
                            </div>

                            {/* Chart + Role breakdown */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {/* Weekly registrations */}
                                <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Đăng ký trong tuần</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Người dùng mới theo ngày</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
                                            <TrendingUp className="w-3 h-3" />
                                            +12%
                                        </div>
                                    </div>
                                    <MiniBarChart data={weekData} labels={weekLabels} />
                                </div>

                                {/* Role distribution */}
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <p className="text-sm font-medium text-gray-900 mb-4">Phân bổ vai trò</p>
                                    <div className="space-y-3">
                                        {[
                                            { role: 'HOC_VIEN', label: 'Học viên', count: students, color: 'bg-sky-500' },
                                            { role: 'GIA_SU', label: 'Gia sư', count: tutors, color: 'bg-amber-400' },
                                            { role: 'ADMIN', label: 'Admin', count: users.filter(u => u.role === 'ADMIN').length, color: 'bg-violet-500' },
                                        ].map(({ label, count, color }) => (
                                            <div key={label}>
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>{label}</span>
                                                    <span className="font-medium text-gray-700">{count}</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${color} rounded-full`}
                                                        style={{ width: `${totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent tables */}
                            <div className="grid grid-cols-2 gap-4">

                                {/* Recent users */}
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900">Người dùng gần đây</p>
                                        <button
                                            onClick={() => navigate('/users')}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            Xem tất cả <ArrowUpRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {recentUsers.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-8">Không có dữ liệu</p>
                                        ) : recentUsers.map(user => (
                                            <div key={user.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Avatar name={user.fullName} src={user.avatar} />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{user.fullName}</p>
                                                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                <RoleBadge role={user.role} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent classes */}
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900">Lớp học gần đây</p>
                                        <button
                                            onClick={() => navigate('/admin/classes')}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            Xem tất cả <ArrowUpRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {recentClasses.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-8">Không có dữ liệu</p>
                                        ) : recentClasses.map(cls => (
                                            <div key={cls.maLop} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="min-w-0 flex-1 mr-3">
                                                    <p className="text-xs font-medium text-gray-800 truncate">{cls.tenMonHoc}</p>
                                                    <p className="text-[11px] text-gray-400 truncate">{cls.tenHocVien} · {cls.tenGiaSu}</p>
                                                </div>
                                                <StatusDot status={cls.trangThai} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;