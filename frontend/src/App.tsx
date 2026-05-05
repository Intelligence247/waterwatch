import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { UserRole } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CitizenLoginPage from './pages/auth/CitizenLoginPage';
import CitizenRegisterPage from './pages/auth/CitizenRegisterPage';
import AdminLayout from './components/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import WaterpointsPage from './pages/admin/WaterpointsPage';
import ReportsPage from './pages/admin/ReportsPage';
import CitizenLayout from './components/citizen/CitizenLayout';
import CitizenOverview from './pages/citizen/CitizenOverview';
import CitizenExplorePage from './pages/citizen/CitizenExplorePage';
import CitizenReportsPage from './pages/citizen/CitizenReportsPage';
import CitizenCommunityPage from './pages/citizen/CitizenCommunityPage';
import { Loader2 } from 'lucide-react';

function RoleRoute({ children, allowedRole, redirectTo }: { children: React.ReactNode; allowedRole: UserRole; redirectTo: string }) {
  const { user, userRole, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to={redirectTo} replace />;
  if (userRole !== allowedRole) {
    // Redirect to the correct dashboard for their role
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'citizen') return <Navigate to="/citizen" replace />;
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/map" element={<MapPage />} />

      {/* Admin Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Citizen Auth */}
      <Route path="/citizen/login" element={<CitizenLoginPage />} />
      <Route path="/citizen/register" element={<CitizenRegisterPage />} />

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRole="admin" redirectTo="/login">
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="waterpoints" element={<WaterpointsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Citizen Dashboard */}
      <Route
        path="/citizen"
        element={
          <RoleRoute allowedRole="citizen" redirectTo="/citizen/login">
            <CitizenLayout />
          </RoleRoute>
        }
      >
        <Route index element={<CitizenOverview />} />
        <Route path="explore" element={<CitizenExplorePage />} />
        <Route path="reports" element={<CitizenReportsPage />} />
        <Route path="community" element={<CitizenCommunityPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
