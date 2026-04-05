import api from './api';
import type { MenuItem } from '@/types';

const demoMenu: MenuItem[] = [
  { id: '1', name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken', price: 300, category: 'Main Course', preparationTime: 25, available: true, image: '/menu/butter-chicken.png', tags: ['popular', 'non-veg'] },
  { id: '2', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 200, category: 'Starters', preparationTime: 15, available: true, image: '/menu/paneer-tikka.png', tags: ['popular', 'veg'] },
  { id: '3', name: 'Chicken Biryani', description: 'Fragrant basmati rice with spiced chicken', price: 280, category: 'Main Course', preparationTime: 30, available: true, image: '/menu/chicken-biryani.png', tags: ['popular', 'non-veg'] },
  { id: '4', name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in sugar syrup', price: 150, category: 'Desserts', preparationTime: 10, available: true, image: '/menu/gulab-jamun.png', tags: ['sweet'] },
  { id: '5', name: 'Masala Dosa', description: 'Crispy crepe with spiced potato filling', price: 180, category: 'Main Course', preparationTime: 20, available: true, image: '/menu/dal-makhani.png', tags: ['veg'] },
  { id: '6', name: 'Mango Lassi', description: 'Sweet yogurt drink with mango', price: 120, category: 'Beverages', preparationTime: 5, available: true, image: '/menu/mango-lassi.png', tags: ['drink'] },
  { id: '7', name: 'Tandoori Chicken', description: 'Clay oven roasted chicken', price: 350, category: 'Starters', preparationTime: 20, available: true, image: '/menu/paneer-butter-masala.png', tags: ['non-veg'] },
  { id: '8', name: 'Rasmalai', description: 'Soft cheese patties in sweetened milk', price: 160, category: 'Desserts', preparationTime: 10, available: false, image: '/menu/mango-kulfi.png', tags: ['sweet'] },
  { id: '9', name: 'Chef Special Thali', description: 'Complete meal with 7 dishes', price: 450, category: 'Specials', preparationTime: 35, available: true, image: '/menu/chef-special-thali.png', tags: ['special'] },
  { id: '10', name: 'Fresh Lime Soda', description: 'Refreshing lime drink', price: 80, category: 'Beverages', preparationTime: 5, available: true, image: '/menu/fresh-lime-soda.png', tags: ['drink'] },
];

/** Normalize a single backend menu-item document into the frontend MenuItem shape */
const normalizeItem = (raw: Record<string, unknown>): MenuItem => ({
  id: String(raw.id ?? raw._id ?? ''),
  name: String(raw.name ?? ''),
  description: String(raw.description ?? ''),
  price: Number(raw.price ?? 0),
  category: String(raw.category ?? ''),
  preparationTime: Number(raw.preparationTime ?? 15),
  image: typeof raw.image === 'string' && raw.image ? raw.image : undefined,
  available: typeof raw.available === 'boolean' ? raw.available : Boolean(raw.isAvailable ?? true),
  tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
});

/** Unwrap backend envelope { success, data } or { success, data, count } */
const unwrap = <T>(res: { data: unknown }, normalizer: (r: Record<string, unknown>) => T): T[] => {
  const payload = res.data as Record<string, unknown>;
  const arr = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return arr.map((item: unknown) => normalizer((item ?? {}) as Record<string, unknown>));
};

const unwrapOne = <T>(res: { data: unknown }, normalizer: (r: Record<string, unknown>) => T): T => {
  const payload = res.data as Record<string, unknown>;
  const item = (payload?.data ?? payload ?? {}) as Record<string, unknown>;
  return normalizer(item);
};

export const menuService = {
  getAll: async (): Promise<MenuItem[]> => {
    try { return unwrap(await api.get('/menu'), normalizeItem); } catch { return demoMenu; }
  },
  create: async (payload: FormData) => {
    try { return unwrapOne(await api.post('/menu', payload, { headers: { 'Content-Type': 'multipart/form-data' } }), normalizeItem); }
    catch { return { ...demoMenu[0], id: `new-${Date.now()}`, ...Object.fromEntries(payload) }; }
  },
  update: async (id: string, payload: Partial<MenuItem> | FormData) => {
    const isForm = payload instanceof FormData;
    try {
      return unwrapOne(
        await api.put(`/menu/${id}`, payload, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
        normalizeItem,
      );
    } catch { return { id }; }
  },
  delete: async (id: string) => {
    try { return (await api.delete(`/menu/${id}`)).data; } catch { return { id }; }
  },
  toggleAvailability: async (id: string) => {
    try { return unwrapOne(await api.patch(`/menu/${id}/toggle`), normalizeItem); } catch { return { id }; }
  },
};
