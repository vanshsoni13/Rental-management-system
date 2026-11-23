import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import CategoryFilter from '../../components/CategoryFilter';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Search, PackageX } from 'lucide-react';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('recommended');
  const searchQuery = searchParams.get('search');

  const initialCategoryIds = searchParams.get('category_ids')?.split(',').filter(Boolean)
    || (searchParams.get('category_id') ? [searchParams.get('category_id')] : []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(initialCategoryIds);

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', searchQuery ? { params: { search: searchQuery } } : undefined);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery]);

  const updateCategorySelection = (ids) => {
    setSelectedCategoryIds(ids);
    const next = new URLSearchParams(searchParams);
    if (ids.length) {
      next.set('category_ids', ids.join(','));
      next.delete('category_id');
    } else {
      next.delete('category_ids');
      next.delete('category_id');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const query = searchTerm.trim();
    if (query) next.set('search', query);
    else next.delete('search');
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('recommended');
    setSelectedCategoryIds([]);
    setSearchParams({});
  };

  const visibleProducts = products
    .filter((product) => {
      if (!selectedCategoryIds.length) return true;
      return selectedCategoryIds.includes(String(product.category_id));
    })
    .slice()
    .sort((left, right) => {
      if (sortBy === 'price-low') return Number(left.price_daily) - Number(right.price_daily);
      if (sortBy === 'price-high') return Number(right.price_daily) - Number(left.price_daily);
      if (sortBy === 'name') return String(left.name).localeCompare(String(right.name));
      return Number(right.product_id) - Number(left.product_id);
    });

  return (
    <div className="catalog-page">
      <header className="page-header catalog-header">
        <div>
          <p className="page-eyebrow">Equipment library</p>
          <h1>Find the right gear.</h1>
          <p>Browse live inventory and choose a rental that fits your project.</p>
        </div>
        <span className="catalog-count">{loading ? 'UPDATING' : `${visibleProducts.length} items`}</span>
      </header>

      <div className="catalog-toolbar">
        <form className="catalog-search" onSubmit={handleSearchSubmit}>
          <label htmlFor="catalog-search">Search inventory</label>
          <div className="catalog-search-input">
            <Search />
            <input
              id="catalog-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products, equipment, vehicles..."
            />
            <button type="submit" className="button button-primary">Search</button>
          </div>
        </form>

        <div className="catalog-filter-controls">
          <CategoryFilter
            categories={categories}
            selectedIds={selectedCategoryIds}
            onChange={updateCategorySelection}
          />
          <div className="catalog-sort">
            <label htmlFor="catalog-sort">Sort by</label>
            <select id="catalog-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="catalog-results-meta">
        <div>
          <strong>{loading ? 'Loading inventory' : visibleProducts.length}</strong>
          <span>{loading ? '' : visibleProducts.length === 1 ? ' item available' : ' items available'}</span>
        </div>
        {(selectedCategoryIds.length > 0 || searchTerm.trim() || sortBy !== 'recommended') && (
          <button type="button" className="catalog-reset" onClick={resetFilters}>Clear filters</button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading catalog..." />
      ) : visibleProducts.length === 0 ? (
        <div className="empty-state">
          <PackageX />
          <h2>No matching rentals</h2>
          <p>Try a broader search or clear the selected categories.</p>
          <button type="button" className="button button-secondary" onClick={resetFilters}>Reset catalog</button>
        </div>
      ) : (
        <div className="catalog-grid">
          {visibleProducts.map((product) => (
            <div className="catalog-product-card" key={product.product_id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
