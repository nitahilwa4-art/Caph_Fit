import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
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

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, hasProfile } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (hasProfile === false && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
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
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
            <AnimatedRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
