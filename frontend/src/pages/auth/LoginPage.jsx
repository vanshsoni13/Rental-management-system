import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import { Boxes, KeyRound, Mail, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const errors = {};
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address (e.g. user@domain.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });
      const { token, user } = response.data;

      loginSession(token, user);

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-4 py-12">
      <div className="max-w-md w-full">

        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 group">
            <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-sky-200 group-hover:scale-105 transition-transform duration-200">
              <Boxes className="w-7 h-7" />
            </div>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
              Rent<span className="text-sky-600">Hub</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your rentals</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50">

          <AlertBanner type="error" message={error} onClose={() => setError('')} />

          {/* Email Sign-In Form (noValidate disables browser popups) */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-red-400 bg-red-50/30 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-sky-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Password</label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('Please contact administrator to reset your password.');
                  }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                  }}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-red-400 bg-red-50/30 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition duration-150 flex items-center justify-center space-x-2 shadow-md shadow-sky-200 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
