import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';

const CustomerProductRentalsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await api.get('/sellers/rentals');
        setRentals(res.data.rentals || []);
      } catch (err) {
        console.error('Error fetching product rental bookings:', err);
        setError(err.response?.data?.error || 'Failed to load product rental bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  if (loading) return <LoadingSpinner message="Loading product rental bookings..." />;

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-black text-gray-900">My Product Rental Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Bookings associated with products you created</p>
      </div>

      {error && <div role="alert" className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Booking No</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Duration Range</th>
                <th className="p-4">Owned Products Amount</th>
                <th className="p-4">Rental Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentals.map((rental) => (
                <tr key={rental.rental_id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{rental.booking_number}</td>
                  <td className="p-4 text-gray-700 font-medium">{rental.customer_name}</td>
                  <td className="p-4 text-gray-600">
                    {format(new Date(rental.start_datetime), 'MMM dd')} → {format(new Date(rental.end_datetime), 'MMM dd')}
                  </td>
                  <td className="p-4 font-black text-gray-900">₹{Number(rental.total_amount).toLocaleString()}</td>
                  <td className="p-4"><StatusBadge type="rental" status={rental.status} /></td>
                </tr>
              ))}
              {rentals.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No rentals for your products yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductRentalsPage;
