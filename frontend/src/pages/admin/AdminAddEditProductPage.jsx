import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import { Save, ArrowLeft, ImagePlus, X } from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

const AdminAddEditProductPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const productListPath = isAdmin ? '/admin/products' : '/seller/inventory';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState('');

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    image_url: '',
    total_quantity: 1,
    price_hourly: 0,
    price_daily: 0,
    price_weekly: 0,
    price_monthly: 0,
    price_yearly: 0,
    deposit_amount: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setSelectedImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
      if (!isEdit && res.data.categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data.categories[0].category_id }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = isAdmin
        ? await api.get(`/products/${id}`)
        : await api.get(`/products/mine/${id}`);
      const p = res.data.product;
      setFormData({
        category_id: p.category_id,
        name: p.name,
        description: p.description,
        image_url: p.image_url || '',
        total_quantity: p.total_quantity,
        price_hourly: p.price_hourly,
        price_daily: p.price_daily,
        price_weekly: p.price_weekly,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        deposit_amount: p.deposit_amount,
        is_active: Boolean(p.is_active)
      });
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!allowedImageExtensions.includes(extension) || (file.type && !allowedImageTypes.includes(file.type))) {
      setSelectedImage(null);
      setError('Choose a JPG, JPEG, PNG, or WEBP image');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setSelectedImage(null);
      setError('Image must be 5 MB or smaller');
      return;
    }

    setError('');
    setSelectedImage(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let productData = formData;
      if (selectedImage) {
        const uploadData = new FormData();
        uploadData.append('image', selectedImage);
        const uploadRes = await api.post('/products/upload-image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        productData = { ...formData, image_url: uploadRes.data.image_url };
      }

      if (isEdit) {
        await api.put(`/products/${id}`, productData);
      } else {
        await api.post('/products', productData);
      }
      navigate(productListPath);
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading product data..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-gray-500 mt-1">Configure product pricing tiers, stock quantity, and category</p>
        </div>

        <button
          onClick={() => navigate(productListPath)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        
        {/* Category & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Stock Quantity</label>
            <input
              type="number"
              name="total_quantity"
              min={0}
              required
              value={formData.total_quantity}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Sony Alpha A7 IV Camera"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Image</label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition">
              <ImagePlus className="w-4 h-4" />
              <span>Select Image</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-gray-500">
              {selectedImage ? selectedImage.name : 'JPG, JPEG, PNG, or WEBP (max 5 MB)'}
            </span>
          </div>
          {(selectedImagePreview || formData.image_url) && (
            <div className="mt-4 flex items-start gap-3">
              <img
                src={selectedImagePreview || formData.image_url}
                alt="Product preview"
                className="w-32 h-32 object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <X className="w-4 h-4" />
                Remove image
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed specifications and rental terms..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Tier Rates */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Multi-Tier Pricing Rates (₹)</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hourly Rate</label>
              <input
                type="number"
                step="0.01"
                name="price_hourly"
                value={formData.price_hourly}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-sky-600 uppercase mb-1">Daily Rate</label>
              <input
                type="number"
                step="0.01"
                name="price_daily"
                value={formData.price_daily}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-sky-300 text-xs font-bold text-sky-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Weekly Rate</label>
              <input
                type="number"
                step="0.01"
                name="price_weekly"
                value={formData.price_weekly}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monthly Rate</label>
              <input
                type="number"
                step="0.01"
                name="price_monthly"
                value={formData.price_monthly}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Yearly Rate</label>
              <input
                type="number"
                step="0.01"
                name="price_yearly"
                value={formData.price_yearly}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Security Deposit Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              name="deposit_amount"
              value={formData.deposit_amount}
              onChange={handleChange}
              className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-900"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-sky-600 rounded"
          />
          <label htmlFor="is_active" className="text-xs font-bold text-gray-700">Product is Active & Available in Catalog</label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl transition duration-150 shadow-lg shadow-sky-200 flex items-center justify-center space-x-2 text-xs"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving Product...' : (isEdit ? 'Update Product' : 'Create Product')}</span>
        </button>

      </form>
    </div>
  );
};

export default AdminAddEditProductPage;
