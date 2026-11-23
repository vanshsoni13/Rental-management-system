import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import ProductImage from '../../components/ProductImage';
import { PlusCircle, Edit3, Trash2, Search } from 'lucide-react';
import CategoryFilter from '../../components/CategoryFilter';

const AdminProductsPage = ({ ownerOnly = false }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const fetchProducts = async () => {
    try {
      const res = ownerOnly
        ? await api.get('/sellers/products')
        : await api.get('/products', { params: { active_only: 'false' } });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete/deactivate product "${name}"?`)) return;

    try {
      const res = await api.delete(`/products/${id}`);
      setSuccess(res.data.message || 'Product removed');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = !searchTerm
      || product.name.toLowerCase().includes(searchTerm.toLowerCase())
      || (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategoryIds.length
      || selectedCategoryIds.includes(String(product.category_id));
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner message="Loading inventory..." />;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            {ownerOnly ? 'My Product Inventory' : 'Inventory Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {ownerOnly
              ? 'Manage your rental products, stock quantities, and multi-tier pricing'
              : 'Manage rental products, stock quantities, and multi-tier pricing'}
          </p>
        </div>

        <Link
          to={ownerOnly ? '/seller/products/new' : '/admin/products/new'}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-1 shadow-sm shadow-sky-200"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory by product name or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Category Filter - New Component Integrated */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm max-w-md">
        <CategoryFilter
          categories={categories}
          selectedIds={selectedCategoryIds}
          onChange={setSelectedCategoryIds}
          compact
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Daily Rate</th>
                <th className="p-4">Deposit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.product_id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900 flex items-center space-x-3">
                    <ProductImage
                      src={p.image_url}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                    <span className="line-clamp-1">{p.name}</span>
                  </td>
                  <td className="p-4 text-gray-600 font-medium">{p.category_name}</td>
                  <td className="p-4 font-bold text-gray-900">{p.total_quantity} units</td>
                  <td className="p-4 font-black text-gray-900">₹{parseFloat(p.price_daily).toLocaleString()}</td>
                  <td className="p-4 text-gray-500">₹{parseFloat(p.deposit_amount).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      to={ownerOnly ? `/seller/products/edit/${p.product_id}` : `/admin/products/edit/${p.product_id}`}
                      className="inline-flex items-center px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDeleteProduct(p.product_id, p.name)}
                      className="inline-flex items-center px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminProductsPage;
