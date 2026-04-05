import api from './api';
import type { Order, OrderStatus, OrderItem } from '@/types';

const demoOrders: Order[] = Array.from({ length: 15 }, (_, i) => ({
  id: `order-${i}`,
  orderNumber: `#${1001 + i}`,
  tableId: `t-${(i % 10) + 1}`,
  tableNumber: (i % 10) + 1,
  items: [
    { menuItemId: '1', name: 'Butter Chicken', quantity: 2, price: 300 },
    { menuItemId: '2', name: 'Naan', quantity: 4, price: 60 },
    ...(i % 3 === 0 ? [{ menuItemId: '3', name: 'Mango Lassi', quantity: 2, price: 120 }] : []),
  ],
  total: 840 + (i % 3 === 0 ? 240 : 0),
  status: (['pending', 'preparing', 'ready', 'served', 'cancelled'] as const)[i % 5],
  paymentStatus: (i % 2 === 0 ? 'paid' : 'unpaid') as 'paid' | 'unpaid',
  paymentMethod: i % 2 === 0 ? 'card' : undefined,
  createdAt: new Date(Date.now() - i * 900000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

/** Normalize a backend order document into the frontend Order shape */
const normalizeOrder = (raw: Record<string, unknown>): Order => {
  const table = (raw.table ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();

  return {
    id: String(raw.id ?? raw._id ?? ''),
    orderNumber: String(raw.orderNumber ?? ''),
    tableId: String(raw.tableId ?? table._id ?? ''),
    tableNumber: Number(raw.tableNumber ?? table.number ?? 0),
    items: rawItems.map((item: unknown) => {
      const i = (item ?? {}) as Record<string, unknown>;
      return {
        menuItemId: String(i.menuItemId ?? i.menuItem ?? ''),
        name: typeof i.name === 'string' ? i.name : 'Item',
        quantity: Math.max(1, Number(i.quantity ?? 1)),
        price: Number(i.price ?? i.subtotal ?? 0),
        notes: typeof i.notes === 'string' ? i.notes : undefined,
      };
    }),
    total: Number(raw.total ?? 0),
    status: (['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(raw.status as string)
      ? raw.status : 'pending') as OrderStatus,
    paymentStatus: raw.paymentStatus === 'paid' ? 'paid' : 'unpaid',
    paymentMethod: typeof raw.paymentMethod === 'string' ? raw.paymentMethod : undefined,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
};

/** Unwrap backend paginated envelope { success, data, count, total, pages } */
const unwrapList = (res: { data: unknown }): Order[] => {
  const payload = res.data as Record<string, unknown>;
  const arr = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return arr.map((item: unknown) => normalizeOrder((item ?? {}) as Record<string, unknown>));
};

const unwrapOne = (res: { data: unknown }): Order => {
  const payload = res.data as Record<string, unknown>;
  const item = (payload?.data ?? payload ?? {}) as Record<string, unknown>;
  return normalizeOrder(item);
};

export const orderService = {
  getAll: async (): Promise<Order[]> => {
    try { return unwrapList(await api.get('/orders')); } catch { return demoOrders; }
  },
  create: async (payload: { tableId: string; items: Omit<OrderItem, 'name'>[]; }) => {
    try { return unwrapOne(await api.post('/orders', payload)); } catch { return { ...demoOrders[0], id: `new-${Date.now()}` }; }
  },
  updateStatus: async (id: string, status: OrderStatus) => {
    try { return unwrapOne(await api.patch(`/orders/${id}/status`, { status })); } catch { return { id, status }; }
  },
  updatePayment: async (id: string, paymentMethod: string) => {
    try { return unwrapOne(await api.patch(`/orders/${id}/payment`, { paymentMethod })); } catch { return { id, paymentMethod }; }
  },
};
