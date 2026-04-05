import api from './api';
import type { DashboardStats, RevenueData, TopItem, CategorySales, Order } from '@/types';

// Demo data
const demoStats: DashboardStats = {
  todayRevenue: 48520, todayOrders: 64, pendingOrders: 8, tablesOccupied: 12, tablesTotal: 20,
};

const generateRevenue = (days: number): RevenueData[] =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().split('T')[0], revenue: 30000 + Math.random() * 30000, orders: 40 + Math.floor(Math.random() * 40) };
  });

const demoTopItems: TopItem[] = [
  { name: 'Butter Chicken', quantity: 45, revenue: 13500 },
  { name: 'Paneer Tikka', quantity: 38, revenue: 7600 },
  { name: 'Biryani', quantity: 35, revenue: 10500 },
  { name: 'Gulab Jamun', quantity: 32, revenue: 4800 },
  { name: 'Masala Dosa', quantity: 28, revenue: 5600 },
];

const demoCategorySales: CategorySales[] = [
  { category: 'Main Course', total: 24000, percentage: 42 },
  { category: 'Starters', total: 12000, percentage: 21 },
  { category: 'Beverages', total: 8500, percentage: 15 },
  { category: 'Desserts', total: 7000, percentage: 12 },
  { category: 'Specials', total: 5500, percentage: 10 },
];

const demoRecentOrders: Order[] = Array.from({ length: 8 }, (_, i) => ({
  id: `order-${i}`, orderNumber: `#${1001 + i}`, tableId: `t-${i}`, tableNumber: i + 1,
  items: [{ menuItemId: '1', name: 'Butter Chicken', quantity: 2, price: 300 }],
  total: 600 + i * 120, status: (['pending', 'preparing', 'ready', 'served', 'cancelled'] as const)[i % 5],
  paymentStatus: i % 3 === 0 ? 'paid' : 'unpaid' as const, createdAt: new Date(Date.now() - i * 600000).toISOString(), updatedAt: new Date().toISOString(),
}));

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeOverview = (payload: unknown): DashboardStats => {
  const data = (unwrapData<Record<string, unknown>>(payload) || {}) as Record<string, unknown>;
  const tablesOccupied = toNumber(data.tablesOccupied ?? data.occupiedTables);
  const tablesTotalRaw = data.tablesTotal ?? data.totalTables;
  const tablesTotal = tablesTotalRaw != null
    ? toNumber(tablesTotalRaw)
    : toNumber(data.availableTables) + tablesOccupied;

  return {
    todayRevenue: toNumber(data.todayRevenue),
    todayOrders: toNumber(data.todayOrders),
    pendingOrders: toNumber(data.pendingOrders),
    tablesOccupied,
    tablesTotal,
  };
};

const normalizeRevenue = (payload: unknown): RevenueData[] => {
  const data = unwrapData<unknown[]>(payload);
  if (!Array.isArray(data)) return [];
  return data.map((entry) => {
    const row = (entry || {}) as Record<string, unknown>;
    return {
      date: typeof row.date === 'string' ? row.date : new Date().toISOString().split('T')[0],
      revenue: toNumber(row.revenue),
      orders: toNumber(row.orders),
    };
  });
};

const normalizeTopItems = (payload: unknown): TopItem[] => {
  const data = unwrapData<unknown[]>(payload);
  if (!Array.isArray(data)) return [];
  return data.map((entry, idx) => {
    const row = (entry || {}) as Record<string, unknown>;
    return {
      name: typeof row.name === 'string' && row.name.trim().length > 0 ? row.name : `Item ${idx + 1}`,
      quantity: toNumber(row.quantity),
      revenue: toNumber(row.revenue),
    };
  });
};

