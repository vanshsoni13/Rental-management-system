import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import { Download, Award, TrendingUp, RefreshCw } from 'lucide-react';

const AdminReportsPage = ({ ownerOnly = false }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = ownerOnly
        ? await api.get('/sellers/reports')
        : await api.get('/admin/revenue');
      setReportData(res.data);
    } catch (err) {
      console.error('Error loading report analytics:', err);
      setError(err.response?.data?.error || 'Failed to load report analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.top_rented_products) return;

    let csvContent = "data:text/csv;charset=utf-8,Product ID,Product Name,Category,Times Rented,Revenue Generated (INR)\n";
    reportData.top_rented_products.forEach(p => {
      csvContent += `${p.product_id},"${p.product_name}","${p.category_name}",${p.times_rented},${p.total_revenue_generated}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rental_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner message="Generating business reports..." />;

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            {ownerOnly ? 'My Product Reports' : 'Analytics & Reports'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {ownerOnly
              ? 'Top performing products you created and CSV export'
              : 'Revenue trends, payment distribution, and top performing rental items'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="border border-gray-200 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!reportData?.top_rented_products?.length}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-2 shadow-sm shadow-emerald-200 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      <AlertBanner type="error" message={error} />

      {reportData && !ownerOnly && (
        <>
          {!reportData.top_rented_products?.length && (
            <div className="bg-white border border-gray-200 p-4 text-sm text-gray-600">
              No rental activity is available for reports yet.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
              </div>
              <p className="mt-3 text-2xl font-black text-gray-900">
                ₹{Number(reportData.total_revenue || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-gray-900 text-base">Monthly Revenue</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Month</th>
                      <th className="p-4 text-right">Transactions</th>
                      <th className="p-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.monthly_revenue?.length ? reportData.monthly_revenue.map((month) => (
                      <tr key={month.month}>
                        <td className="p-4 font-bold text-gray-800">{month.month}</td>
                        <td className="p-4 text-right text-gray-600">{month.transaction_count}</td>
                        <td className="p-4 text-right font-bold text-gray-900">₹{Number(month.monthly_total || 0).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="p-6 text-center text-gray-500">No monthly revenue data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-gray-900 text-base">Revenue by Payment Type</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Payment Type</th>
                      <th className="p-4 text-right">Transactions</th>
                      <th className="p-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.revenue_by_type?.length ? reportData.revenue_by_type.map((payment) => (
                      <tr key={payment.payment_type}>
                        <td className="p-4 font-bold text-gray-800">{payment.payment_type || 'Other'}</td>
                        <td className="p-4 text-right text-gray-600">{payment.count}</td>
                        <td className="p-4 text-right font-bold text-gray-900">₹{Number(payment.total_amount || 0).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="p-6 text-center text-gray-500">No payment data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {reportData && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-gray-900 text-base">Top Rented Products Ranking</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Rank</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Times Rented</th>
                  <th className="p-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.top_rented_products?.length ? reportData.top_rented_products.map((p, idx) => (
                  <tr key={p.product_id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-400">#{idx + 1}</td>
                    <td className="p-4 font-bold text-gray-900">{p.product_name}</td>
                    <td className="p-4 text-gray-600">{p.category_name}</td>
                    <td className="p-4 font-bold text-sky-600">{p.times_rented} times</td>
                    <td className="p-4 font-black text-emerald-600 text-right">₹{Number(p.total_revenue_generated || 0).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No rented products to rank yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReportsPage;
