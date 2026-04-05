import api from './api';
import type { StaffMember } from '@/types';

const demoStaff: StaffMember[] = [
  { id: '1', name: 'Alex Johnson', email: 'admin@restaurant.com', employeeId: 'EMP001', position: 'Head Chef', shift: 'morning', phone: '+91 98765 43210', salary: 45000, joiningDate: '2022-03-15', status: 'active', role: 'admin' },
  { id: '2', name: 'Sarah Williams', email: 'manager@restaurant.com', employeeId: 'EMP002', position: 'Floor Manager', shift: 'evening', phone: '+91 98765 43211', salary: 35000, joiningDate: '2022-06-01', status: 'active', role: 'manager' },
  { id: '3', name: 'Mike Chen', email: 'staff@restaurant.com', employeeId: 'EMP003', position: 'Waiter', shift: 'morning', phone: '+91 98765 43212', salary: 18000, joiningDate: '2023-01-10', status: 'active', role: 'staff' },
  { id: '4', name: 'Priya Sharma', email: 'priya@restaurant.com', employeeId: 'EMP004', position: 'Sous Chef', shift: 'morning', phone: '+91 98765 43213', salary: 32000, joiningDate: '2022-08-20', status: 'active', role: 'staff' },
  { id: '5', name: 'Raj Patel', email: 'raj@restaurant.com', employeeId: 'EMP005', position: 'Bartender', shift: 'evening', phone: '+91 98765 43214', salary: 22000, joiningDate: '2023-04-05', status: 'active', role: 'staff' },
  { id: '6', name: 'Aisha Khan', email: 'aisha@restaurant.com', employeeId: 'EMP006', position: 'Hostess', shift: 'evening', phone: '+91 98765 43215', salary: 20000, joiningDate: '2023-07-12', status: 'inactive', role: 'staff' },
];

/**
 * Normalize a backend staff document into a flat StaffMember.
 * Backend shape: { _id, user: { _id, name, email, role }, position, shift, phone, salary, ... }
 */
const normalizeStaff = (raw: Record<string, unknown>): StaffMember => {
  const user = (raw.user ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(user.name ?? raw.name ?? ''),
    email: String(user.email ?? raw.email ?? ''),
    employeeId: String(raw.employeeId ?? ''),
    position: String(raw.position ?? ''),
    shift: String(raw.shift ?? 'Morning').toLowerCase(),
    phone: String(raw.phone ?? ''),
    salary: Number(raw.salary ?? 0),
    joiningDate: typeof raw.joiningDate === 'string' ? raw.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
    status: raw.isActive === false ? 'inactive' : 'active',
    role: (user.role as StaffMember['role']) ?? (raw.role as StaffMember['role']) ?? 'staff',
  };
};

/** Unwrap backend envelope { success, data, count } */
const unwrapList = (res: { data: unknown }): StaffMember[] => {
  const payload = res.data as Record<string, unknown>;
  const arr = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return arr.map((item: unknown) => normalizeStaff((item ?? {}) as Record<string, unknown>));
};

const unwrapOne = (res: { data: unknown }): StaffMember => {
  const payload = res.data as Record<string, unknown>;
  const item = (payload?.data ?? payload ?? {}) as Record<string, unknown>;
  return normalizeStaff(item);
};

export const staffService = {
  getAll: async (): Promise<StaffMember[]> => {
    try { return unwrapList(await api.get('/staff')); } catch { return demoStaff; }
  },
  create: async (payload: Partial<StaffMember> & { password?: string }) => {
    try { return unwrapOne(await api.post('/staff', payload)); } catch { return { id: `new-${Date.now()}`, ...payload }; }
  },
  update: async (id: string, payload: Partial<StaffMember>) => {
    try { return unwrapOne(await api.put(`/staff/${id}`, payload)); } catch { return { id, ...payload }; }
  },
  delete: async (id: string) => {
    await api.delete(`/staff/${id}`);
  },
};
