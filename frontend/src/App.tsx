import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OrdersPage from "@/pages/OrdersPage";
import MenuPage from "@/pages/MenuPage";
import TablesPage from "@/pages/TablesPage";
import StaffPage from "@/pages/StaffPage";
import SettingsPage from "@/pages/SettingsPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/** Redirect "/" based on role: admin/manager → dashboard, staff → orders */
function RootRedirect() {
  const { user } = useAuth();
  if (user?.role === 'staff') return <Navigate to="/orders" replace />;
  return <Navigate to="/dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '0.75rem', fontSize: '0.875rem' },
      }} />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<RoleRoute roles={['admin', 'manager']}><DashboardPage /></RoleRoute>} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/staff" element={<RoleRoute roles={['admin', 'manager']}><StaffPage /></RoleRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
