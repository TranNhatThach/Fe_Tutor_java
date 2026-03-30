import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface Class {
  maLop: number;
  tenHocVien: string;
  tenGiaSu: string;
  tenMonHoc: string;
  trangThai: string;
  lichHoc?: string;
  ghiChu?: string;
  hocPhiThoaThuan?: number;
  ngayBatDau?: string;
  tongSoBuoi?: number;
  soBuoiConLai?: number;
}

export interface BuoiHoc {
  maBuoi: number;
  maLop: number;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  trangThai: string; // CHUA_HOC | DA_HOC
}

export function useShared() {
  const queryClient = useQueryClient();

  const getMyClasses = () =>
    useQuery({
      queryKey: ['my-classes'],
      queryFn: () => apiClient<Class[]>('/lop-hoc/cua-toi'),
    });

  const updateSchedule = useMutation({
    mutationFn: ({ id, lichHoc, ghiChu }: { id: number; lichHoc: string; ghiChu?: string }) =>
      apiClient(`/lop-hoc/${id}/lich-hoc`, {
        method: 'PUT',
        params: {
          lichHoc,
          ghiChu: ghiChu || ''
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient(`/lop-hoc/${id}/status`, {
        method: 'PUT',
        params: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });

  const setCongSoBuoi = useMutation({
    mutationFn: ({ id, tongSoBuoi }: { id: number; tongSoBuoi: number }) =>
      apiClient<Class>(`/lop-hoc/${id}/so-buoi`, {
        method: 'PUT',
        params: { tongSoBuoi },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });

  // Hoàn thành 1 buổi học (giảm countdown + tạo record DA_HOC)
  const hoanThanhBuoi = useMutation({
    mutationFn: (maLop: number) =>
      apiClient<Class>(`/lop-hoc/${maLop}/hoan-thanh-buoi`, {
        method: 'POST',
      }),
    onSuccess: (_data, maLop) => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
      queryClient.invalidateQueries({ queryKey: ['buoi-hoc', maLop] });
    },
  });

  // ── Buổi Học ────────────────────────────────────────────────────

  const getBuoiHocByLop = (maLop: number) =>
    useQuery({
      queryKey: ['buoi-hoc', maLop],
      queryFn: () => apiClient<BuoiHoc[]>(`/buoi-hoc/lop/${maLop}`),
      enabled: !!maLop,
    });

  const createBuoiHoc = useMutation({
    mutationFn: (body: { maLop: number; thoiGianBatDau: string; thoiGianKetThuc: string }) =>
      apiClient<BuoiHoc>('/buoi-hoc', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buoi-hoc', variables.maLop] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });

  const markBuoiHocDone = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string; maLop: number }) =>
      apiClient<BuoiHoc>(`/buoi-hoc/${id}/status`, {
        method: 'PUT',
        params: { status },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buoi-hoc', variables.maLop] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });

  const deleteBuoiHoc = useMutation({
    mutationFn: ({ id }: { id: number; maLop: number }) =>
      apiClient(`/buoi-hoc/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buoi-hoc', variables.maLop] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });

  return {
    getMyClasses,
    updateSchedule,
    updateStatus,
    setCongSoBuoi,
    hoanThanhBuoi,
    getBuoiHocByLop,
    createBuoiHoc,
    markBuoiHocDone,
    deleteBuoiHoc,
  };
}
