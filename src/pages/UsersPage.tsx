import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User } from '../types/user';
import userService from '../services/userService';
import { Loader2, AlertCircle, UserPlus, Search, RefreshCw, Trash2, Edit, LogOut } from 'lucide-react';

const UsersPage: React.FC = () => {
  // 1. State Management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  // 2. Fetch Data Function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Một lỗi không xác định đã xảy ra. Vui lòng thử lại sau.');
    } finally {

      setLoading(false);
    }
  }, []);

  // Filtered Users logic
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower));
    
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    
    return matchesSearch && matchesRole;
  });

  // 3. Lifecycle Hooks
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 4. UI Handlers
  const handleRefresh = () => fetchUsers();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.')) {
      try {
        await userService.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        alert(err.message || 'Xóa người dùng thất bại. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Quản Lý Người Dùng
          </h1>
          <p className="text-gray-500 mt-1">Danh sách tất cả người dùng trong hệ thống Spring Boot của bạn.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            title="Tải lại"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all duration-200 active:scale-95">
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Thêm Mới</span>
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          
          <button 
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all duration-200 active:scale-95 border border-red-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Filter/Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email, hoặc tên đăng nhập..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="GIA_SU">Gia sư</option>
          <option value="HOC_VIEN">Học viên</option>
        </select>
      </div>

      {/* Main Content (Loading/Error/Success States) */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium italic">Đang tải dữ liệu từ API...</p>
          </div>
        ) : error && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Không thể kết nối với API</h3>
            <p className="text-gray-500 mt-2 max-w-md">{error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Vai Trò</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                          {user.avatar ? <img src={user.avatar} alt="Avatar" /> : user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                          user.role === 'GIA_SU' ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm font-medium text-gray-600">
                          {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa người dùng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 italic">
                Không tìm thấy người dùng nào phù hợp.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <div>
          Hiển thị <strong>{filteredUsers.length}</strong> người dùng
        </div>
        <div className="flex gap-2">
          <span>Base URL (API):</span>
          <code className="text-indigo-600 font-bold bg-indigo-50 px-2 rounded">
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}
          </code>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
