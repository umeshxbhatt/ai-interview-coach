import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { KeyRound, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one digit'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const newPasswordVal = watch('password', '');

  const onSubmit = async (values: ResetFormValues) => {
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: values.password });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const rules = [
    { label: 'Minimum 8 characters', valid: newPasswordVal.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(newPasswordVal) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(newPasswordVal) },
    { label: 'One digit [0-9]', valid: /[0-9]/.test(newPasswordVal) },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <KeyRound className="w-4 h-4 text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white font-mono">InterviewAI</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Create new password</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Set your new login credentials below.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-2xl relative border border-zinc-800 bg-zinc-900/20 backdrop-blur-md">
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 mb-6 glow-purple">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Password changed</h3>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                Your credentials have been updated successfully. Redirecting you to sign in...
              </p>
            </motion.div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-sm flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Reset failed</span>
                    <p className="mt-1 text-xs opacity-90">{error}</p>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 h-5 text-zinc-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all ${
                      errors.password
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
                )}

                {/* Requirements check list */}
                <div className="mt-3.5 space-y-1.5 p-3 rounded-lg bg-zinc-950/50 border border-zinc-850">
                  <p className="text-[11px] font-semibold text-zinc-450 uppercase tracking-wider mb-1">Password Requirements</p>
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${rule.valid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                      <span className={`text-xs transition-colors ${rule.valid ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 h-5 text-zinc-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all ${
                      errors.confirmPassword
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    Reset Password <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
