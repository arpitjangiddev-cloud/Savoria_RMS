import { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';
import { useAuth } from '@/contexts/AuthContext';
import type { StaffMember } from '@/types';
import { CardSkeleton } from '@/components/Skeletons';
import { Plus, Search, Users, UserCheck, Clock, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

const positionBadge: Record<string, string> = {
  'Head Chef': 'bg-destructive/15 text-destructive',
  'Sous Chef': 'bg-warning/15 text-warning',
  'Floor Manager': 'bg-info/15 text-info',
  Waiter: 'bg-success/15 text-success',
  Bartender: 'bg-accent/15 text-accent',
  Hostess: 'bg-primary/15 text-primary',
};
const shiftBadge: Record<string, string> = {
  morning: 'bg-warning/10 text-warning',
  evening: 'bg-info/10 text-info',
  night: 'bg-accent/10 text-accent',
};

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  useEffect(() => {
    staffService.getAll().then(d => { setStaff(d); setLoading(false); });
  }, []);

  const filtered = staff.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = staff.filter(s => s.status === 'active').length;

  const handleDelete = async (s: StaffMember) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      await staffService.delete(s.id);
      setStaff(prev => prev.filter(x => x.id !== s.id));
      toast.success('Staff member removed');
    } catch {
      toast.error('Failed to delete staff');
    }
  };

  if (loading) return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}</div></div>;

  return (
    <div className="space-y-4 animate-fade-in pb-16 lg:pb-0">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Staff', value: staff.length, icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Active Today', value: activeCount, icon: UserCheck, color: 'text-success bg-success/10' },
          { label: 'On Shift', value: staff.filter(s => s.shift === 'morning').length, icon: Clock, color: 'text-info bg-info/10' },
        ].map(s => (
          <div key={s.label} className="card-elevated p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="font-display text-xl font-bold">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field w-64 pl-9" placeholder="Search staff..." />
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary ml-auto flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Employee ID</th><th className="px-5 py-3">Position</th>
              <th className="px-5 py-3">Shift</th><th className="px-5 py-3">Salary</th><th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{s.employeeId}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${positionBadge[s.position] || 'bg-muted text-muted-foreground'}`}>{s.position}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${shiftBadge[s.shift] || 'bg-muted text-muted-foreground'}`}>{s.shift}</span>
                  </td>
                  <td className="px-5 py-3 font-medium">{fmt(s.salary)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(s); setShowModal(true); }}
                        className="rounded p-1.5 hover:bg-secondary text-muted-foreground" title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(s)}
                          className="rounded p-1.5 hover:bg-destructive/10 text-destructive" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StaffModal
          item={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={s => {
            if (editing) {
              setStaff(prev => prev.map(x => x.id === (s as StaffMember).id ? s as StaffMember : x));
            } else {
              setStaff(prev => [...prev, s as StaffMember]);
            }
            setShowModal(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Add / Edit Staff Modal ──────────────────── */
function StaffModal({ item, onClose, onSaved }: { item?: StaffMember | null; onClose: () => void; onSaved: (s: unknown) => void }) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    email: item?.email ?? '',
    password: '',
    role: item?.role ?? 'staff',
    position: item?.position ?? '',
    shift: item?.shift ?? 'morning',
    phone: item?.phone ?? '',
    salary: item?.salary?.toString() ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (!item && !form.password) { toast.error('Password required for new staff'); return; }

    try {
      if (item) {
        const body: Record<string, unknown> = { ...form, salary: Number(form.salary) };
        if (!body.password) delete body.password; // Don't send empty password
        const result = await staffService.update(item.id, body as any);
        toast.success('Staff member updated');
        onSaved(result);
      } else {
        const result = await staffService.create({
          ...form,
          salary: Number(form.salary),
          status: 'active',
          employeeId: `EMP${Date.now().toString().slice(-4)}`,
          joiningDate: new Date().toISOString().split('T')[0],
        } as any);
        toast.success('Staff member added');
        onSaved(result);
      }
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">{item ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="input-field" />
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="input-field" />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={item ? 'New password (leave blank to keep)' : 'Password'} className="input-field" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'manager' | 'staff' }))} className="input-field">
              <option value="staff">Staff</option><option value="manager">Manager</option>
            </select>
            <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Position" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} className="input-field">
              <option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option>
            </select>
            <input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="Salary (₹)" className="input-field" />
          </div>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="input-field" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{item ? 'Save Changes' : 'Add Staff'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
