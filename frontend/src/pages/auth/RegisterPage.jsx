import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import { Boxes, User, Mail, Phone, KeyRound, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginSession } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Calculate Password Strength score (0 to 3)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1) return { score: 1, label: 'Weak (min 6 chars)', color: 'bg-amber-500' };
    if (score === 2) return { score: 2, label: 'Good (letters & numbers)', color: 'bg-sky-500' };
    return { score: 3, label: 'Strong password', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    const errors = {};
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanPhone = formData.phone.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;

    if (!cleanName) {
      errors.name = 'Full name is required.';
    } else if (cleanName.length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address (e.g. user@domain.com).';
    }

    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      errors.phone = 'Please enter a valid phone number (e.g. 9876543210).';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      const response = await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone.trim() || null
      });
      const { token, user } = response.data;

      loginSession(token, user);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      const serverErr = err.response?.data?.error || 'Registration failed. Please check your details.';
      setError(serverErr);
      
      if (serverErr.toLowerCase().includes('already registered')) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'This email is already registered. Please sign in instead.'
        }));
      }
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
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-500 mt-1">Start managing your rentals in minutes</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50">

          <AlertBanner type="error" message={error} onClose={() => setError('')} />

          {/* Email Registration Form (noValidate disables browser default tooltips) */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-2">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.name
                      ? 'border-red-400 bg-red-50/30 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-sky-500'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
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

            {/* Phone Number (Optional) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Phone Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.phone
                      ? 'border-red-400 bg-red-50/30 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-sky-500'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Strength:</span>
                    <span className="font-semibold">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-400 bg-red-50/30 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">
            Sign in
          </Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          Want to list rental products?{' '}
          <Link to="/seller/register" className="font-semibold text-sky-600 hover:text-sky-700">
            Apply as a seller
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;
