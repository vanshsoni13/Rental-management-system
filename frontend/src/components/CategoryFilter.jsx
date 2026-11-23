import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CategoryFilter = ({ categories, selectedIds, onChange, compact = false }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleCategory = (categoryId) => {
    const id = String(categoryId);
    const next = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const clearAll = () => onChange([]);

  return (
    <div ref={rootRef} className={`category-filter ${compact ? 'category-filter--compact' : ''}`}>
      <button
        type="button"
        className="category-filter-trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <span className="category-filter-label">Category</span>
          <strong>{selectedIds.length ? `${selectedIds.length} selected` : 'All Categories'}</strong>
        </span>
        <ChevronDown className={`category-filter-chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="category-filter-menu">
          <div className="category-filter-menu-header">
            <span>{selectedIds.length} selected</span>
            <button type="button" onClick={clearAll} disabled={!selectedIds.length}>Clear all</button>
          </div>
          <div className="category-filter-options">
            {categories.map((category) => {
              const id = String(category.category_id);
              const selected = selectedIds.includes(id);
              return (
                <label
                  className="category-filter-option"
                  key={id}
                >
                  <input
                    className="category-filter-checkbox"
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCategory(id)}
                  />
                  <span>{category.name}</span>
                </label>
              );
            })}
          </div>
          <div className="category-filter-menu-footer">
            <button type="button" className="category-filter-apply" onClick={() => setOpen(false)}>Apply filters</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CategoryFilter;
