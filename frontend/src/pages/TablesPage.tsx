import { useState, useEffect } from 'react';
import { tableService } from '@/services/tableService';
import { useAuth } from '@/contexts/AuthContext';
import type { Table, TableLocation, TableStatus } from '@/types';
import { CardSkeleton } from '@/components/Skeletons';
import { Plus, Users, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
const locations: (TableLocation | 'all')[] = ['all', 'indoor', 'outdoor', 'vip', 'bar'];
const statusColors: Record<TableStatus, string> = {
  available: 'bg-success', occupied: 'bg-destructive', reserved: 'bg-warning', maintenance: 'bg-muted-foreground',
};
const statusBg: Record<TableStatus, string> = {
  available: 'border-success/30', occupied: 'border-destructive/30', reserved: 'border-warning/30', maintenance: 'border-border',
};
const allStatuses: TableStatus[] = ['available', 'reserved', 'occupied', 'maintenance'];

export default function TablesPage() {
  const { isAdmin, isManager } = useAuth();
  const canEdit = isAdmin || isManager;
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [locFilter, setLocFilter] = useState<TableLocation | 'all'>('all');
  const [selected, setSelected] = useState<Table | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    tableService.getAll().then(d => { setTables(d); setLoading(false); });
  }, []);

  const filtered = tables.filter(t => locFilter === 'all' || t.location === locFilter);

  const handleStatusChange = async (table: Table, status: TableStatus) => {
    try {
      await tableService.updateStatus(table.id, status);
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, status } : t));
      setSelected(prev => prev && prev.id === table.id ? { ...prev, status } : prev);
      toast.success(`Table ${table.number} → ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Delete Table ${table.number}?`)) return;
    try {
      await tableService.delete(table.id);
      setTables(prev => prev.filter(t => t.id !== table.id));
      setSelected(null);
      toast.success(`Table ${table.number} deleted`);
    } catch {
      toast.error('Failed to delete table');
    }
  };

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in pb-16 lg:pb-0">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-3 text-xs text-muted-foreground">
          {(Object.entries(statusColors) as [TableStatus, string][]).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5 capitalize">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />{status}
            </span>
          ))}
        </div>
        {canEdit && (
          <button onClick={() => setShowAdd(true)} className="btn-primary ml-auto flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Table
          </button>
        )}
      </div>

      {/* Location filter */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        {locations.map(l => (
          <button key={l} onClick={() => setLocFilter(l)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${locFilter === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >{l}</button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map(table => (
          <button key={table.id} onClick={() => setSelected(table)}
            className={`card-elevated border-2 p-4 text-left transition-all hover:shadow-lg ${statusBg[table.status]}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-2xl font-bold">{table.number}</span>
              <span className={`h-3 w-3 rounded-full ${statusColors[table.status]}`} />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3" /> {table.capacity} seats
            </div>
            <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">{table.location}</span>
            {table.currentOrder && (
              <div className="mt-2 rounded-md bg-primary/10 px-2 py-1 text-[10px] text-primary">
                {table.currentOrder.orderNumber} · {fmt(table.currentOrder.total)}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm bg-card h-full border-l border-border p-6 animate-slide-in overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">Table {selected.number}</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${statusColors[selected.status]}`} />
                <span className="text-sm capitalize font-medium">{selected.status}</span>
              </div>
              <div className="text-sm"><span className="text-muted-foreground">Capacity:</span> {selected.capacity} seats</div>
              <div className="text-sm"><span className="text-muted-foreground">Location:</span> <span className="capitalize">{selected.location}</span></div>
              {selected.currentOrder && (
                <div className="card-elevated p-3 space-y-1">
                  <p className="text-sm font-semibold">Current Order</p>
                  <p className="text-sm">{selected.currentOrder.orderNumber}</p>
                  <p className="text-sm font-semibold text-primary">{fmt(selected.currentOrder.total)}</p>
                </div>
              )}

              {/* Status change buttons */}
              {canEdit && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground">Change Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allStatuses.map(s => (
                      <button key={s} onClick={() => handleStatusChange(selected, s)}
                        disabled={selected.status === s}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                          selected.status === s
                            ? 'bg-primary text-primary-foreground cursor-default'
                            : 'border border-border hover:bg-secondary'
                        }`}>
                        <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${statusColors[s]}`} />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete button (admin only) */}
              {isAdmin && (
                <button onClick={() => handleDelete(selected)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors mt-4">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Table
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddTableModal onClose={() => setShowAdd(false)} onAdded={t => { setTables(prev => [...prev, t as Table]); setShowAdd(false); }} />}
    </div>
  );
}

function AddTableModal({ onClose, onAdded }: { onClose: () => void; onAdded: (t: unknown) => void }) {
  const [form, setForm] = useState({ number: '', capacity: '', location: 'indoor' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number || !form.capacity) { toast.error('All fields required'); return; }
    const result = await tableService.create({ number: Number(form.number), capacity: Number(form.capacity), location: form.location });
    toast.success('Table added');
    onAdded(result);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold mb-4">Add Table</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="Table number" className="input-field" />
          <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="Capacity" className="input-field" />
          <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="input-field">
            {['indoor', 'outdoor', 'vip', 'bar'].map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}
