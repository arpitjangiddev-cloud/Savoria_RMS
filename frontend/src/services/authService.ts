import api from './api';
import type { User } from '@/types';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }
export interface LoginResponse { token: string; user: User; }

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@restaurant.com', password: 'admin123' },
  manager: { email: 'manager@restaurant.com', password: 'manager123' },
  staff: { email: 'staff@restaurant.com', password: 'staff123' },
};

const normalizeUser = (raw: Record<string, unknown>): User => ({
  id: String(raw.id ?? raw._id ?? ''),
  name: String(raw.name ?? ''),
  email: String(raw.email ?? ''),
  role: (raw.role as User['role']) ?? 'staff',
  avatar: typeof raw.avatar === 'string' ? raw.avatar : undefined,
});

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const { data } = await api.post('/auth/login', payload);
      return { token: data.token, user: normalizeUser(data.user) };
    } catch {
      // Demo fallback
      const demo = Object.entries(DEMO_CREDENTIALS).find(
        ([, cred]) => cred.email === payload.email && cred.password === payload.password
      );
      if (demo) {
        const [role] = demo;
        const user: User = {
          id: `demo-${role}`,
          name: role === 'admin' ? 'Alex Johnson' : role === 'manager' ? 'Sarah Williams' : 'Mike Chen',
          email: payload.email,
          role: role as User['role'],
        };
        return { token: `demo-token-${role}`, user };
      }
      throw new Error('Invalid email or password');
    }
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/register', payload);
    return { token: data.token, user: normalizeUser(data.user) };
  },
};
