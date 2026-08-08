import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ChevronRight,
  Trash2,
  Filter,
  AlertTriangle,
  History,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fetchHistory = async () => {
  const response = await api.get('/interviews/history');
  return response.data.data.interviews;
};

export default function HistoryList() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Fetch history queries
  const { data: interviews, isLoading, error } = useQuery({
    queryKey: ['interviewHistory'],
    queryFn: fetchHistory,
  });

  // 2. Deletion mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/interviews/${id}`);
    },
    onSuccess: () => {
      // Invalidate both lists and stats to ensure dashboard reflects accurate averages
      queryClient.invalidateQueries({ queryKey: ['interviewHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setDeletingId(null);
    },
    onError: (err) => {
      console.error('Failed to delete report:', err);
      setDeletingId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-900 rounded" />
            <div className="h-4 w-64 bg-zinc-900 rounded" />
          </div>
        </div>
        <div className="h-12 bg-zinc-900 rounded-lg border border-zinc-950" />
        <div className="h-96 bg-zinc-900 rounded-xl border border-zinc-950" />
      </div>
    );
  }

  if (error || !interviews) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 text-white">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold mb-2">Failed to load history</h3>
        <p className="text-sm text-zinc-550 max-w-sm mb-6">
          There was an error communicating with the database server.
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['interviewHistory'] })}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-850"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  // Filter lists
  const filteredInterviews = interviews.filter((item: any) => {
    const matchesCategory =
      categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesDifficulty =
      difficultyFilter === 'all' || item.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesCategory && matchesDifficulty;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-500';
  };

  const categories = Array.from(new Set(interviews.map((item: any) => item.category)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Interview Practice Logs</h1>
        <p className="text-zinc-400 text-sm font-light mt-1">
          Review details of your previous mock sessions or delete outdated logs.
        </p>
      </div>

      {/* Filters bar */}
      <div className="glass-card rounded-lg p-4 border border-zinc-900 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-zinc-450 text-xs font-semibold">
            <Filter className="w-4 h-4" /> FILTERS:
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
          >
            <option value="all">All Difficulties</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div className="text-[10px] text-zinc-550 font-mono">
          Showing {filteredInterviews.length} of {interviews.length} sessions
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-xl border border-zinc-900 overflow-hidden bg-zinc-950/20">
        {filteredInterviews.length === 0 ? (
          <div className="text-center py-16 px-6">
            <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-white mb-1">No Practice Sessions Found</h3>
            <p className="text-xs text-zinc-550 max-w-xs mx-auto">
              You haven't completed any sessions matching these filters yet. Go to your dashboard to start!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-400 text-xs uppercase tracking-wider bg-zinc-950/40">
                  <th className="py-4 px-6 font-medium">Category</th>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Difficulty</th>
                  <th className="py-4 px-6 font-medium">Duration</th>
                  <th className="py-4 px-6 font-medium">Score</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 bg-zinc-950/10">
                <AnimatePresence mode="popLayout">
                  {filteredInterviews.map((session: any) => (
                    <motion.tr
                      key={session._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{session.category}</div>
                        <div className="text-[10px] text-zinc-500 font-light mt-0.5">
                          {session.questions.length} questions
                        </div>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-550" />
                          {new Date(session.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-455">
                          {session.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-550" />
                          {session.duration || 'Ongoing'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {session.status === 'completed' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-purple-500 h-full"
                                style={{ width: `${session.overallScore}%` }}
                              />
                            </div>
                            <span className={`font-bold text-xs ${getScoreColor(session.overallScore)}`}>
                              {session.overallScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-purple-400 font-semibold bg-purple-950/20 px-2.5 py-0.5 rounded border border-purple-500/10">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          {session.status === 'completed' ? (
                            <Link
                              to={`/reports/${session._id}`}
                              className="inline-flex items-center gap-1 text-xs text-purple-450 hover:text-purple-350 font-semibold transition-colors"
                            >
                              Report <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <Link
                              to="/interview/session"
                              state={{
                                category: session.category.toLowerCase(),
                                categoryName: session.category,
                                difficulty: session.difficulty,
                                questionCount: session.questionCount,
                              }}
                              className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                            >
                              Resume <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => setDeletingId(session._id)}
                            className="p-1.5 rounded text-zinc-550 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setDeletingId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="glass-card rounded-xl p-6 w-full max-w-sm border border-zinc-800 bg-zinc-950 z-10 text-center">
              <div className="inline-flex p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Practice Record?</h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                Are you sure you want to delete this session? This action will permanently remove the evaluations and recalculate your dashboard progress metrics.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-805 text-zinc-400 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingId)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-650 hover:bg-red-750 text-white text-xs font-semibold transition-colors flex justify-center items-center gap-1.5"
                >
                  {deleteMutation.isPending ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
