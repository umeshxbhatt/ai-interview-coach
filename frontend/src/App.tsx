import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RouteGuard from './components/RouteGuard';
import DashboardLayout from './components/DashboardLayout';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Dashboard from './features/dashboard/Dashboard';
import InterviewTerminal from './features/interview/InterviewTerminal';
import InterviewReport from './features/interview/InterviewReport';
import HistoryList from './features/history/HistoryList';
import ResumeAnalyzer from './features/resume/ResumeAnalyzer';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function HomePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.1)_0,transparent_100%)] pointer-events-none" />
      <div className="z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm mb-6 animate-pulse-slow">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Active: InterviewAI Phase 2 Auth
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="text-gradient">InterviewAI</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          Prepare for technical, behavioral, and system design interviews with real-time semantic evaluations and AI analysis.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Sign In to Start
          </Link>
          <Link
            to="/signup"
            className="px-8 py-3 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-medium transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-6 text-zinc-600 text-sm font-light">
        InterviewAI &copy; {new Date().getFullYear()} &middot; Built with React 19 + TypeScript + FastAPI
      </footer>
    </div>
  );
}

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-black">
      <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
      <p className="text-zinc-400 mb-6">This section is currently under development.</p>
      <Link to="/" className="text-purple-400 hover:underline">Go Back Home</Link>
    </div>
  );
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePlaceholder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <RouteGuard>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </RouteGuard>
            }
          />
          <Route
            path="/interview/session"
            element={
              <RouteGuard>
                <InterviewTerminal />
              </RouteGuard>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <RouteGuard>
                <InterviewReport />
              </RouteGuard>
            }
          />
          <Route
            path="/history"
            element={
              <RouteGuard>
                <DashboardLayout>
                  <HistoryList />
                </DashboardLayout>
              </RouteGuard>
            }
          />
          <Route
            path="/resume"
            element={
              <RouteGuard>
                <DashboardLayout>
                  <ResumeAnalyzer />
                </DashboardLayout>
              </RouteGuard>
            }
          />
          <Route path="*" element={<PagePlaceholder title="404 - Not Found" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
