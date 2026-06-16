import { Suspense, lazy, type ReactNode } from 'react';
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
import CitizenLayout from './components/citizen/CitizenLayout';
import { Loader2 } from 'lucide-react';

const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const WaterpointsPage = lazy(() => import('./pages/admin/WaterpointsPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AdminInvitesPage = lazy(() => import('./pages/admin/AdminInvitesPage'));
const AdminDedupePage = lazy(() => import('./pages/admin/AdminDedupePage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const CitizenOverview = lazy(() => import('./pages/citizen/CitizenOverview'));
const CitizenExplorePage = lazy(() => import('./pages/citizen/CitizenExplorePage'));
const CitizenReportsPage = lazy(() => import('./pages/citizen/CitizenReportsPage'));
const CitizenCommunityPage = lazy(() => import('./pages/citizen/CitizenCommunityPage'));
const CitizenSettingsPage = lazy(() => import('./pages/citizen/CitizenSettingsPage'));

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );
}

function RoleRoute({ children, allowedRole, redirectTo }: { children: ReactNode; allowedRole: UserRole; redirectTo: string }) {
  const { user, userRole, loading } = useAuth();
  if (loading) {
    return <FullScreenLoader />;
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
    <Suspense fallback={<FullScreenLoader />}>
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
          <Route path="users" element={<UsersPage />} />
          <Route path="waterpoints" element={<WaterpointsPage />} />
          <Route path="dedupe" element={<AdminDedupePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="invites" element={<AdminInvitesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
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
          <Route path="settings" element={<CitizenSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
