export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  avatar?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  preparationTime: number;
  image?: string;
  available: boolean;
  tags?: string[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type TableLocation = 'indoor' | 'outdoor' | 'vip' | 'bar';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  location: TableLocation;
  status: TableStatus;
  currentOrder?: { orderNumber: string; total: number };
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  position: string;
  shift: string;
  phone: string;
  salary: number;
  joiningDate: string;
  status: 'active' | 'inactive';
  role: 'admin' | 'manager' | 'staff';
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  tablesOccupied: number;
  tablesTotal: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  total: number;
  percentage: number;
}
