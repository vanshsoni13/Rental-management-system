import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { Check, RefreshCw, X } from 'lucide-react';

const statuses = ['pending', 'approved', 'rejected', 'suspended'];

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [savingSellerId, setSavingSellerId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/sellers', {
        params: statusFilter ? { status: statusFilter } : {}
      });
      setSellers(response.data.sellers || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to load seller applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const updateStatus = async (seller, status) => {
    setSavingSellerId(seller.seller_id);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/sellers/${seller.seller_id}/status`, {
        status,
        admin_notes: status === 'approved' ? '' : window.prompt('Optional note for this seller:') || ''
      });
      setSuccess(`${seller.store_name} ${status}.`);
      await fetchSellers();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to update seller status');
    } finally {
      setSavingSellerId(null);
    }
  };

  if (loading && sellers.length === 0) return <LoadingSpinner message="Loading seller applications..." />;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Seller Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage seller account access.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
            <option value="">All statuses</option>
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <button onClick={fetchSellers} className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" aria-label="Refresh sellers">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Seller / Store</th>
                <th className="p-4">Pickup Address</th>
                <th className="p-4">GSTIN</th>
                <th className="p-4">Seller Number</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sellers.map(seller => (
                <tr key={seller.seller_id} className="align-top hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{seller.store_name}</p>
                    <p className="text-gray-600 mt-1">{seller.name}</p>
                    <p className="text-gray-500 mt-1">{seller.email}{seller.phone ? ` · ${seller.phone}` : ''}</p>
                    {seller.store_description && <p className="text-gray-500 mt-2 max-w-sm">{seller.store_description}</p>}
                    {seller.admin_notes && <p className="text-rose-600 mt-2">Note: {seller.admin_notes}</p>}
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs">{seller.pickup_address}</td>
                  <td className="p-4 text-gray-600">{seller.gstin || '—'}</td>
                  <td className="p-4 font-bold text-gray-900">
                    {seller.status === 'approved' && seller.seller_number ? seller.seller_number : '—'}
                  </td>
                  <td className="p-4"><StatusBadge status={seller.status} /></td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => updateStatus(seller, 'approved')}
                      disabled={savingSellerId === seller.seller_id || seller.status === 'approved'}
                      className="inline-flex items-center px-2.5 py-1.5 mr-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />Approve
                    </button>
                    <button
                      onClick={() => updateStatus(seller, 'rejected')}
                      disabled={savingSellerId === seller.seller_id || seller.status === 'rejected'}
                      className="inline-flex items-center px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg disabled:opacity-40"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />Reject
                    </button>
                    {seller.status === 'approved' && (
                      <button
                        onClick={() => updateStatus(seller, 'suspended')}
                        disabled={savingSellerId === seller.seller_id}
                        className="block ml-auto mt-2 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg disabled:opacity-40"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sellers.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No seller applications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSellersPage;
