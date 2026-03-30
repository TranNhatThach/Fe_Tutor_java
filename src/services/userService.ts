import { apiClient } from '../api/client';
import { User, UserQueryParams } from '../types/user';


/**
 * User Service
 * Handles all API calls related to Users
 */
const userService = {
  /**
   * Fetch all users with optional filtering
   */
  getUsers: async (params?: UserQueryParams): Promise<User[]> => {
    const data = await apiClient('/users/show', { params });
    
    // Map backend TaiKhoan entity to frontend User interface
    return Array.isArray(data) ? data.map((item: any) => ({
      id: item.maTaiKhoan,
      username: item.email || '',
      fullName: item.hoTen || 'Chưa cập nhật',
      email: item.email,
      role: item.vaiTro || 'USER',
      phoneNumber: item.soDienThoai,
      isActive: item.trangThai === 'HOAT_DONG',
      createdAt: item.ngayTao,
    })) : [];
  },




  /**
   * Fetch a single user by ID
   */
  getUserById: async (id: string | number): Promise<User> => {
    return apiClient(`/users/${id}`);
  },


  /**
   * Create a new user
   */
  createUser: async (userData: Partial<User>): Promise<User> => {
    return apiClient('/users', { method: 'POST', body: JSON.stringify(userData) });
  },


  /**
   * Update an existing user
   */
  updateUser: async (id: string | number, userData: Partial<User>): Promise<User> => {
    return apiClient(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
  },


  /**
   * Delete a user
   */
  deleteUser: async (id: string | number): Promise<void> => {
    return apiClient(`/users/${id}`, { method: 'DELETE' });
  },

};

export default userService;
