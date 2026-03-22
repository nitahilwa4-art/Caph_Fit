import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/layout/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import NutritionLog from './pages/NutritionLog';
import WorkoutGenerator from './pages/WorkoutGenerator';
import WorkoutHistory from './pages/WorkoutHistory';
import Settings from './pages/Settings';
import DailyDetail from './pages/DailyDetail';
import AIAnalysis from './pages/AIAnalysis';
import { AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, hasProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (hasProfile === false && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

// Pages that get bottom navigation
const tabRoutes = ['/', '/nutrition', '/daily-detail', '/settings'];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const showBottomNav = tabRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className={showBottomNav ? '' : 'pb-0'}>
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/daily-detail" element={<PrivateRoute><DailyDetail /></PrivateRoute>} />
          <Route path="/ai-analysis" element={<PrivateRoute><AIAnalysis /></PrivateRoute>} />
          <Route path="/nutrition" element={<PrivateRoute><NutritionLog /></PrivateRoute>} />
          <Route path="/workout" element={<PrivateRoute><WorkoutGenerator /></PrivateRoute>} />
          <Route path="/workout-history" element={<PrivateRoute><WorkoutHistory /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
