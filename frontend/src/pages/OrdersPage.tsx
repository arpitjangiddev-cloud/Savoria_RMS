import { useState, useEffect } from 'react';
import { orderService } from '@/services/orderService';
import { menuService } from '@/services/menuService';
import { tableService } from '@/services/tableService';
import type { Order, OrderStatus, MenuItem, Table } from '@/types';
import { StatusBadge, PaymentBadge } from '@/components/StatusBadge';
import { CardSkeleton } from '@/components/Skeletons';
import { Plus, Search, Minus, ShoppingCart, X } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
const timeAgo = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const statuses: (OrderStatus | 'all')[] = ['all', 'pending', 'preparing', 'ready', 'served', 'cancelled'];
const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing', preparing: 'ready', ready: 'served', served: null, cancelled: null,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchOrders = async () => {
    const data = await orderService.getAll();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => search === '' || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.tableNumber.toString().includes(search));

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    await orderService.updateStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success(`Order updated to ${status}`);
  };

  const handlePayment = async (id: string) => {
    await orderService.updatePayment(id, 'card');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'paid' as const } : o));
    toast.success('Payment recorded');
  };

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in pb-16 lg:pb-0">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >{s}</button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field w-48 pl-9"
            placeholder="Search orders..."
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* Orders grid */}
      {filtered.length === 0 ? (
        <div className="card-elevated flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><ShoppingCart className="h-5 w-5" /></div>
          <p className="mt-3 text-sm font-medium">No orders found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(order => (
            <div key={order.id} className="card-elevated p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display text-sm font-bold">{order.orderNumber}</span>
                  <span className="ml-2 text-xs text-muted-foreground">Table {order.tableNumber}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-sm font-semibold">{fmt(order.total)}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PaymentBadge status={order.paymentStatus} />
                  {order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
                    <button onClick={() => handlePayment(order.id)}
                      className="rounded-md bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success hover:bg-success/20 transition-colors"
                    >Pay</button>
                  )}
                </div>
              </div>

              {nextStatus[order.status] && (
                <button onClick={() => handleStatusUpdate(order.id, nextStatus[order.status]!)}
                  className="btn-primary w-full py-2 text-xs"
                >
                  Mark as {nextStatus[order.status]}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchOrders(); }} />}
    </div>
  );
}

/* ─── Create Order Modal ──────────────────────────────── */
interface CartItem { menuItem: MenuItem; quantity: number; notes: string; }

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategory, setMenuCategory] = useState('All');

  useEffect(() => {
    tableService.getAvailable().then(setTables);
    menuService.getAll().then(items => setMenuItems(items.filter(i => i.available)));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItem.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const tax = parseFloat((subtotal * 0.05).toFixed(2));
  const total = subtotal + tax;

  const filteredMenu = menuItems
    .filter(i => menuCategory === 'All' || i.category === menuCategory)
    .filter(i => !menuSearch || i.name.toLowerCase().includes(menuSearch.toLowerCase()));

  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category)))];

  const handleSubmit = async () => {
    if (!selectedTable || cart.length === 0) return;
    setSubmitting(true);
    try {
      await orderService.create({
        tableId: selectedTable.id,
        items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity, price: c.menuItem.price })),
      });
      toast.success('Order created successfully!');
      onCreated();
    } catch {
      toast.error('Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold">
            {step === 1 ? 'Select Table' : step === 2 ? 'Add Items' : 'Review Order'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-8 rounded transition-colors ${step > s ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Select Table */}
        {step === 1 && (
          <div className="space-y-3">
            {tables.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No available tables</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {tables.map(t => (
                  <button key={t.id} onClick={() => setSelectedTable(t)}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${selectedTable?.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <span className="font-display text-xl font-bold">{t.number}</span>
                    <p className="text-[10px] text-muted-foreground">{t.capacity} seats · <span className="capitalize">{t.location}</span></p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => { if (selectedTable) setStep(2); else toast.error('Select a table'); }}
                className="btn-primary">Next →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Add Items */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
                {categories.map(c => (
                  <button key={c} onClick={() => setMenuCategory(c)}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${menuCategory === c ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >{c}</button>
                ))}
              </div>
              <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                className="input-field w-36 text-xs" placeholder="Search..." />
            </div>

            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {filteredMenu.map(item => {
                const inCart = cart.find(c => c.menuItem.id === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-secondary/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{fmt(item.price)} · {item.category}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary hover:bg-destructive/10 transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="w-5 text-center text-xs font-bold">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary hover:bg-primary/10 transition-colors"><Plus className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors">Add</button>
                    )}
                  </div>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Cart ({cart.reduce((s, c) => s + c.quantity, 0)} items)</p>
                {cart.map(c => (
                  <div key={c.menuItem.id} className="flex justify-between text-xs">
                    <span>{c.menuItem.name} × {c.quantity}</span>
                    <span className="font-medium">{fmt(c.menuItem.price * c.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
              <button onClick={() => { if (cart.length === 0) toast.error('Add at least one item'); else setStep(3); }}
                className="btn-primary">Review →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Table</span>
                <span className="font-semibold">Table {selectedTable?.number} ({selectedTable?.capacity} seats)</span>
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                {cart.map(c => (
                  <div key={c.menuItem.id} className="flex justify-between text-sm">
                    <span>{c.menuItem.name} × {c.quantity}</span>
                    <span className="font-medium">{fmt(c.menuItem.price * c.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (5%)</span><span>{fmt(tax)}</span></div>
                <div className="flex justify-between font-display text-base font-bold"><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
