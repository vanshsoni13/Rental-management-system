import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer directory..." />;

  return (
    <div className="space-y-8 pb-16">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">Customer Directory</h1>
        <p className="text-sm text-gray-500 mt-1">View registered platform users, booking activity, and total spending</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Member Since</th>
                <th className="p-4">Total Bookings</th>
                <th className="p-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.user_id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900 flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      {c.name?.charAt(0)}
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="p-4 text-gray-600">{c.email}</td>
                  <td className="p-4 text-gray-600">{c.phone || 'N/A'}</td>
                  <td className="p-4 text-gray-500">{c.created_at ? format(new Date(c.created_at), 'MMM dd, yyyy') : 'N/A'}</td>
                  <td className="p-4 font-bold text-gray-900">{c.total_bookings} bookings</td>
                  <td className="p-4 font-black text-emerald-600 text-right">₹{parseFloat(c.total_spent || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminCustomersPage;
