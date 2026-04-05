import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, User, Lock, Store, ChefHat } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  /* Password change */
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/update-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password updated successfully');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to update password. Check current password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in pb-16 lg:pb-0">

      {/* Profile Card */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{user?.role}</span>
        </div>
      </div>

      {/* Appearance */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display text-base font-semibold flex items-center gap-2">
          {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
          </div>
          <button onClick={() => setDark(!dark)}
            className={`relative h-7 w-12 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card shadow transition-transform ${dark ? 'left-[26px]' : 'left-1'}`}>
              {dark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            </span>
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display text-base font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Current Password</label>
            <input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
              className="input-field mt-1" placeholder="Enter current password" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">New Password</label>
              <input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
                className="input-field mt-1" placeholder="Min. 6 characters" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
              <input type="password" value={pw.confirmPassword} onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
                className="input-field mt-1" placeholder="Confirm new password" required />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={pwLoading} className="btn-primary">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Restaurant Info */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display text-base font-semibold flex items-center gap-2">
          <Store className="h-4 w-4" />
          Restaurant Info
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Name', value: 'Savoria Restaurant' },
            { label: 'Type', value: 'Multi-cuisine Fine Dining' },
            { label: 'Hours', value: '11:00 AM – 11:00 PM' },
            { label: 'Currency', value: '₹ INR (Indian Rupee)' },
            { label: 'Tax Rate', value: '5% GST' },
            { label: 'Capacity', value: '12 Tables' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
              <ChefHat className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
