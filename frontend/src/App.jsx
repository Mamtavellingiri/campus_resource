import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SmartBookingPage from './pages/SmartBookingPage';
import ResourceCatalogPage from './pages/ResourceCatalogPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import BookingCalendarPage from './pages/BookingCalendarPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminResourceMgmtPage from './pages/AdminResourceMgmtPage';
import AdminBookingMgmtPage from './pages/AdminBookingMgmtPage';
import MaintenanceMgmtPage from './pages/MaintenanceMgmtPage';
import EnergyAnalyticsPage from './pages/EnergyAnalyticsPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-xs text-slate-400">Verifying session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on actual user role
    if (user.role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'FACULTY') return <Navigate to="/dashboard/faculty" replace />;
    return <Navigate to="/dashboard/student" replace />;
  }
  return children;
};

// Root index redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LandingPage />;
  if (user.role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/dashboard/faculty" replace />;
  return <Navigate to="/dashboard/student" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Landing & Auth Pages */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dashboard & App Pages Wrapped in Layout */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/faculty"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Smart Booking */}
            <Route
              path="/booking/smart"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <SmartBookingPage />
                </ProtectedRoute>
              }
            />

            {/* Catalog & Resource Details */}
            <Route path="/resources" element={<ResourceCatalogPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />

            {/* Calendar & History */}
            <Route path="/calendar" element={<BookingCalendarPage />} />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <BookingHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Notifications & Profile */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/feedback" element={<FeedbackPage />} />

            {/* Admin Management Routes */}
            <Route
              path="/admin/resources"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminResourceMgmtPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <AdminBookingMgmtPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/maintenance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MaintenanceMgmtPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/energy"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']}>
                  <EnergyAnalyticsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}
