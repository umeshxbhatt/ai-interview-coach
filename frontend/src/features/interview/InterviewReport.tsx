import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Award,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Calendar,
  Clock,
  ThumbsUp,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useState } from 'react';

const fetchInterviewReport = async (id: string) => {
  const response = await api.get(`/interviews/${id}/report`);
  return response.data.data.interview;
};

export default function InterviewReport() {
  const { id } = useParams<{ id: string }>();
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  const { data: interview, isLoading, error } = useQuery({
    queryKey: ['interviewReport', id],
    queryFn: () => fetchInterviewReport(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin mb-4" />
        <p className="text-zinc-550 text-xs font-light">Aggregating AI diagnostics...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-black text-white">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Report Not Found</h3>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          This report may have been deleted, or you do not have permission to view it.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-semibold text-white"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Map subdocument evaluation parameters to chart format
  const radarData = [
    { subject: 'Technical', value: interview.technicalScore || 0 },
    { subject: 'Communication', value: interview.communicationScore || 0 },
    { subject: 'Confidence', value: interview.confidenceScore || 0 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getReadinessColor = (readiness: string) => {
    if (readiness === 'High') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (readiness === 'Medium') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-450';
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-4 md:px-8 max-w-5xl mx-auto space-y-10">
      {/* 1. Top navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-zinc-900">
        <div className="space-y-1.5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Performance Matrix</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getReadinessColor(interview.feedbackReport?.readiness || 'Medium')}`}>
              {interview.feedbackReport?.readiness} Readiness
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-zinc-500 text-xs mt-1">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {interview.category}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(interview.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {interview.duration || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Score panels & radar summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score cards list */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Overall Score</span>
              <h2 className={`text-4xl font-extrabold tracking-tight ${getScoreColor(interview.overallScore || 0)}`}>
                {interview.overallScore}%
              </h2>
            </div>
            <div className="glass-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Technical</span>
              <h2 className={`text-4xl font-extrabold tracking-tight ${getScoreColor(interview.technicalScore || 0)}`}>
                {interview.technicalScore}%
              </h2>
            </div>
            <div className="glass-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Communication</span>
              <h2 className={`text-4xl font-extrabold tracking-tight ${getScoreColor(interview.communicationScore || 0)}`}>
                {interview.communicationScore}%
              </h2>
            </div>
          </div>

          {/* Key recommendations */}
          <div className="glass-card rounded-xl p-6 border border-zinc-900 bg-zinc-950/20 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Award className="w-5 h-5" />
              <h3 className="font-bold text-sm">AI Performance Suggestions</h3>
            </div>
            <p className="text-xs text-zinc-350 leading-relaxed font-light">
              {interview.feedbackReport?.suggestions}
            </p>
            
            <div className="pt-2">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Key Areas to Revise</span>
              <div className="flex flex-wrap gap-2">
                {interview.feedbackReport?.topicsToRevise.map((topic: string) => (
                  <span
                    key={topic}
                    className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Radar metrics */}
        <div className="glass-card rounded-xl p-6 border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between items-center">
          <div className="w-full text-left">
            <h3 className="font-bold text-sm text-white">Competencies Index</h3>
            <p className="text-[10px] text-zinc-550 font-light mt-0.5">Vector competency rating breakdown</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" fontSize={8} />
                <Radar name="Scoring" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Detailed Question accordions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-white mb-2">Detailed Questions Analysis</h2>
        
        <div className="space-y-3">
          {interview.questions.map((q: any, idx: number) => {
            const isExpanded = expandedQuestion === idx;
            const avgQScore = Math.round(((q.technicalScore || 0) + (q.communicationScore || 0)) / 2);
            return (
              <div
                key={idx}
                className="glass-card rounded-xl border border-zinc-900 overflow-hidden transition-all duration-300"
              >
                {/* Accordion header */}
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-zinc-900/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                        Question {idx + 1} &middot; {q.topic}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-1 leading-snug max-w-2xl pr-4">
                        {q.questionText}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-zinc-550 block">Accuracy</span>
                      <span className={`text-xs font-bold ${getScoreColor(avgQScore)}`}>{avgQScore}%</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                  </div>
                </button>

                {/* Accordion body */}
                {isExpanded && (
                  <div className="p-5 border-t border-zinc-900 bg-zinc-950/20 space-y-6 text-xs leading-relaxed font-light">
                    {/* User response */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Your Answer</span>
                      <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {q.userAnswer || 'No response provided.'}
                      </div>
                    </div>

                    {/* Ideal answer */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ideal Reference</span>
                      <div className="p-4 rounded-lg bg-purple-950/10 border border-purple-500/10 text-purple-300 leading-relaxed font-light">
                        {q.idealAnswer}
                      </div>
                    </div>

                    {/* Combined score telemetry & AI review */}
                    <div className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Technical Accuracy</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${getScoreColor(q.technicalScore || 0)}`} />
                          <span className={`font-bold ${getScoreColor(q.technicalScore || 0)}`}>{q.technicalScore}%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Communication Quality</span>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className={`w-4 h-4 ${getScoreColor(q.communicationScore || 0)}`} />
                          <span className={`font-bold ${getScoreColor(q.communicationScore || 0)}`}>{q.communicationScore}%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI feedback evaluation</span>
                        <p className="text-zinc-400 mt-1">{q.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
