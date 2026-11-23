import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import ProductImage from '../../components/ProductImage';
import ProductCard from '../../components/ProductCard';
import { ShieldCheck, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive Availability & Price Calculator state
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);

  const [startDatetime, setStartDatetime] = useState(tomorrow);
  const [endDatetime, setEndDatetime] = useState(threeDaysLater);
  const [durationUnit, setDurationUnit] = useState('day');
  const [quantity, setQuantity] = useState(1);

  const rentalTiers = [
    { key: 'hour', label: 'Hourly', priceField: 'price_hourly' },
    { key: 'day', label: 'Daily', priceField: 'price_daily' },
    { key: 'week', label: 'Weekly', priceField: 'price_weekly' },
    { key: 'month', label: 'Monthly', priceField: 'price_monthly' },
    { key: 'year', label: 'Yearly', priceField: 'price_yearly' }
  ];

  const formatRentalPrice = (value) => {
    if (value === null || value === undefined || value === '') return 'Unavailable';
    const numericPrice = Number(value);
    if (!Number.isFinite(numericPrice)) return 'Unavailable';
    return `₹${numericPrice.toLocaleString()}`;
  };

  const [checking, setChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  useEffect(() => {
    fetchProduct();
    fetchRecommendations();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.product);
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/ai/recommendations', {
        params: { product_id: id, limit: 4 }
      });
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error('Error loading similar product recommendations:', err);
    }
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setChecking(true);
    setAvailabilityResult(null);
    setError('');

    try {
      const res = await api.get(`/products/${id}/availability`, {
        params: {
          start_datetime: new Date(startDatetime).toISOString(),
          end_datetime: new Date(endDatetime).toISOString(),
          quantity
        }
      });
      setAvailabilityResult(res.data);
    } catch (err) {
      console.error('Error checking availability:', err);
      setError(err.response?.data?.error || 'Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  const handleProceedToBooking = () => {
    navigate(`/booking/${id}`, {
      state: {
        startDatetime,
        endDatetime,
        durationUnit,
        quantity
      }
    });
  };

  if (loading) return <LoadingSpinner message="Loading product details..." />;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

  return (
    <div className="space-y-8 pb-16">
      
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm overflow-hidden">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="w-full h-80 sm:h-96 object-cover rounded-2xl"
            />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <span className="inline-block bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                {product.category_name}
              </span>
              <h1 className="text-3xl font-black text-gray-900">{product.name}</h1>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-2 uppercase tracking-wider">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Tiered Price Rate Table */}
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider">Tiered Rental Pricing Rates</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {rentalTiers.map((tier) => {
                  const isSelected = durationUnit === tier.key;
                  return (
                    <button
                      type="button"
                      key={tier.key}
                      onClick={() => setDurationUnit(tier.key)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-2xl text-center border transition-colors duration-200 ${
                        isSelected
                          ? 'bg-[var(--rust)] border-[var(--rust)]'
                          : 'bg-gray-50 border-gray-100 hover:border-[var(--rust)]'
                      }`}
                    >
                      <span className={`text-[10px] font-bold block uppercase ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>{tier.label}</span>
                      <span className={`font-black text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {formatRentalPrice(product[tier.priceField])}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Refundable Security Deposit: <strong>₹{parseFloat(product.deposit_amount).toLocaleString()}</strong> per unit</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Widget */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 sticky top-24 space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold block">Total Stock</span>
                <span className="font-bold text-gray-900 text-base">{product.total_quantity} units</span>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                product.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {product.is_active ? 'Active Inventory' : 'Inactive'}
              </span>
            </div>

            {/* Check Availability Form */}
            <form onSubmit={handleCheckAvailability} className="space-y-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center">
                <Calendar className="w-5 h-5 text-sky-600 mr-2" />
                Check Availability & Reserve
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Rate Tier</label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={checking}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl transition text-xs flex items-center justify-center space-x-2"
              >
                <span>{checking ? 'Checking Stock...' : 'Check Availability'}</span>
              </button>
            </form>

            {/* Availability Result Display */}
            {availabilityResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                availabilityResult.is_available 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center font-bold">
                  {availabilityResult.is_available ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                      <span>Stock Available! ({availabilityResult.available_quantity} available)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600 mr-1.5" />
                      <span>Unavailable for selected dates</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-80">
                  {availabilityResult.rented_quantity} unit(s) currently reserved by existing active bookings during this period.
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleProceedToBooking}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl transition duration-150 shadow-lg shadow-sky-200 flex items-center justify-center space-x-2"
            >
              <span>Proceed to Booking</span>
              <ArrowRight className="w-5 h-5" />
            </button>

          </div>
        </div>

      </div>

      {recommendations.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 text-violet-600 mr-2" />
              Similar Items, Recommended by AI
            </h2>
            <p className="text-sm text-gray-500">
              Matched using product descriptions and categories, with rental popularity as a ranking signal.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <div key={item.product_id}>
                <p className="text-xs font-semibold text-violet-700 mb-2">
                  {item.recommendation_reason}
                </p>
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetailPage;
