import 'server-only';
import type { Appointment, AppointmentStatus } from '@/types/database';

export interface AppointmentWithService extends Appointment {
  service: { name: string; slug: string } | null;
}

export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus | 'all';
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export const APPOINTMENT_PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export interface AppointmentStats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  newMessages: number;
  activeServices: number;
  upcoming: number;
}
