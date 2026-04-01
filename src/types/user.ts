// Generic API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// User Profile Interface
export interface User {
  id: string | number;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'GIA_SU' | 'HOC_VIEN';
  avatar?: string;
  phoneNumber?: string;
  isActive: boolean;
  isDelete?: boolean;
  createdAt?: string;
}

// Query Parameters for API calls
export interface UserQueryParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

