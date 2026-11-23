import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import AlertBanner from '../../components/AlertBanner';
import { Layers, Search, CheckCircle, XCircle, Play, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

const AdminRentalsPage = ({ ownerOnly = false }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRentals();
  }, [statusFilter]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = ownerOnly
        ? await api.get('/sellers/rentals', { params })
        : await api.get('/admin/rentals', { params });
      setRentals(res.data.rentals || []);
    } catch (err) {
      console.error('Error fetching rentals:', err);
      setError('Failed to fetch rentals');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (rentalId, newStatus) => {
    try {
      await api.put(`/rentals/${rentalId}/status`, { status: newStatus });
      setSuccess(`Rental status updated to "${newStatus}"`);
      fetchRentals();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{ownerOnly ? 'My Product Rentals' : 'Master Rental Management'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ownerOnly ? 'View bookings associated with your products' : 'Review, approve, activate, and track customer bookings'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          {['', 'pending', 'approved', 'active', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                statusFilter === st ? 'bg-sky-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {st || 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner message="Loading rentals..." />
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Booking No</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Duration Range</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Rental Status</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">{ownerOnly ? 'Actions' : 'Admin Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentals.map((r) => (
                  <tr key={r.rental_id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-900">
                      {ownerOnly ? r.booking_number : (
                        <Link to={`/rentals/${r.rental_id}`} className="hover:text-sky-600">
                          {r.booking_number}
                        </Link>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{r.customer_name}</span>
                      {!ownerOnly && <span className="text-[10px] text-gray-400">{r.customer_email}</span>}
                    </td>
                    <td className="p-4 text-gray-600">
                      <span>{format(new Date(r.start_datetime), 'MMM dd')} → {format(new Date(r.end_datetime), 'MMM dd')}</span>
                    </td>
                    <td className="p-4 font-black text-gray-900">₹{parseFloat(r.total_amount).toLocaleString()}</td>
                    <td className="p-4">
                      <StatusBadge type="rental" status={r.status} />
                    </td>
                    <td className="p-4">
                      <StatusBadge type="payment" status={r.payment_status} />
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {!ownerOnly && r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r.rental_id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.rental_id, 'rejected')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {!ownerOnly && r.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(r.rental_id, 'active')}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[11px]"
                        >
                          Mark Active (Handover)
                        </button>
                      )}

                      {!ownerOnly && (
                        <Link
                          to={`/rentals/${r.rental_id}`}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px]"
                        >
                          View
                        </Link>
                      )}
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

export default AdminRentalsPage;
