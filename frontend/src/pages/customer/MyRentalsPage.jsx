import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import AlertBanner from '../../components/AlertBanner';
import { Layers, Calendar, ArrowRight, XCircle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const MyRentalsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchMyRentals();
  }, []);

  const fetchMyRentals = async () => {
    try {
      const res = await api.get('/rentals');
      setRentals(res.data.rentals || []);
    } catch (err) {
      console.error('Error loading rentals:', err);
      setError('Failed to load your rental bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (rentalId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.put(`/rentals/${rentalId}/status`, { status: 'cancelled' });
      setActionSuccess('Booking cancelled successfully.');
      fetchMyRentals();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  if (loading) return <LoadingSpinner message="Fetching your rental history..." />;

  return (
    <div className="space-y-8 pb-16">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">My Rental Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">View your current active rentals, booking statuses, and payment records</p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />

      {rentals.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings yet</h3>
          <p className="text-gray-500 text-xs mb-6">Explore our catalog and rent top-tier equipment today.</p>
          <Link
            to="/products"
            className="bg-sky-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition inline-flex items-center space-x-1"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Booking No</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Booking Status</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentals.map((rental) => (
                  <tr key={rental.rental_id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-900">
                      <Link to={`/rentals/${rental.rental_id}`} className="hover:text-sky-600 transition">
                        {rental.booking_number}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center space-x-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {format(new Date(rental.start_datetime), 'MMM dd, yyyy')} → {format(new Date(rental.end_datetime), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">{rental.duration_unit} rate</span>
                    </td>
                    <td className="p-4 font-black text-gray-900 text-sm">
                      ₹{parseFloat(rental.total_amount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge type="rental" status={rental.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge type="payment" status={rental.payment_status} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {rental.payment_status !== 'paid' && rental.status !== 'cancelled' && (
                        <Link
                          to={`/payment/${rental.rental_id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Pay
                        </Link>
                      )}

                      {rental.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(rental.rental_id)}
                          className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </button>
                      )}

                      <Link
                        to={`/rentals/${rental.rental_id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs transition"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyRentalsPage;
