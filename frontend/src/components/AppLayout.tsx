import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, Grid3X3, Users, Settings,
  Bell, LogOut, Menu, X, ChefHat,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/tables', label: 'Tables', icon: Grid3X3 },
  { to: '/staff', label: 'Staff', icon: Users, roles: ['admin', 'manager'] },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const roleBadgeClass: Record<string, string> = {
  admin: 'bg-destructive/20 text-destructive',
  manager: 'bg-info/20 text-info',
  staff: 'bg-success/20 text-success',
};

const pageTitle: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/menu': 'Menu',
  '/tables': 'Tables',
  '/staff': 'Staff',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  const currentTime = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-sidebar-primary-foreground">Savoria</h1>
            <p className="text-xs text-sidebar-foreground/60">Restaurant Dashboard</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {filteredNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-primary-foreground">{user?.name}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${roleBadgeClass[user?.role || 'staff']}`}>
                {user?.role}
              </span>
            </div>
            <button onClick={logout} className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive transition-colors" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button className="lg:hidden rounded-lg p-2 hover:bg-secondary" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg font-semibold">{pageTitle[location.pathname] || 'Dashboard'}</h2>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">{currentTime}</span>
            <button className="relative rounded-lg p-2 hover:bg-secondary">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card lg:hidden">
        {filteredNav.slice(0, 5).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
