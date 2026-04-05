import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { ChefHat, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const { token, user } = await authService.register({
        name: form.name, email: form.email, password: form.password,
      });
      login(token, user);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
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
            <h1 className="font-display text-2xl font-bold text-foreground">Create Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join the Savoria team</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2 transition-shadow"
                  placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2 transition-shadow"
                  placeholder="john@restaurant.com" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none ring-ring focus:ring-2 transition-shadow"
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2 transition-shadow"
                  placeholder="Repeat password" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
