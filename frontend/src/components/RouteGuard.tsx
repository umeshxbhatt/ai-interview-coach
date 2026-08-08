import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // If state is not loaded, run checkAuth once
    if (!isAuthenticated && isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="relative flex items-center justify-center">
          {/* Outer glowing pulsing circle */}
          <div className="w-16 h-16 rounded-full border-t-2 border-purple-500 animate-spin" />
          <div className="absolute w-12 h-12 rounded-full bg-purple-500/10 glow-purple animate-pulse-slow" />
        </div>
        <p className="mt-6 text-sm text-zinc-500 font-light tracking-wide animate-pulse">
          Securing session context...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect user to login, preserving where they tried to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
