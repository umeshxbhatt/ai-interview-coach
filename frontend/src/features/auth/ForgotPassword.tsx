import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Mail, KeyRound, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: values.email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <KeyRound className="w-4 h-4 text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight text-white font-mono">InterviewAI</span>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Reset password</h2>
          <p className="mt-2 text-sm text-zinc-400">
            We will email you a secure link to reset your password.
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
              <h3 className="text-2xl font-bold text-white mb-2">Check your email</h3>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto mb-6">
                If the email is registered, we have sent instructions to reset your password.
              </p>
              
              <div className="p-3 bg-purple-950/20 border border-purple-550/20 rounded-lg text-[11px] text-purple-300 font-light mb-6 text-left leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-1">Local Development Note</span>
                No email dispatcher is configured. The recovery link has been printed directly to the backend terminal server console log!
              </div>

              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-purple-450 hover:text-purple-350 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
              </Link>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}

              {/* Email address input */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 h-5 text-zinc-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
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
                    Send Reset Link <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-zinc-450 hover:text-zinc-350 transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
