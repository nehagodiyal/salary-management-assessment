import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout.jsx';
import AuthLayout from '@/layouts/AuthLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import LoadingState from '@/components/feedback/LoadingState.jsx';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage.jsx'));
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage.jsx'));
const EmployeeDetailsPage = lazy(() =>
  import('@/pages/employees/EmployeeDetailsPage.jsx'),
);
const EmployeeCreatePage = lazy(() =>
  import('@/pages/employees/EmployeeCreatePage.jsx'),
);
const EmployeeEditPage = lazy(() =>
  import('@/pages/employees/EmployeeEditPage.jsx'),
);
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

const fallback = <LoadingState label="Loading…" height="60vh" />;

export default function AppRoutes() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        {/* Public */}
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/new" element={<EmployeeCreatePage />} />
            <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
            <Route path="/employees/:id/edit" element={<EmployeeEditPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
