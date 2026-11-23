import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import StatusBadge from '../../components/StatusBadge';
import { CreditCard, DollarSign, Calendar, CheckCircle2, Banknote, Search } from 'lucide-react';
import { format } from 'date-fns';

const AdminPaymentsPage = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [revRes, pmtsRes] = await Promise.all([
        api.get('/admin/revenue'),
        api.get('/payments/admin/all')
      ]);
      setRevenueData(revRes.data);
      setPaymentsList(pmtsRes.data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCash = async (paymentId) => {
    setActionLoading(true);
    setError('');
    setMsg('');

    try {
      const res = await api.put(`/payments/${paymentId}/confirm-cash`);
      if (res.data.success) {
        setMsg(`Cash collection of ₹${res.data.payment.amount} confirmed successfully!`);
        fetchData(); // Refresh transaction list & analytics
      }
    } catch (err) {
      console.error('Error confirming cash payment:', err);
      setError(err.response?.data?.error || 'Failed to confirm cash collection');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = paymentsList.filter(p => 
    p.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.booking_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.payment_method?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading financial records..." />;

  return (
    <div className="space-y-8 pb-16">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">Payment Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage Razorpay test mode online payments and Cash at Pickup collections</p>
      </div>

      <AlertBanner type="success" message={msg} onClose={() => setMsg('')} />
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Stats Header */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Processed Revenue</span>
          <span className="text-3xl font-black text-emerald-600">₹{(revenueData?.total_revenue || 0).toLocaleString()}</span>
        </div>
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
          <DollarSign className="w-8 h-8" />
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Transaction Records</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, Tx ID, booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-medium border border-gray-100 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">Transaction Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Booking</th>
                <th className="p-4">Method & Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">No payment transaction records found</td>
                </tr>
              ) : (
                filteredPayments.map((pmt) => (
                  <tr key={pmt.payment_id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block font-mono">{pmt.transaction_id}</span>
                      <span className="text-[10px] text-gray-400">{format(new Date(pmt.payment_date), 'PPP p')}</span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-gray-800 block">{pmt.customer_name || 'Customer'}</span>
                      <span className="text-[10px] text-gray-400">{pmt.customer_email}</span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-sky-600">{pmt.booking_number || 'N/A'}</span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-gray-900 uppercase block">{pmt.payment_method}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{pmt.payment_type}</span>
                    </td>

                    <td className="p-4 font-black text-gray-900">
                      ₹{parseFloat(pmt.amount).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <StatusBadge type="payment" status={pmt.status} />
                    </td>

                    <td className="p-4 text-right">
                      {(pmt.status === 'PENDING_COLLECTION' || pmt.status === 'pending_collection') ? (
                        <button
                          onClick={() => handleConfirmCash(pmt.payment_id)}
                          disabled={actionLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-center space-x-1 ml-auto shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Cash Collected</span>
                        </button>
                      ) : (
                        <span className="text-gray-300 text-[10px]">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminPaymentsPage;
