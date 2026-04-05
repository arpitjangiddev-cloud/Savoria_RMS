import api from './api';
import type { Table, TableStatus, TableLocation } from '@/types';

const demoTables: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: `t-${i + 1}`,
  number: i + 1,
  capacity: [2, 4, 4, 6, 8, 2, 4, 4, 6, 2, 4, 4, 6, 8, 2, 4, 6, 4, 8, 4][i],
  location: (['indoor', 'indoor', 'indoor', 'indoor', 'indoor', 'outdoor', 'outdoor', 'outdoor', 'vip', 'vip', 'vip', 'bar', 'bar', 'bar', 'indoor', 'indoor', 'outdoor', 'vip', 'bar', 'indoor'] as const)[i],
  status: (['available', 'occupied', 'available', 'reserved', 'occupied', 'available', 'occupied', 'available', 'occupied', 'available', 'maintenance', 'available', 'occupied', 'available', 'available', 'reserved', 'available', 'occupied', 'available', 'available'] as const)[i],
  currentOrder: [1, 4, 6, 8, 12, 17].includes(i) ? { orderNumber: `#${1001 + i}`, total: 840 + i * 100 } : undefined,
}));

/** Normalize backend table document into frontend Table shape */
const normalizeTable = (raw: Record<string, unknown>): Table => {
  const currentOrder = raw.currentOrder as Record<string, unknown> | null | undefined;
  return {
    id: String(raw.id ?? raw._id ?? ''),
    number: Number(raw.number ?? 0),
    capacity: Number(raw.capacity ?? 0),
    location: (String(raw.location ?? 'indoor').toLowerCase()) as TableLocation,
    status: (raw.status as TableStatus) ?? 'available',
    currentOrder: currentOrder && typeof currentOrder === 'object' && currentOrder._id
      ? { orderNumber: String(currentOrder.orderNumber ?? ''), total: Number(currentOrder.total ?? 0) }
      : undefined,
  };
};

/** Unwrap backend envelope { success, data, count } */
const unwrapList = (res: { data: unknown }): Table[] => {
  const payload = res.data as Record<string, unknown>;
  const arr = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return arr.map((item: unknown) => normalizeTable((item ?? {}) as Record<string, unknown>));
};

const unwrapOne = (res: { data: unknown }): Table => {
  const payload = res.data as Record<string, unknown>;
  const item = (payload?.data ?? payload ?? {}) as Record<string, unknown>;
  return normalizeTable(item);
};

export const tableService = {
  getAll: async (): Promise<Table[]> => {
    try { return unwrapList(await api.get('/tables')); } catch { return demoTables; }
  },
  getAvailable: async (): Promise<Table[]> => {
    try { return unwrapList(await api.get('/tables?status=available')); }
    catch { return demoTables.filter(t => t.status === 'available'); }
  },
  create: async (payload: { number: number; capacity: number; location: string }) => {
    try { return unwrapOne(await api.post('/tables', payload)); } catch { return { id: `new-${Date.now()}`, ...payload, status: 'available' as TableStatus }; }
  },
  updateStatus: async (id: string, status: TableStatus) => {
    try { return unwrapOne(await api.patch(`/tables/${id}/status`, { status })); } catch { return { id, status }; }
  },
  delete: async (id: string) => {
    await api.delete(`/tables/${id}`);
  },
};
