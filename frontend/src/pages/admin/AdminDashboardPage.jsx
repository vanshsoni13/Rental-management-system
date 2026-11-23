import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { 
  DollarSign, 
  Layers, 
  AlertTriangle, 
  Users, 
  Store,
  Package, 
  Clock, 
  ArrowRight, 
  PlusCircle, 
  FolderPlus,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      setRecentRentals(res.data.recent_rentals || []);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Admin Dashboard analytics..." />;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-[var(--line)] pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[.22em] text-[var(--rust)] mb-2">Operations / overview</p>
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--ink)]">Admin desk</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">Active rentals, inventory, and platform performance</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to="/admin/products/new"
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1 shadow-sm shadow-sky-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/admin/categories"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1 shadow-sm shadow-emerald-200"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Category</span>
          </Link>
          <Link
            to="/admin/returns"
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Return</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Revenue</span>
            <span className="text-2xl font-black text-gray-900">₹{(stats?.total_revenue || 0).toLocaleString()}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Active Rentals */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Active Rentals</span>
            <span className="text-2xl font-black text-sky-600">{stats?.active_rentals || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue Alert Feed */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Overdue Rentals</span>
            <span className="text-2xl font-black text-rose-600">{stats?.overdue_rentals || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sellers */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Sellers</span>
            <span className="text-2xl font-black text-gray-900">{stats?.total_sellers || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Customers</span>
            <span className="text-2xl font-black text-gray-900">{stats?.total_customers || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Recent Rentals Table */}
      <div className="bg-[var(--white)] border border-[var(--line)] border-t-4 border-t-[var(--ink)] overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-base">Recent Rental Bookings</h3>
          <Link to="/admin/rentals" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center">
            <span>View Master List</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Booking No</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRentals.map((r) => (
                <tr key={r.rental_id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">
                    <Link to={`/rentals/${r.rental_id}`} className="hover:text-sky-600">
                      {r.booking_number}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{r.customer_name}</td>
                  <td className="p-4 text-gray-500">{format(new Date(r.start_datetime), 'MMM dd, yyyy')}</td>
                  <td className="p-4 text-gray-500">{format(new Date(r.end_datetime), 'MMM dd, yyyy')}</td>
                  <td className="p-4 font-black text-gray-900">₹{parseFloat(r.total_amount).toLocaleString()}</td>
                  <td className="p-4">
                    <StatusBadge type="rental" status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
