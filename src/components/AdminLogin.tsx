import React, { useState } from 'react';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import RotatingLogo, { RotatingLogoMedium } from './RotatingLogo';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

// Get admin credentials from environment variables (development only)
const ADMIN_CREDENTIALS = {
  email: (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env?.VITE_ADMIN_EMAIL || 'admin@9jai.app',
  password: (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env?.VITE_ADMIN_PASSWORD || 'secure_password_required'
};

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check admin credentials
      if (email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
        // Store admin session in localStorage
        const adminUser = {
          username: 'admin',
          email: ADMIN_CREDENTIALS.email,
          isAdmin: true,
          loginTime: Date.now()
        };
        localStorage.setItem('lexicon_dev_user', JSON.stringify(adminUser));
        
        // Hard redirect — forces App.tsx to re-read localStorage and set developerUser
        window.location.href = '/admin/repository';
      } else {
        setError('Invalid email or password. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
              <p className="text-gray-500 text-sm">Admin Access</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Admin Login
            </h2>
            <p className="text-gray-600 text-base mb-8">
              Enter your admin credentials to access the admin panel
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

            {/* Admin Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    required
                    disabled={isLoading}
                    autoComplete="off"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Admin Password
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

              <button
                type="submit"
                disabled={!email || !password || isLoading}
                className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-[#008751] to-[#00A862] text-white rounded-lg text-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader size={24} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Access Admin Panel'
                )}
              </button>
            </form>



            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full mt-6 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg text-base font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Home
            </button>
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
