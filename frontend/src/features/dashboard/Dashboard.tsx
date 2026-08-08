import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import CategoriesGrid from './CategoriesGrid';
import {
  TrendingUp,
  Award,
  Zap,
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { motion } from 'framer-motion';

const fetchDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data.data;
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-900 rounded" />
            <div className="h-4 w-64 bg-zinc-900 rounded" />
          </div>
          <div className="h-10 w-24 bg-zinc-900 rounded" />
        </div>

        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 border border-zinc-950 rounded-xl" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-zinc-900 border border-zinc-950 rounded-xl lg:col-span-2" />
          <div className="h-80 bg-zinc-900 border border-zinc-950 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Failed to load analytics</h3>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          There was an error communicating with the backend. Please check your database connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-850"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, charts, recentInterviews } = data;

  const statCards = [
    {
      title: 'Average Readiness',
      value: `${summary.averageScore}%`,
      sub: 'Readiness rating',
      icon: Award,
      color: 'text-purple-400',
      trend: '+4.2% from last week',
      trendUp: true,
    },
    {
      title: 'Practice Sessions',
      value: summary.totalInterviews,
      sub: 'Total completed sessions',
      icon: Activity,
      color: 'text-blue-400',
      trend: '2 scheduled upcoming',
      trendUp: true,
    },
    {
      title: 'Practice Streak',
      value: `${summary.streak} days`,
      sub: 'Keep the streak alive!',
      icon: Zap,
      color: 'text-amber-400',
      trend: 'Active daily logger',
      trendUp: true,
    },
    {
      title: 'Focus Area Required',
      value: summary.weakestArea,
      sub: 'Weakest competencies rating',
      icon: AlertCircle,
      color: 'text-rose-400',
      trend: 'Scores average 70%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-10">
      {/* 1. Header welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-zinc-400 text-sm font-light mt-1">
            Analyze your progress details and launch targeted mock sessions.
          </p>
        </div>
        <a
          href="#categories"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-650/10 transition-all text-center self-start"
        >
          Start Practice <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* 2. Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/40 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight text-white">{card.value}</h3>
                <p className="text-[10px] text-zinc-500 font-light">{card.sub}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-400">{card.trend}</span>
                {card.trendUp !== undefined && (
                  <span className={card.trendUp ? 'text-emerald-400' : 'text-rose-400'}>
                    {card.trendUp ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Charts Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly performance area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-card rounded-xl p-6 border border-zinc-900 lg:col-span-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-bold text-white">Performance Progress</h3>
              <p className="text-xs text-zinc-500 font-light">Evaluations rating score across the last 7 sessions</p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-md text-[10px] text-zinc-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Progressive Rate
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.weeklyProgress} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" opacity={0.3} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#c084fc', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Competencies Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="glass-card rounded-xl p-6 border border-zinc-900 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-md font-bold text-white">Competencies Analysis</h3>
            <p className="text-xs text-zinc-500 font-light mb-6">Subject area readiness index mapping</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={charts.competencies}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" fontSize={9} />
                <Radar name="Readiness" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 4. Recent Practice Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="glass-card rounded-xl border border-zinc-900 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/20">
          <div>
            <h3 className="text-md font-bold text-white">Recent Mock Activity</h3>
            <p className="text-xs text-zinc-500 font-light">History results from recent preparation session</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            Full Logs <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-400 text-xs uppercase tracking-wider bg-zinc-950/40">
                <th className="py-4 px-6 font-medium">Category</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium">Difficulty</th>
                <th className="py-4 px-6 font-medium">Duration</th>
                <th className="py-4 px-6 font-medium">Score</th>
                <th className="py-4 px-6 font-medium text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 bg-zinc-950/10">
              {recentInterviews.map((session: any) => (
                <tr key={session.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{session.category}</td>
                  <td className="py-4 px-6 text-zinc-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-550" />
                      {new Date(session.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-400">
                      {session.difficulty}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-zinc-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-550" />
                      {session.duration}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full"
                          style={{ width: `${session.score}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs">{session.score}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/reports/${session.id}`}
                      className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 5. Start Practice grid wrapper */}
      <CategoriesGrid />
    </div>
  );
}
