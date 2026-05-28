import React, { useState } from 'react';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmail, signUpWithEmail, signIn } from '../lib/firebase';
import { RotatingLogoMedium } from './RotatingLogo';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signIn();
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#008751] to-[#00A862] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header — 3D spinning logo */}
          <div className="bg-white px-6 py-8 text-center border-b border-gray-100">
            <div className="flex flex-col items-center gap-2">
              <RotatingLogoMedium />
              <h1 className="text-2xl font-bold text-[#008751]">9jai</h1>
              <p className="text-gray-500 text-sm">Nigerian Languages AI Platform</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-base mb-8">
              {isSignUp
                ? 'Sign up to start learning Nigerian languages'
                : 'Sign in to continue learning'}
            </p>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                <p className="text-base text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleUserSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements (for signup) */}
              {isSignUp && (
                <p className="text-sm text-gray-600">
                  Password must be at least 6 characters long
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-[#008751] to-[#00A862] text-white rounded-lg text-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader size={24} className="animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Gmail Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full px-6 py-4 border-2 border-gray-300 text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Toggle Sign Up / Sign In */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-base">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="ml-2 text-[#008751] font-semibold hover:text-[#00A862] transition-colors text-base"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {/* Demo Info */}
            <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Demo Account:</span> Use any email and password (minimum 6 characters) to create an account.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-base">
            © 2026 9aij Technology Limited. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
