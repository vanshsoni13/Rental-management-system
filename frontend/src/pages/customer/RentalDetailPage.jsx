import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import AlertBanner from '../../components/AlertBanner';
import ProductImage from '../../components/ProductImage';
import { Calendar, Clock, CreditCard, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const RentalDetailPage = () => {
  const { id } = useParams();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRentalDetails();
  }, [id]);

  const fetchRentalDetails = async () => {
    try {
      const res = await api.get(`/rentals/${id}`);
      setRental(res.data.rental);
    } catch (err) {
      console.error('Error loading rental details:', err);
      setError('Failed to load rental details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching rental details..." />;
  if (!rental) return <div className="p-8 text-center text-red-500">Rental booking not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Booking Receipt</span>
          <h1 className="text-3xl font-black text-gray-900">{rental.booking_number}</h1>
          <p className="text-xs text-gray-500 mt-1">Placed on {format(new Date(rental.created_at), 'PPP p')}</p>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge type="rental" status={rental.status} />
          <StatusBadge type="payment" status={rental.payment_status} />
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Col: Items & Payment Timeline */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Reserved Equipment List */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Reserved Equipment</h3>
            <div className="divide-y divide-gray-100">
              {rental.items?.map((item) => (
                <div key={item.rental_item_id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ProductImage
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-12 h-12 object-cover rounded-xl"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.product_name}</h4>
                      <span className="text-xs text-gray-500">Qty: {item.quantity} × ₹{parseFloat(item.unit_price).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="font-black text-gray-900 text-sm">
                    ₹{parseFloat(item.subtotal).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Return & Overdue Details if Processed */}
          {rental.return_details && (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-center font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-amber-600 mr-2" />
                <span>Return Processed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Scheduled Return: <strong>{format(new Date(rental.return_details.scheduled_return_datetime), 'PP p')}</strong></div>
                <div>Actual Return: <strong>{format(new Date(rental.return_details.actual_return_datetime), 'PP p')}</strong></div>
                <div>Condition: <strong className="capitalize">{rental.return_details.condition_on_return}</strong></div>
                <div>Late Fee: <strong className="text-rose-700">₹{parseFloat(rental.return_details.late_fee || 0).toLocaleString()}</strong></div>
              </div>
            </div>
          )}

          {/* Payment Receipts Log */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Payment Receipts</h3>
            {rental.payments?.length === 0 ? (
              <p className="text-xs text-gray-400">No payment transaction recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {rental.payments?.map((pmt) => (
                  <div key={pmt.payment_id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{pmt.transaction_id}</span>
                      <span className="text-gray-500 text-[10px]">{format(new Date(pmt.payment_date), 'PPP p')} ({pmt.payment_method})</span>
                    </div>
                    <span className="font-black text-emerald-600 text-sm">₹{parseFloat(pmt.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Booking Meta */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Booking Summary</h3>

            <div>
              <span className="text-gray-400 block font-semibold">Start Datetime</span>
              <span className="font-bold text-gray-900">{format(new Date(rental.start_datetime), 'PPP p')}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-semibold">End Datetime</span>
              <span className="font-bold text-gray-900">{format(new Date(rental.end_datetime), 'PPP p')}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-semibold">Security Deposit</span>
              <span className="font-bold text-emerald-700">₹{parseFloat(rental.security_deposit).toLocaleString()}</span>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-900">
              <span>Total Amount:</span>
              <span className="text-sky-600">₹{parseFloat(rental.total_amount).toLocaleString()}</span>
            </div>

            {rental.payment_status !== 'paid' && (
              <Link
                to={`/payment/${rental.rental_id}`}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-md shadow-emerald-200"
              >
                <CreditCard className="w-4 h-4" />
                <span>Process Payment Now</span>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RentalDetailPage;
