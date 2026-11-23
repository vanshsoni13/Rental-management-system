import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import { PlusCircle, Edit3, Trash2, FolderPlus } from 'lucide-react';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image_url: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', image_url: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.category_id}`, formData);
        setSuccess('Category updated successfully');
      } else {
        await api.post('/categories', formData);
        setSuccess('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500 mt-1">Organize rental inventory into clear categories</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center space-x-1 shadow-sm shadow-sky-200"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.category_id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200'}
                alt={cat.name}
                className="w-14 h-14 object-cover rounded-2xl flex-shrink-0"
              />
              <div>
                <h3 className="font-bold text-gray-900 text-base">{cat.name}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mt-0.5">{cat.description || 'No description'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => openEditModal(cat)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(cat.category_id, cat.name)}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Photography Gear"
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary..."
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-sky-700 shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategoriesPage;
