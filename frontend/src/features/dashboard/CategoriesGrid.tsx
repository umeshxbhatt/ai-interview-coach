import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Server,
  Layers,
  Database,
  Brain,
  MessageSquare,
  Users,
  Compass,
  Zap,
  Play,
  X,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: any;
  difficultyScale: string;
  tags: string[];
}

interface CategoriesGridProps {
  onStart?: (settings: {
    category: string;
    categoryName: string;
    difficulty: 'Junior' | 'Mid' | 'Senior';
    questionCount: number;
    questionType: 'mixed' | 'mcq' | 'short_answer';
    customPrompt?: string;
  }) => void;
}

export default function CategoriesGrid({ onStart }: CategoriesGridProps = {}) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<'Junior' | 'Mid' | 'Senior'>('Mid');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<'mixed' | 'mcq' | 'short_answer'>('mixed');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const categories: Category[] = [
    {
      id: 'frontend',
      name: 'Frontend Engineering',
      description: 'Test knowledge in React 19, DOM, CSS specificity, performance tuning, and build configs.',
      icon: Code,
      difficultyScale: 'Junior to Senior',
      tags: ['React', 'TS', 'Vite', 'CSS'],
    },
    {
      id: 'backend',
      name: 'Backend Engineering',
      description: 'Cover API design, caching structures, ORMs, message queues, and DB indexing models.',
      icon: Server,
      difficultyScale: 'Junior to Senior',
      tags: ['Node.js', 'SQL', 'Redis', 'Express'],
    },
    {
      id: 'fullstack',
      name: 'Full Stack Engineering',
      description: 'Integrate client-server states, handling authentication flow, CORS, and deployment architecture.',
      icon: Layers,
      difficultyScale: 'Junior to Senior',
      tags: ['Next.js', 'Mongoose', 'REST'],
    },
    {
      id: 'ml',
      name: 'Machine Learning',
      description: 'Scrutinize ML modeling lifecycles, neural nets, feature engineering, and model deployment.',
      icon: Brain,
      difficultyScale: 'Junior to Senior',
      tags: ['PyTorch', 'FastAPI', 'Pandas'],
    },
    {
      id: 'systemdesign',
      name: 'System Design',
      description: 'Evaluate sharding models, rate limiters, CDN paths, microservices, and global consensus.',
      icon: Database,
      difficultyScale: 'Mid to Senior',
      tags: ['Scalability', 'NoSQL', 'Kafka'],
    },
    {
      id: 'behavioral',
      name: 'Behavioral prep',
      description: 'STAR framework evaluation testing conflict resolution, ownership, and project leadership.',
      icon: MessageSquare,
      difficultyScale: 'All levels',
      tags: ['STAR Method', 'Leadership'],
    },
    {
      id: 'hr',
      name: 'HR & General Interview',
      description: 'Prepare for background checks, salary negotiations, and cultural expectations.',
      icon: Users,
      difficultyScale: 'All levels',
      tags: ['Career Goals', 'Culture fit'],
    },
    {
      id: 'custom',
      name: 'Custom Interview',
      description: 'Paste a specific job description or target curriculum to let Gemini curate custom questions.',
      icon: Compass,
      difficultyScale: 'Flexible',
      tags: ['Custom prompts', 'Targeted prep'],
    },
  ];

  const handleStartInterview = () => {
    if (!selectedCategory) return;
    
    const settings = {
      category: selectedCategory.id,
      categoryName: selectedCategory.name,
      difficulty,
      questionCount,
      questionType,
      ...(selectedCategory.id === 'custom' && { customPrompt }),
    };

    if (onStart) {
      onStart(settings);
    } else {
      navigate('/interview/session', {
        state: settings,
      });
    }
  };

  return (
    <div id="categories" className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Select Practice Category
        </h2>
        <p className="text-sm text-zinc-400 font-light">
          Choose a specialized pathway. Each session triggers a custom AI interviewer session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.id}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedCategory(category)}
              className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer relative flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:text-purple-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                    {category.difficultyScale}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{category.name}</h3>
                <p className="text-xs text-zinc-450 font-light leading-relaxed mb-4">
                  {category.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-auto">
                {category.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategory(null)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl w-full max-w-lg overflow-hidden z-10 border border-zinc-800 bg-zinc-900/90 shadow-2xl relative"
            >
              {/* Modal header */}
              <div className="flex justify-between items-center p-6 border-b border-zinc-850">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-md">Configure Interview</h3>
                    <p className="text-[11px] text-zinc-500 font-light">{selectedCategory.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 rounded-md hover:bg-zinc-850 text-zinc-400 hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-6">
                {/* 1. Custom prompt text area for custom interviews */}
                {selectedCategory.id === 'custom' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Curation Focus / Job Description
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                      className="block w-full p-3 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      placeholder="Paste Job Description, target concepts, or specific role constraints (e.g. 'Stripe Backend Internship interview focusing on SQL performance')."
                    />
                  </div>
                )}

                {/* 2. Difficulty selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Junior', 'Mid', 'Senior'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`py-2 px-4 rounded-lg text-xs font-semibold border transition-all ${
                          difficulty === level
                            ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/5'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-450 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Number of questions selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Session Length (Questions Count)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[5, 10, 15].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`py-2 px-4 rounded-lg text-xs font-semibold border transition-all ${
                          questionCount === count
                            ? 'bg-purple-660/10 border-purple-500 text-purple-400'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-450 hover:text-white'
                        }`}
                      >
                        {count} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Question Type selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Question Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['mixed', 'mcq', 'short_answer'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setQuestionType(type)}
                        className={`py-2 px-4 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all ${
                          questionType === type
                            ? 'bg-purple-650/10 border-purple-500 text-purple-400'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-450 hover:text-white'
                        }`}
                      >
                        {type === 'mixed' ? 'Mixed' : type === 'mcq' ? 'MCQ Only' : 'Short Answer'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-6 bg-zinc-950 border-t border-zinc-850 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={selectedCategory.id === 'custom' && !customPrompt.trim()}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-purple-650/15 transition-all"
                >
                  Start Practice <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
