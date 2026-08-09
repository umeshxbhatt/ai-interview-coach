import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import {
  Timer,
  Send,
  HelpCircle,
  AlertTriangle,
  LogOut,
  Brain,
  CheckCircle,
} from 'lucide-react';
import CategoriesGrid from '../dashboard/CategoriesGrid';
import DashboardLayout from '../../components/DashboardLayout';

interface Question {
  questionText: string;
  topic: string;
  type?: 'mcq' | 'short_answer';
  options?: string[];
}

export default function InterviewTerminal() {
  const location = useLocation();
  const navigate = useNavigate();

  // Route state parameters as local states, initialized from location.state if present
  const [localCategory, setLocalCategory] = useState<string | undefined>((location.state as any)?.category);
  const [localCategoryName, setLocalCategoryName] = useState<string | undefined>((location.state as any)?.categoryName);
  const [localDifficulty, setLocalDifficulty] = useState<'Junior' | 'Mid' | 'Senior' | undefined>((location.state as any)?.difficulty);
  const [localQuestionCount, setLocalQuestionCount] = useState<number | undefined>((location.state as any)?.questionCount);
  const [localQuestionType, setLocalQuestionType] = useState<'mixed' | 'mcq' | 'short_answer'>((location.state as any)?.questionType || 'mixed');
  const [localCustomPrompt, setLocalCustomPrompt] = useState<string | undefined>((location.state as any)?.customPrompt);

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // Timer states
  const [seconds, setSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Flow states
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showExitPrompt, setShowExitPrompt] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);
  const sessionStartedRef = useRef<string | null>(null);

  // Sync router location.state to local state variables when location changes
  useEffect(() => {
    const state = location.state as any;
    setLocalCategory(state?.category);
    setLocalCategoryName(state?.categoryName);
    setLocalDifficulty(state?.difficulty);
    setLocalQuestionCount(state?.questionCount);
    setLocalQuestionType(state?.questionType || 'mixed');
    setLocalCustomPrompt(state?.customPrompt);

    // Reset initialization states when category is cleared
    if (!state?.category) {
      setIsInitializing(true);
      setInterviewId(null);
      setQuestions([]);
      setCurrentIndex(0);
      setUserAnswer('');
      setSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      sessionStartedRef.current = null;
      setInitError(null);
    }
  }, [location]);

  // Start interview session on mount or when local states become defined
  useEffect(() => {
    if (!localCategory || initError) return;

    // Create a unique key for the current configuration to avoid duplicate starts
    const configKey = `${localCategory}-${localDifficulty}-${localQuestionCount}-${localQuestionType}-${localCustomPrompt || ''}`;
    if (sessionStartedRef.current === configKey) {
      return;
    }
    sessionStartedRef.current = configKey;

    let active = true;
    const startSession = async () => {
      try {
        console.log(`[Practice] Frontend starting session: category=${localCategory}, difficulty=${localDifficulty}, count=${localQuestionCount}, type=${localQuestionType}`);
        const startReq = Date.now();
        const response = await api.post('/interviews', {
          category: localCategory,
          difficulty: localDifficulty,
          questionCount: localQuestionCount,
          questionType: localQuestionType,
          customPrompt: localCustomPrompt,
        });
        console.log(`[Practice] Response returned: ${Date.now() - startReq} ms`);
        
        if (active) {
          const session = response.data.data.interview;
          setInterviewId(session._id);
          setQuestions(session.questions);
          setCurrentIndex(0);
          setIsInitializing(false);

          // Start timer
          timerRef.current = setInterval(() => {
            setSeconds((prev) => prev + 1);
          }, 1000);
        }
      } catch (err: any) {
        console.error('Failed to initialize interview session:', err);
        if (active) {
          const errMsg = err.response?.data?.message || err.message || 'Unknown initialization error';
          setInitError(errMsg);
          setIsInitializing(false);
        }
      }
    };

    startSession();

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [localCategory, localDifficulty, localQuestionCount, localQuestionType, localCustomPrompt, initError]);

  // Block page leave attempts (beforeunload event)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to exit? Your current interview progress will be lost.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleSubmit = async (isSkip = false) => {
    if (!interviewId || isSubmitting) return;

    setIsSubmitting(true);
    const answerToSend = isSkip ? 'Skipped.' : userAnswer;

    try {
      const response = await api.post(`/interviews/${interviewId}/submit`, {
        userAnswer: answerToSend,
      });

      const { isCompleted, interview } = response.data.data;

      if (isCompleted) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Navigate to reports page
        navigate(`/reports/${interviewId}`, { replace: true });
      } else {
        // Move to next question
        setCurrentIndex(interview.currentQuestionIndex);
        setUserAnswer('');
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Time formatter
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!localCategory) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Start Practice Session</h1>
            <p className="text-zinc-400 text-sm font-light mt-1">
              Select a category to begin your AI-powered mock interview.
            </p>
          </div>
          <CategoriesGrid onStart={(settings) => {
            setLocalCategory(settings.category);
            setLocalCategoryName(settings.categoryName);
            setLocalDifficulty(settings.difficulty);
            setLocalQuestionCount(settings.questionCount);
            setLocalQuestionType(settings.questionType);
            setLocalCustomPrompt(settings.customPrompt);
          }} />
        </div>
      </DashboardLayout>
    );
  }

  if (initError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white px-4 py-12">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2">Practice Session Failed</h2>
          <p className="text-zinc-400 text-xs font-light text-center max-w-md leading-relaxed mb-6">
            {initError}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setInitError(null);
                setLocalCategory(undefined);
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 hover:text-white hover:bg-zinc-850 transition-all"
            >
              Back to Settings
            </button>
            <button
              onClick={() => {
                setInitError(null);
                setIsInitializing(true);
                sessionStartedRef.current = null;
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-650/15 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-t-2 border-purple-500 animate-spin" />
          <Brain className="absolute w-6 h-6 text-purple-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold mb-2">Curating Interview Matrix</h2>
        <p className="text-zinc-500 text-xs font-light text-center max-w-xs leading-relaxed">
          Gemini is analyzing your focus areas to build a tailored set of mock questions...
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* 1. Sidebar progress status */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between z-10">
        <div className="space-y-8">
          {/* Top category meta */}
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
              Active Session
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">{localCategoryName}</h2>
            <div className="flex gap-2 items-center mt-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-zinc-400">
                {localDifficulty} Level
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-zinc-400">
                {localQuestionCount} Questions
              </span>
            </div>
          </div>

          {/* Progress list checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Interview Steps
            </h3>
            <div className="space-y-2">
              {questions.map((q, idx) => {
                const isPast = idx < currentIndex;
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-650/10 border-purple-500/35 text-purple-400'
                        : isPast
                        ? 'bg-zinc-900/20 border-zinc-900/60 text-zinc-500'
                        : 'border-transparent text-zinc-600'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <HelpCircle className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-zinc-650'}`} />
                    )}
                    <span className="truncate">Question {idx + 1}: {q.topic}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="pt-6 border-t border-zinc-900 mt-8 lg:mt-0">
          <button
            onClick={() => setShowExitPrompt(true)}
            className="flex items-center gap-2 justify-center w-full py-2.5 rounded-lg border border-red-500/20 text-red-400 bg-red-950/10 hover:bg-red-950/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Terminate Practice
          </button>
        </div>
      </aside>

      {/* 2. Main Question console */}
      <main className="flex-1 flex flex-col justify-between p-6 md:p-10 relative">
        {/* Top bar info */}
        <div className="flex justify-between items-center pb-6 border-b border-zinc-900 mb-8">
          <div>
            <span className="text-xs text-zinc-500">Progress Tracker</span>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-32 bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono">{currentIndex + 1}/{questions.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 font-mono text-sm font-semibold">
            <Timer className="w-4 h-4" />
            {formatTime(seconds)}
          </div>
        </div>

        {/* Question & Answer Panels */}
        <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[10px] font-semibold uppercase tracking-wider">
                Topic: {currentQuestion.topic}
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-relaxed">
                {currentQuestion.questionText}
              </h1>
            </motion.div>
          </AnimatePresence>

          {currentQuestion.type === 'mcq' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-550">
                Select your answer option
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(currentQuestion.options || []).map((option, oIdx) => {
                  const isSelected = userAnswer === option;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setUserAnswer(option)}
                      className={`w-full p-4 text-left rounded-xl border text-sm font-medium transition-all duration-200 disabled:opacity-60 ${
                        isSelected
                          ? 'bg-purple-650/10 border-purple-500 text-purple-400 shadow-md shadow-purple-500/5'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-zinc-700 bg-zinc-905 text-zinc-550'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="flex-1 leading-snug">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-550">
                Type your response below
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isSubmitting}
                rows={8}
                className="block w-full p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-sm text-white placeholder-zinc-650 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 leading-relaxed disabled:opacity-50 resize-none"
                placeholder="Structure your answer clearly. Explain key terms, tradeoffs, and architectural examples where appropriate..."
              />
              <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1">
                <span>Press Submit when finished</span>
                <span>{userAnswer.length} characters</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-8 border-t border-zinc-900 mt-12 flex flex-col sm:flex-row gap-4 justify-between max-w-3xl mx-auto w-full">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip Question
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || !userAnswer.trim()}
            className="px-6 py-3 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/40 disabled:text-zinc-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Analyzing Response...
              </>
            ) : (
              <>
                Submit & Next <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* Exit Prompt Modal */}
      <AnimatePresence>
        {showExitPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowExitPrompt(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="glass-card rounded-xl p-6 w-full max-w-sm border border-zinc-800 bg-zinc-950 z-10 text-center">
              <div className="inline-flex p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Abandon Session?</h3>
              <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                Are you sure you want to exit? Your current answer evaluations and practice score will not be saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitPrompt(false)}
                  className="flex-1 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    navigate('/dashboard');
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-650 hover:bg-red-750 text-white text-xs font-semibold transition-colors"
                >
                  Exit Practice
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
