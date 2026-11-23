import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import { ArrowRight, Boxes, Store } from 'lucide-react';

const SellerRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    store_name: '',
    store_description: '',
    pickup_address: '',
    gstin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginSession } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/sellers/register', {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        gstin: formData.gstin.trim() || null
      });
      loginSession(response.data.token, response.data.user);
      navigate('/seller/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Seller registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <Boxes className="w-7 h-7" />
            </div>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
              Rent<span className="text-sky-600">Hub</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Apply to Become a Seller</h1>
          <p className="text-sm text-gray-500 mt-1">Your store will be reviewed before you can publish products.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50">
          <AlertBanner type="error" message={error} onClose={() => setError('')} />
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required maxLength={100} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number</label>
                <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Name</label>
                <input name="store_name" value={formData.store_name} onChange={handleChange} required maxLength={150} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={6} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Description</label>
              <textarea name="store_description" rows={3} value={formData.store_description} onChange={handleChange} maxLength={2000} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pickup Address</label>
              <textarea name="pickup_address" rows={3} value={formData.pickup_address} onChange={handleChange} required minLength={5} maxLength={1000} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                GSTIN <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <input name="gstin" value={formData.gstin} onChange={handleChange} maxLength={15} className={inputClass} />
            </div>
            <p className="text-xs text-gray-500">
              PAN/KYC and payout account details will be requested through a secure verification workflow in a later phase.
            </p>
            <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Store className="w-4 h-4" />
              <span>{loading ? 'Submitting Application...' : 'Submit Seller Application'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
