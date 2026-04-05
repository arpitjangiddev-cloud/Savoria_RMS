import { useState, useEffect } from 'react';
import { statsService } from '@/services/statsService';
import type { DashboardStats, RevenueData, TopItem, CategorySales, Order } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { CardSkeleton } from '@/components/Skeletons';
import { DollarSign, ShoppingBag, Clock, Grid3X3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
const timeAgo = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const PIE_COLORS = ['hsl(245,58%,51%)', 'hsl(263,70%,58%)', 'hsl(217,91%,60%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)'];

/** Reads CSS var at runtime so charts adapt to dark mode */
const cssVar = (name: string) => {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!val) return undefined;
  return `hsl(${val})`;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [catSales, setCatSales] = useState<CategorySales[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(true);
  const [chartColors, setChartColors] = useState({ grid: 'hsl(220,16%,90%)', text: 'hsl(220,10%,46%)', primary: 'hsl(245,58%,51%)' });

  useEffect(() => {
    // Resolve chart colors from CSS custom properties
    const resolveColors = () => {
      setChartColors({
        grid: cssVar('--chart-grid') ?? 'hsl(220,16%,90%)',
        text: cssVar('--chart-text') ?? 'hsl(220,10%,46%)',
        primary: cssVar('--primary') ?? 'hsl(245,58%,51%)',
      });
    };
    resolveColors();
    // Re-resolve when dark mode toggles
    const obs = new MutationObserver(resolveColors);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([
      statsService.getOverview(),
      statsService.getRevenue(period),
      statsService.getTopItems(),
      statsService.getCategorySales(),
      statsService.getRecentOrders(),
    ]).then(([s, r, t, c, o]) => {
      setStats(s); setRevenue(r); setTopItems(t); setCatSales(c); setRecentOrders(o);
      setLoading(false);
    });
  }, [period]);

  if (loading || !stats) return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );

  const kpis = [
    { label: "Today's Revenue", value: fmt(stats.todayRevenue), icon: DollarSign, color: 'text-success bg-success/10' },
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'text-info bg-info/10' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-warning bg-warning/10' },
    { label: 'Tables Occupied', value: `${stats.tablesOccupied}/${stats.tablesTotal}`, icon: Grid3X3, color: 'text-accent bg-accent/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-0">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">{k.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card-elevated p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Revenue Overview</h3>
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${period === d ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >{d}d</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.text }} tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
            <YAxis tick={{ fontSize: 11, fill: chartColors.text }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.75rem' }} />
            <Area type="monotone" dataKey="revenue" stroke={chartColors.primary} fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two column */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Items */}
        <div className="card-elevated p-5">
          <h3 className="mb-4 font-display text-base font-semibold">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis type="number" tick={{ fontSize: 11, fill: chartColors.text }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: chartColors.text }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.75rem' }} />
              <Bar dataKey="quantity" fill={chartColors.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Sales */}
        <div className="card-elevated p-5">
          <h3 className="mb-4 font-display text-base font-semibold">Category Sales</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={catSales} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {catSales.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', fontSize: '0.75rem' }} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-elevated overflow-hidden">
        <div className="p-5 pb-3"><h3 className="font-display text-base font-semibold">Recent Orders</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3">Order</th><th className="px-5 py-3">Table</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Time</th>
            </tr></thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-5 py-3">Table {o.tableNumber}</td>
                  <td className="px-5 py-3">{o.items.length} items</td>
                  <td className="px-5 py-3 font-medium">{fmt(o.total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
