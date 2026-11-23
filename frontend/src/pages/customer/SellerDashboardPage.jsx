import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, ArrowRight, BarChart3, DollarSign, Layers, Package, RotateCcw, Store } from 'lucide-react';
import api from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

const SellerDashboardPage = () => {
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [profileResult, dashboardResult] = await Promise.allSettled([
          api.get('/sellers/profile'),
          api.get('/sellers/dashboard')
        ]);
        if (profileResult.status === 'rejected') {
          throw profileResult.reason;
        }

        const sellerProfile = profileResult.value.data.seller;
        setSeller(sellerProfile);
        if (dashboardResult.status === 'fulfilled') {
          setStats(dashboardResult.value.data.stats);
          setRecentRentals(dashboardResult.value.data.recent_rentals || []);
        } else if (sellerProfile.status === 'approved') {
          setError(dashboardResult.reason.response?.data?.error || 'Failed to load seller dashboard data');
        }
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Failed to load seller dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading seller dashboard..." />;

  const statCards = [
    { title: 'Total Revenue', value: `₹${Number(stats?.total_revenue || 0).toLocaleString()}`, Icon: DollarSign, valueClass: 'text-gray-900', iconClass: 'bg-emerald-50 text-emerald-600' },
    { title: 'Active Rentals', value: stats?.active_rentals || 0, Icon: Layers, valueClass: 'text-sky-600', iconClass: 'bg-sky-50 text-sky-600' },
    { title: 'Overdue Rentals', value: stats?.overdue_rentals || 0, Icon: AlertTriangle, valueClass: 'text-rose-600', iconClass: 'bg-rose-50 text-rose-600' },
    { title: 'Total Products', value: stats?.total_products || 0, Icon: Package, valueClass: 'text-gray-900', iconClass: 'bg-purple-50 text-purple-600' }
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Seller Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Your products, rental activity, and revenue</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/seller/products/new"
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-2 shadow-sm shadow-sky-200"
          >
            <Package className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/seller/returns"
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-2 border border-gray-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>View Returns</span>
          </Link>
          <Link
            to="/seller/reports"
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-2 border border-gray-200"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </Link>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {seller && seller.status !== 'approved' && (
        <div className={`p-5 rounded-2xl border ${
          seller.status === 'pending'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold capitalize">Seller account {seller.status}</h2>
              <p className="text-sm mt-1">
                {seller.status === 'pending'
                  ? 'Product management will be available after an administrator approves your seller account.'
                  : 'Seller product management is currently unavailable. Contact an administrator for assistance.'}
              </p>
              {seller.admin_notes && <p className="text-sm mt-2"><strong>Admin note:</strong> {seller.admin_notes}</p>}
            </div>
          </div>
        </div>
      )}

      {seller && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Store Profile</h2>
              <p className="text-lg font-bold text-gray-900 mt-2">{seller.store_name}</p>
              {seller.store_description && <p className="text-sm text-gray-500 mt-1">{seller.store_description}</p>}
            </div>
            <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-bold capitalize ${
              seller.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {seller.status}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm mt-4">
            <div><span className="text-gray-500">Pickup address</span><p className="font-semibold text-gray-900">{seller.pickup_address}</p></div>
            <div><span className="text-gray-500">GSTIN</span><p className="font-semibold text-gray-900">{seller.gstin || 'Not provided'}</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ title, value, Icon, valueClass, iconClass }) => (
          <div key={title} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{title}</span>
              <span className={`text-2xl font-black ${valueClass}`}>
                {value}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${iconClass} flex items-center justify-center font-bold`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-base">Recent Rental Bookings</h3>
          <Link to="/seller/rentals" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center">
            <span>View All Rentals</span>
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
              {recentRentals.map((rental) => (
                <tr key={rental.rental_id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{rental.booking_number}</td>
                  <td className="p-4 text-gray-700 font-medium">{rental.customer_name}</td>
                  <td className="p-4 text-gray-500">{format(new Date(rental.start_datetime), 'MMM dd, yyyy')}</td>
                  <td className="p-4 text-gray-500">{format(new Date(rental.end_datetime), 'MMM dd, yyyy')}</td>
                  <td className="p-4 font-black text-gray-900">₹{Number(rental.total_amount).toLocaleString()}</td>
                  <td className="p-4"><StatusBadge type="rental" status={rental.status} /></td>
                </tr>
              ))}
              {recentRentals.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">No rental bookings for your products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
