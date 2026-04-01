import { apiClient } from '../api/client';

export interface ClassInfo {
  maLop: number;
  tenHocVien: string;
  tenGiaSu: string;
  tenMonHoc: string;
  hocPhiThoaThuan: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
  lichHoc: string;
  tongSoBuoi: number;
  soBuoiConLai: number;
}

const classService = {
  getAllClasses: async (): Promise<ClassInfo[]> => {
    return apiClient('/lop-hoc/all');
  },

  updateClassStatus: async (id: number, status: string): Promise<ClassInfo> => {
    return apiClient(`/lop-hoc/${id}/status?status=${status}`, { method: 'PUT' });
  }
};

export default classService;
