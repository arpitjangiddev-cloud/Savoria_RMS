import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService, DEMO_CREDENTIALS } from '@/services/authService';
import { ChefHat, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { token, user } = await authService.login({ email, password });
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'staff' ? '/orders' : '/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: keyof typeof DEMO_CREDENTIALS) => {
    setEmail(DEMO_CREDENTIALS[role].email);
    setPassword(DEMO_CREDENTIALS[role].password);
    setLoading(true);
    try {
      const { token, user } = await authService.login(DEMO_CREDENTIALS[role]);
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'staff' ? '/orders' : '/dashboard');
    } catch {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card-elevated p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <ChefHat className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Welcome to Savoria</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your restaurant</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2 transition-shadow"
                  placeholder="admin@restaurant.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none ring-ring focus:ring-2 transition-shadow"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">Quick Demo Login</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'manager', 'staff'] as const).map(role => (
                <button
                  key={role} onClick={() => demoLogin(role)} disabled={loading}
                  className="rounded-lg border border-border bg-secondary py-2 text-xs font-semibold capitalize text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
