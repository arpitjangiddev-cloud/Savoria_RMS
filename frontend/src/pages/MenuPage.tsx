import { useState, useEffect, useRef } from 'react';
import { menuService } from '@/services/menuService';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/types';
import { CardSkeleton } from '@/components/Skeletons';
import { Plus, Search, Clock, Edit2, Trash2, UtensilsCrossed, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials'];

export default function MenuPage() {
  const { isAdmin, isManager } = useAuth();
  const canEdit = isAdmin || isManager;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  useEffect(() => {
    menuService.getAll().then(d => { setItems(d); setLoading(false); });
  }, []);

  const filtered = items
    .filter(i => category === 'All' || i.category === category)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => !availableOnly || i.available);

  const toggleAvail = async (item: MenuItem) => {
    await menuService.toggleAvailability(item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    toast.success(`${item.name} ${!item.available ? 'available' : 'unavailable'}`);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await menuService.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success('Item deleted');
  };

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in pb-16 lg:pb-0">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${category === c ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >{c}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field w-48 pl-9" placeholder="Search menu..." />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
          Available only
        </label>
        {canEdit && (
          <button onClick={() => setShowAdd(true)} className="btn-primary ml-auto flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card-elevated flex flex-col items-center justify-center py-16 text-muted-foreground">
          <UtensilsCrossed className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">No menu items found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <div key={item.id} className={`card-elevated overflow-hidden transition-opacity ${!item.available ? 'opacity-60' : ''}`}>
              <div className="aspect-video bg-secondary flex items-center justify-center">
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  : <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30" />}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold">{item.name}</h3>
                    <span className="inline-block mt-1 rounded-full bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{item.category}</span>
                  </div>
                  <p className="font-display text-lg font-bold text-primary">{fmt(item.price)}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {item.preparationTime} min
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <>
                        <button onClick={() => toggleAvail(item)}
                          className={`relative h-5 w-9 rounded-full transition-colors ${item.available ? 'bg-success' : 'bg-muted'}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${item.available ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                        <button onClick={() => setEditing(item)} className="rounded p-1 hover:bg-secondary text-muted-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(item)} className="rounded p-1 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <MenuItemModal onClose={() => setShowAdd(false)} onSaved={item => { setItems(prev => [...prev, item as MenuItem]); setShowAdd(false); }} />}
      {editing && <MenuItemModal item={editing} onClose={() => setEditing(null)} onSaved={updated => { setItems(prev => prev.map(i => i.id === (updated as MenuItem).id ? updated as MenuItem : i)); setEditing(null); }} />}
    </div>
  );
}

/* ─── Add / Edit Modal with Image Upload ──────────────────── */
function MenuItemModal({ item, onClose, onSaved }: { item?: MenuItem; onClose: () => void; onSaved: (item: unknown) => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price?.toString() ?? '',
    category: item?.category ?? 'Main Course',
    preparationTime: item?.preparationTime?.toString() ?? '15',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category', form.category);
    fd.append('preparationTime', form.preparationTime || '15');
    if (imageFile) fd.append('image', imageFile);

    try {
      if (item) {
        const result = await menuService.update(item.id, fd as any);
        toast.success('Item updated');
        onSaved(result);
      } else {
        const result = await menuService.create(fd);
        toast.success('Item added');
        onSaved(result);
      }
    } catch {
      toast.error('Failed to save item');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 hover:border-primary/50 transition-colors overflow-hidden">
              {imagePreview
                ? <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
            </button>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">{imageFile ? imageFile.name : 'Click to upload image'}</p>
              <p>JPG, PNG, WebP · max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          </div>

          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name" className="input-field" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="input-field" rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price (₹)" className="input-field" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
              {['Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input type="number" value={form.preparationTime} onChange={e => setForm(f => ({ ...f, preparationTime: e.target.value }))} placeholder="Prep time (min)" className="input-field" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{item ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