const normalizeCategorySales = (payload: unknown): CategorySales[] => {
  const data = unwrapData<unknown[]>(payload);
  if (!Array.isArray(data)) return [];

  const rows = data.map((entry, idx) => {
    const row = (entry || {}) as Record<string, unknown>;
    return {
      category: typeof row.category === 'string'
        ? row.category
        : typeof row._id === 'string'
          ? row._id
          : `Category ${idx + 1}`,
      total: toNumber(row.total ?? row.revenue),
      percentage: toNumber(row.percentage),
    };
  });

  const totalSales = rows.reduce((sum, row) => sum + row.total, 0);
  return rows.map((row) => ({
    ...row,
    percentage: row.percentage > 0
      ? row.percentage
      : totalSales > 0
        ? Math.round((row.total / totalSales) * 100)
        : 0,
  }));
};

const ORDER_STATUSES: Order['status'][] = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
const PAYMENT_STATUSES: Order['paymentStatus'][] = ['paid', 'unpaid'];

const toOrderStatus = (value: unknown): Order['status'] =>
  ORDER_STATUSES.includes(value as Order['status']) ? (value as Order['status']) : 'pending';

const toPaymentStatus = (value: unknown): Order['paymentStatus'] =>
  PAYMENT_STATUSES.includes(value as Order['paymentStatus']) ? (value as Order['paymentStatus']) : 'unpaid';

const normalizeRecentOrders = (payload: unknown): Order[] => {
  const data = unwrapData<unknown[]>(payload);
  if (!Array.isArray(data)) return [];

  return data.map((entry, idx) => {
    const row = (entry || {}) as Record<string, unknown>;
    const rawItems = Array.isArray(row.items) ? row.items : [];
    const createdAt = typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString();

    return {
      id: String(row.id ?? row._id ?? `order-${idx}`),
      orderNumber: typeof row.orderNumber === 'string' ? row.orderNumber : `#${1000 + idx}`,
      tableId: String(row.tableId ?? (row.table as Record<string, unknown> | undefined)?._id ?? ''),
      tableNumber: toNumber(row.tableNumber ?? (row.table as Record<string, unknown> | undefined)?.number),
      items: rawItems.map((item) => {
        const i = (item || {}) as Record<string, unknown>;
        return {
          menuItemId: String(i.menuItemId ?? i.menuItem ?? ''),
          name: typeof i.name === 'string' ? i.name : 'Item',
          quantity: Math.max(1, toNumber(i.quantity, 1)),
          price: toNumber(i.price ?? i.subtotal),
          notes: typeof i.notes === 'string' ? i.notes : undefined,
        };
      }),
      total: toNumber(row.total),
      status: toOrderStatus(row.status),
      paymentStatus: toPaymentStatus(row.paymentStatus),
      paymentMethod: typeof row.paymentMethod === 'string' ? row.paymentMethod : undefined,
      createdAt,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : createdAt,
    };
  });
};

export const statsService = {
  getOverview: async (): Promise<DashboardStats> => {
    try { return normalizeOverview((await api.get('/stats/overview')).data); } catch { return demoStats; }
  },
  getRevenue: async (period = 7): Promise<RevenueData[]> => {
    try {
      const data = normalizeRevenue((await api.get(`/stats/revenue?period=${period}`)).data);
      return data.length > 0 ? data : generateRevenue(period);
    } catch {
      return generateRevenue(period);
    }
  },
  getTopItems: async (): Promise<TopItem[]> => {
    try {
      const data = normalizeTopItems((await api.get('/stats/top-items')).data);
      return data.length > 0 ? data : demoTopItems;
    } catch {
      return demoTopItems;
    }
  },
  getCategorySales: async (): Promise<CategorySales[]> => {
    try {
      const data = normalizeCategorySales((await api.get('/stats/category-sales')).data);
      return data.length > 0 ? data : demoCategorySales;
    } catch {
      return demoCategorySales;
    }
  },
  getRecentOrders: async (): Promise<Order[]> => {
    try {
      const data = normalizeRecentOrders((await api.get('/stats/recent-orders')).data);
      return data.length > 0 ? data : demoRecentOrders;
    } catch {
      return demoRecentOrders;
    }
  },
};
