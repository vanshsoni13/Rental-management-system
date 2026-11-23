import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, ArrowRight, DollarSign, Layers, Package } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import AlertBanner from '../../components/AlertBanner';

const CustomerDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/customer/dashboard');
        setStats(res.data.stats);
        setRecentRentals(res.data.recent_rentals || []);
      } catch (error) {
        console.error('Error fetching customer dashboard:', error);
        setError(error.response?.data?.error || 'Failed to load your dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Customer Dashboard analytics..." />;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Customer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your rental activity and spending</p>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Spent</span>
            <span className="text-2xl font-black text-gray-900">₹{Number(stats?.total_spent || 0).toLocaleString()}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Active Rentals</span>
            <span className="text-2xl font-black text-sky-600">{stats?.active_rentals || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Overdue Rentals</span>
            <span className="text-2xl font-black text-rose-600">{stats?.overdue_rentals || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Rentals</span>
            <span className="text-2xl font-black text-gray-900">{stats?.total_rentals || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-base">Your Recent Rentals</h3>
          <Link to="/my-rentals" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center">
            <span>View All Rentals</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Booking No</th>
                <th className="p-4">Products</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRentals.map((rental) => (
                <tr key={rental.rental_id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">
                    <Link to={`/rentals/${rental.rental_id}`} className="hover:text-sky-600">{rental.booking_number}</Link>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{rental.product_names || '—'}</td>
                  <td className="p-4 text-gray-500">{format(new Date(rental.start_datetime), 'MMM dd, yyyy')}</td>
                  <td className="p-4 text-gray-500">{format(new Date(rental.end_datetime), 'MMM dd, yyyy')}</td>
                  <td className="p-4 font-black text-gray-900">₹{Number(rental.total_amount).toLocaleString()}</td>
                  <td className="p-4"><StatusBadge type="rental" status={rental.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
