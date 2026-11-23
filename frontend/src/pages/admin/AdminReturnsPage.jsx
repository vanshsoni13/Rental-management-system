import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import { RotateCcw, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const AdminReturnsPage = ({ ownerOnly = false }) => {
  const [activeRentals, setActiveRentals] = useState([]);
  const [sellerReturns, setSellerReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Return Processing Form State
  const [selectedRentalId, setSelectedRentalId] = useState('');
  const [actualReturnDatetime, setActualReturnDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [conditionOnReturn, setConditionOnReturn] = useState('good');
  const [hourlyLateRate, setHourlyLateRate] = useState(100);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [returnResult, setReturnResult] = useState(null);

  useEffect(() => {
    fetchActiveRentals();
  }, []);

  const fetchActiveRentals = async () => {
    try {
      if (ownerOnly) {
        const res = await api.get('/sellers/returns');
        setSellerReturns(res.data.returns || []);
        return;
      }

      const res = await api.get('/admin/rentals', { params: { status: 'active' } });
      const rentals = res.data.rentals || [];
      setActiveRentals(rentals);
      if (rentals.length > 0) {
        setSelectedRentalId(rentals[0].rental_id);
      }
    } catch (err) {
      console.error('Error fetching active rentals:', err);
      setError('Failed to fetch active rentals');
    } finally {
      setLoading(false);
    }
  };

  const selectedRental = activeRentals.find(r => r.rental_id.toString() === selectedRentalId.toString());

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    setReturnResult(null);

    try {
      const payload = {
        rental_id: parseInt(selectedRentalId, 10),
        actual_return_datetime: new Date(actualReturnDatetime).toISOString(),
        condition_on_return: conditionOnReturn,
        hourly_late_rate: parseFloat(hourlyLateRate),
        admin_notes: adminNotes
      };

      const res = await api.post('/returns', payload);
      setReturnResult(res.data.return_details);
      setSuccess('Rental return processed successfully and inventory restocked!');
      fetchActiveRentals();
    } catch (err) {
      console.error('Error processing return:', err);
      setError(err.response?.data?.error || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading active rentals for return desk..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">{ownerOnly ? 'Product Returns' : 'Returns Desk & Restock Controller'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ownerOnly
            ? 'Review completed returns for bookings that included your products'
            : 'Receive returned equipment, inspect condition, calculate late fees, and restock inventory'}
        </p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      {ownerOnly ? (
        sellerReturns.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No product returns yet</h3>
            <p className="text-gray-500 text-xs">Completed returns for your product bookings will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Booking No</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Scheduled Return</th>
                    <th className="p-4">Actual Return</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4 text-right">Late Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sellerReturns.map((returnRecord) => (
                    <tr key={returnRecord.return_id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-bold text-gray-900">{returnRecord.booking_number}</td>
                      <td className="p-4 text-gray-700">{returnRecord.customer_name}</td>
                      <td className="p-4 text-gray-600">{returnRecord.product_names}</td>
                      <td className="p-4 text-gray-600">{format(new Date(returnRecord.scheduled_return_datetime), 'MMM dd, yyyy p')}</td>
                      <td className="p-4 text-gray-600">{format(new Date(returnRecord.actual_return_datetime), 'MMM dd, yyyy p')}</td>
                      <td className="p-4 capitalize text-gray-600">{returnRecord.condition_on_return.replace('_', ' ')}</td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        {returnRecord.late_fee ? `₹${Number(returnRecord.late_fee).toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeRentals.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">All active rentals returned!</h3>
          <p className="text-gray-500 text-xs">There are currently no active rentals awaiting return processing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Form */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <form onSubmit={handleProcessReturn} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Active Rental Booking</label>
                <select
                  value={selectedRentalId}
                  onChange={(e) => setSelectedRentalId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 bg-white focus:ring-2 focus:ring-sky-500"
                >
                  {activeRentals.map(r => (
                    <option key={r.rental_id} value={r.rental_id}>
                      {r.booking_number} — {r.customer_name} (End: {format(new Date(r.end_datetime), 'MMM dd, p')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Actual Return Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={actualReturnDatetime}
                  onChange={(e) => setActualReturnDatetime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Item Condition</label>
                  <select
                    value={conditionOnReturn}
                    onChange={(e) => setConditionOnReturn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium bg-white"
                  >
                    <option value="good">Good Condition</option>
                    <option value="minor_damage">Minor Damage</option>
                    <option value="severe_damage">Severe Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Late Rate (₹/Hour)</label>
                  <input
                    type="number"
                    value={hourlyLateRate}
                    onChange={(e) => setHourlyLateRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Admin Notes / Inspection Report</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes on equipment condition upon return..."
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center space-x-2 text-xs shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{submitting ? 'Processing Return...' : 'Process Return & Restock Stock'}</span>
              </button>
            </form>
          </div>

          {/* Selected Booking Info */}
          <div className="md:col-span-5 space-y-4">
            {selectedRental && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3 text-xs">
                <h3 className="font-bold text-gray-900 text-sm border-b pb-2">Active Rental Details</h3>
                
                <div>
                  <span className="text-gray-400 block font-semibold">Booking Number</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedRental.booking_number}</span>
                </div>

                <div>
                  <span className="text-gray-400 block font-semibold">Customer</span>
                  <span className="font-bold text-gray-900">{selectedRental.customer_name} ({selectedRental.customer_email})</span>
                </div>

                <div>
                  <span className="text-gray-400 block font-semibold">Scheduled End Date</span>
                  <span className="font-bold text-rose-600">{format(new Date(selectedRental.end_datetime), 'PPP p')}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminReturnsPage;
