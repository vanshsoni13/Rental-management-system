import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import { CreditCard, ShieldCheck, CheckCircle2, Lock, Smartphone, Truck, Building2, AlertCircle, ArrowLeft, RefreshCw, Check } from 'lucide-react';

const getPaidAmount = (payments = [], paymentType) => payments
  .filter(payment =>
    ['SUCCESS', 'PAID'].includes(String(payment.status).toUpperCase())
    && (String(payment.payment_type).toLowerCase() === 'security_deposit') === (paymentType === 'security_deposit')
  )
  .reduce((total, payment) => total + Number(payment.amount || 0), 0);

const PaymentPage = () => {
  const { rentalId } = useParams();
  const navigate = useNavigate();

  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  
  // UI Result States: 'INPUT', 'SUCCESS', 'COD_CONFIRMED', 'FAILED'
  const [viewState, setViewState] = useState('INPUT');
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Payment Options: 'full', 'partial', 'security_deposit'
  const [paymentType, setPaymentType] = useState('full');
  
  // Payment Methods: 'card', 'upi', 'netbanking', 'cod'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    fetchRental();
  }, [rentalId]);

  const fetchRental = async () => {
    try {
      const res = await api.get(`/rentals/${rentalId}`);
      const data = res.data.rental;
      setRental(data);
      setCustomAmount(Math.max(0, Number(data.total_amount) - getPaidAmount(data.payments)).toFixed(2));
    } catch (err) {
      console.error('Error loading rental:', err);
      setError('Failed to load rental details for payment');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    setError('');

    const paymentVal = parseFloat(customAmount || rental.total_amount);

    try {
      // 1. CASH ON DELIVERY (COD) FLOW
      if (paymentMethod === 'cod') {
        const codRes = await api.post('/payments/cash-on-delivery', {
          rental_id: parseInt(rentalId, 10),
          amount: paymentVal,
          payment_type: paymentType
        });

        if (codRes.data.success) {
          setPaymentDetails(codRes.data.payment);
          setViewState('COD_CONFIRMED');
        } else {
          setError(codRes.data.error || 'Failed to register Cash on Delivery booking');
          setViewState('FAILED');
        }
        return;
      }

      // 2. RAZORPAY ONLINE PAYMENT FLOW
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay SDK. Please check your internet connection.');
        return;
      }

      // Create Razorpay order on backend
      const orderRes = await api.post('/payments/create-order', {
        rental_id: parseInt(rentalId, 10),
        amount: paymentVal,
        payment_type: paymentType
      });

      const { order_id, key_id, amount, currency, payment_id } = orderRes.data;

      // Configure Razorpay checkout popup with targeted test method
      const options = {
        key: key_id,
        amount: amount,
        currency: currency || 'INR',
        name: 'RentHub Rental Management',
        description: `Payment for Booking #${rental.booking_number}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            setPaying(true);
            // Verify Razorpay signature server-side
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: payment_id
            });

            if (verifyRes.data.success && verifyRes.data.verified) {
              setPaymentDetails(verifyRes.data.payment);
              setViewState('SUCCESS');
            } else {
              setError(verifyRes.data.error || 'Server-side payment verification failed.');
              setViewState('FAILED');
            }
          } catch (err) {
            console.error('Razorpay Verification Error:', err);
            setError(err.response?.data?.error || 'Payment signature verification failed.');
            setViewState('FAILED');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: rental.customer_name || '',
          email: rental.customer_email || '',
          contact: rental.customer_phone || ''
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using ' + (paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'netbanking' ? 'Net Banking' : 'Card'),
                instruments: paymentMethod === 'upi'
                  ? [{ method: 'upi' }]
                  : paymentMethod === 'netbanking'
                  ? [{ method: 'netbanking' }]
                  : [{ method: 'card' }]
              }
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        theme: {
          color: '#0284c7'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setError('Payment checkout closed by user.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error?.description || 'Payment Failed');
        setViewState('FAILED');
        setPaying(false);
      });
      rzp.open();

    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.error || 'Payment processing failed. Please try again.');
      setViewState('FAILED');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading checkout gateway..." />;
  if (!rental) return <div className="p-8 text-center text-red-500 font-bold">Rental booking not found</div>;

  // -------------------------------------------------------------
  // SUCCESS SCREEN VIEW
  // -------------------------------------------------------------
  if (viewState === 'SUCCESS') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">Transaction Verified</span>
          <h1 className="text-3xl font-black text-gray-900">Payment Successful!</h1>
          <p className="text-sm text-gray-500 mt-2">Your payment has been verified server-side and applied to your booking.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left space-y-3 text-xs max-w-lg mx-auto">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-400">Booking Number</span>
            <span className="font-bold text-gray-900">{rental.booking_number}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-400">Razorpay Payment ID</span>
            <span className="font-mono font-bold text-sky-600">{paymentDetails?.razorpay_payment_id || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-400">Transaction ID</span>
            <span className="font-mono text-gray-700">{paymentDetails?.transaction_id}</span>
          </div>
          <div className="flex justify-between pt-1 text-sm font-black">
            <span>Amount Paid</span>
            <span className="text-emerald-600">₹{parseFloat(paymentDetails?.amount || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/rentals/${rentalId}`}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-sky-200"
          >
            View Rental Receipt
          </Link>
          <Link
            to="/my-rentals"
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-3.5 rounded-xl text-sm transition"
          >
            My Rentals Directory
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CASH ON DELIVERY (COD) CONFIRMATION VIEW
  // -------------------------------------------------------------
  if (viewState === 'COD_CONFIRMED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-100">
          <Truck className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">Booking Confirmed</span>
          <h1 className="text-3xl font-black text-gray-900">Cash on Delivery Registered</h1>
          <p className="text-sm text-gray-500 mt-2">Payment will be collected in cash upon equipment delivery.</p>
        </div>

        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-left space-y-3 text-xs max-w-lg mx-auto text-amber-900">
          <div className="flex justify-between border-b border-amber-200 pb-2">
            <span>Booking Reference</span>
            <strong className="font-bold">{rental.booking_number}</strong>
          </div>
          <div className="flex justify-between border-b border-amber-200 pb-2">
            <span>Payment Status</span>
            <strong className="font-bold text-amber-700 uppercase">Pending Collection</strong>
          </div>
          <div className="flex justify-between pt-1 text-sm font-black">
            <span>Amount Due at Delivery</span>
            <span className="text-amber-800">₹{parseFloat(paymentDetails?.amount || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/rentals/${rentalId}`}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-sky-200"
          >
            View Rental Details
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAYMENT FAILED VIEW
  // -------------------------------------------------------------
  if (viewState === 'FAILED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-100">
          <AlertCircle className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block mb-1">Transaction Error</span>
          <h1 className="text-3xl font-black text-gray-900">Payment Unsuccessful</h1>
          <p className="text-sm text-rose-600 mt-2 font-medium">{error || 'Your payment attempt was cancelled or failed verification.'}</p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setError('');
              setViewState('INPUT');
            }}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-lg shadow-sky-200 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Payment Again</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT CHECKOUT FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">Checkout & Payment Gateway</h1>
        <p className="text-sm text-gray-500 mt-1">Select an option. Razorpay Checkout shows the payment methods enabled for your Test Mode account.</p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Payment Form */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            
            {/* Payment Type Selection (Preserved) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Payment Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('full');
                    setCustomAmount(Math.max(0, Number(rental.total_amount) - getPaidAmount(rental.payments)).toFixed(2));
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    paymentType === 'full' ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  Full Payment
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('partial');
                    const outstanding = Math.max(0, Number(rental.total_amount) - getPaidAmount(rental.payments));
                    setCustomAmount(Math.min(outstanding, Number(rental.total_amount) * 0.5).toFixed(2));
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    paymentType === 'partial' ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  50% Partial
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('security_deposit');
                    setCustomAmount(Math.max(0, Number(rental.security_deposit) - getPaidAmount(rental.payments, 'security_deposit')).toFixed(2));
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    paymentType === 'security_deposit' ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  Deposit Only
                </button>
              </div>
            </div>

            {/* Payment Method Selector (Card, UPI, Net Banking, COD) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                
                {/* 1. CARD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'card' ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-sky-600" />
                  <span className="font-bold text-sm">Credit / Debit Card</span>
                  <span className="text-[10px] text-gray-400 font-normal">Visa, Mastercard, RuPay</span>
                </button>

                {/* 2. UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'upi' ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-1 text-purple-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm">UPI (Test Mode)</span>
                  <span className="text-[10px] text-gray-400 font-normal">Simulated UPI test payment</span>
                </button>

                {/* 3. NET BANKING */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'netbanking' ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <span className="font-bold text-sm">Net Banking</span>
                  <span className="text-[10px] text-gray-400 font-normal">All Major Indian Banks</span>
                </button>

                {/* 4. CASH ON DELIVERY (COD) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'cod' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <Truck className="w-6 h-6 text-amber-600" />
                  <span className="font-bold text-sm">Cash on Delivery</span>
                  <span className="text-[10px] text-gray-400 font-normal">Pay cash upon equipment delivery</span>
                </button>

              </div>
            </div>

            {/* UPI Test Mode guidance */}
            {paymentMethod === 'upi' && (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start space-x-3 text-xs text-purple-900">
                <Smartphone className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">Razorpay Test UPI</h4>
                  <p className="text-[11px] leading-relaxed text-purple-700">
                    Test Mode does not guarantee a scannable UPI QR code. If Checkout offers UPI and asks for a UPI ID, use <strong>success@razorpay</strong> for a successful test or <strong>failure@razorpay</strong> for a failed test. Checkout displays payment methods enabled for this account.
                  </p>
                </div>
              </div>
            )}

            {/* Payable Amount Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payable Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                readOnly={paymentType === 'full'}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg font-black text-gray-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={paying}
              className={`w-full font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50 ${
                paymentMethod === 'cod'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {paying
                  ? 'Processing Request...'
                  : paymentMethod === 'cod'
                  ? `Register Cash on Delivery (₹${parseFloat(customAmount || 0).toLocaleString()})`
                  : `Pay ₹${parseFloat(customAmount || 0).toLocaleString()} via ${paymentMethod.toUpperCase()}`}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Booking Summary */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Booking Summary</h3>
            
            <div>
              <span className="text-gray-400 block font-semibold">Booking Number</span>
              <span className="font-bold text-gray-900 text-sm">{rental.booking_number}</span>
            </div>

            <div>
              <span className="text-gray-400 block font-semibold">Security Deposit</span>
              <span className="font-bold text-emerald-700">₹{parseFloat(rental.security_deposit).toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-black">
              <span>Total Payable:</span>
              <span className="text-sky-600">₹{parseFloat(rental.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
