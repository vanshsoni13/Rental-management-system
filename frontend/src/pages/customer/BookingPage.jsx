import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import ProductImage from '../../components/ProductImage';
import { ShieldCheck, Calendar, Clock, CreditCard, ArrowRight } from 'lucide-react';

const BookingPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const passedState = location.state || {};

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [startDatetime, setStartDatetime] = useState(passedState.startDatetime || tomorrow);
  const [endDatetime, setEndDatetime] = useState(passedState.endDatetime || threeDaysLater);
  const [durationUnit, setDurationUnit] = useState(passedState.durationUnit || 'day');
  const [quantity, setQuantity] = useState(passedState.quantity || 1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data.product);
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  // Helper pricing math on frontend for summary
  const computePriceBreakdown = () => {
    if (!product) return { subtotal: 0, deposit: 0, total: 0, durationCount: 1 };

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    const diffMs = Math.max(1, end.getTime() - start.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);

    let durationCount = 1;
    let rate = parseFloat(product.price_daily || 0);

    if (durationUnit === 'hour') {
      durationCount = Math.max(1, Math.ceil(diffHours));
      rate = parseFloat(product.price_hourly || 0);
    } else if (durationUnit === 'day') {
      durationCount = Math.max(1, Math.ceil(diffHours / 24));
      rate = parseFloat(product.price_daily || 0);
    } else if (durationUnit === 'week') {
      durationCount = Math.max(1, Math.ceil(diffHours / (24 * 7)));
      rate = parseFloat(product.price_weekly || 0);
    } else if (durationUnit === 'month') {
      durationCount = Math.max(1, Math.ceil(diffHours / (24 * 30)));
      rate = parseFloat(product.price_monthly || 0);
    } else if (durationUnit === 'year') {
      durationCount = Math.max(1, Math.ceil(diffHours / (24 * 365)));
      rate = parseFloat(product.price_yearly || 0);
    }

    const subtotal = rate * durationCount * quantity;
    const deposit = (parseFloat(product.deposit_amount) || 0) * quantity;
    const total = subtotal + deposit;

    return {
      durationCount,
      rate,
      subtotal,
      deposit,
      total
    };
  };

  const breakdown = computePriceBreakdown();

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        items: [{ product_id: parseInt(productId, 10), quantity }],
        start_datetime: new Date(startDatetime).toISOString(),
        end_datetime: new Date(endDatetime).toISOString(),
        duration_unit: durationUnit
      };

      const res = await api.post('/rentals', payload);
      const booking = res.data.booking;

      // Navigate to payment page
      navigate(`/payment/${booking.rental_id}`);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Preparing booking checkout..." />;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      <div className="border-b border-[var(--line)] pb-6">
        <p className="text-[10px] uppercase tracking-[.22em] text-[var(--rust)] mb-2">Rental / checkout</p>
        <h1 className="text-4xl sm:text-5xl font-black text-[var(--ink)]">Confirm the booking</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2">Dates, quantity, and price summary</p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Form Column */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          
          {/* Selected Product Summary */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">{product.category_name}</span>
              <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Stock Available: {product.total_quantity} units</p>
            </div>
          </div>

          {/* Rental Dates Selection */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Rental Duration & Quantity</h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={endDatetime}
                onChange={(e) => setEndDatetime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Duration Unit</label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="hour">Hourly Rate</option>
                  <option value="day">Daily Rate</option>
                  <option value="week">Weekly Rate</option>
                  <option value="month">Monthly Rate</option>
                  <option value="year">Yearly Rate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={product.total_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Pricing Summary */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
            <h3 className="font-black text-gray-900 text-lg border-b border-gray-100 pb-3">Price Breakdown</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Unit Rate ({durationUnit}):</span>
                <span className="font-semibold text-gray-900">₹{breakdown.rate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Duration Count:</span>
                <span className="font-semibold text-gray-900">{breakdown.durationCount} {durationUnit}(s)</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Quantity:</span>
                <span className="font-semibold text-gray-900">{quantity} unit(s)</span>
              </div>

              <div className="flex justify-between text-gray-700 font-bold pt-2 border-t border-gray-100">
                <span>Rental Subtotal:</span>
                <span className="text-gray-900">₹{breakdown.subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Refundable Security Deposit:</span>
                <span>₹{breakdown.deposit.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-gray-900 text-base font-black pt-4 border-t border-gray-200">
                <span>Total Amount Payable:</span>
                <span className="text-sky-600">₹{breakdown.total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl transition duration-150 shadow-lg shadow-sky-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Reserving Stock...' : 'Confirm Booking & Pay'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default BookingPage;
