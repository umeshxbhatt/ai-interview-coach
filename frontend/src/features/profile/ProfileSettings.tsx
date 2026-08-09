import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { User, Briefcase, Code, Settings, Check, Loader2 } from 'lucide-react';

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [targetCompany, setTargetCompany] = useState(user?.targetCompany || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'Mid');
  const [preferredStack, setPreferredStack] = useState(user?.preferredStack || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.put('/auth/profile', {
        name,
        targetCompany,
        experienceLevel,
        preferredStack,
      });

      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      setSuccessMessage('Profile settings updated successfully!');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          Profile Settings <Settings className="w-6 h-6 text-purple-400" />
        </h1>
        <p className="text-zinc-400 text-sm font-light mt-1">
          Configure your target role preferences and candidate bio data.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 border border-zinc-900 bg-zinc-950/20 backdrop-blur-md relative"
      >
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/25 text-emerald-400 text-xs flex gap-2 items-center"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs flex gap-2 items-center"
          >
            <Check className="w-4 h-4 rotate-45 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Disabled Primary Key) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550 mb-2">
              Primary Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-650">
                <User className="h-4 w-4" />
              </div>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950/45 border border-zinc-900/60 rounded-lg text-xs text-zinc-500 cursor-not-allowed outline-none"
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-600">
              Email addresses are linked to account signups and cannot be modified.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="name-input" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Candidate Display Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <User className="h-4 w-4" />
              </div>
              <input
                id="name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="e.g. Alex Johnson"
              />
            </div>
          </div>

          {/* Target Company */}
          <div>
            <label htmlFor="company-input" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Target Company
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Briefcase className="h-4 w-4" />
              </div>
              <input
                id="company-input"
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="e.g. Vercel, Google, Stripe"
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-550">
              Helps curate customized company-specific behavioral mock questions.
            </p>
          </div>

          {/* Preferred Stack */}
          <div>
            <label htmlFor="stack-input" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Preferred Tech Stack
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Code className="h-4 w-4" />
              </div>
              <input
                id="stack-input"
                type="text"
                value={preferredStack}
                onChange={(e) => setPreferredStack(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="e.g. React 19, TypeScript, Node.js, AWS"
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-550">
              Aligns technical and coding questions to match your engineering background.
            </p>
          </div>

          {/* Experience Level */}
          <div>
            <label htmlFor="exp-select" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Experience Level
            </label>
            <select
              id="exp-select"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as any)}
              className="block w-full px-3 py-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            >
              <option value="Junior">Junior Engineer (0 - 2 years)</option>
              <option value="Mid">Mid-Level Engineer (2 - 5 years)</option>
              <option value="Senior">Senior Engineer (5+ years / Staff / Architect)</option>
            </select>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-zinc-900 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/40 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/10 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Settings...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
