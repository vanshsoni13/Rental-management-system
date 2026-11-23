import React from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';

const ProductCard = ({ product }) => {
  const isAvailable = product.is_active && product.total_quantity > 0;
  const location = product.location || product.city || product.pickup_address;

  return (
    <article className="group catalog-product-card-inner flex flex-col overflow-hidden bg-white">
      <div className="catalog-card-image overflow-hidden bg-[var(--surface-subtle)]">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-[1.035] transition duration-700"
        />
      </div>

      <div className="catalog-card-body flex flex-1 flex-col">
        <div className="catalog-card-heading">
          <p className="catalog-card-category">{product.category_name || 'Rental equipment'}</p>
          <span className={`catalog-availability ${isAvailable ? 'is-available' : 'is-unavailable'}`}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <h3 className="catalog-card-name">{product.name}</h3>

        {product.description && (
          <p className="catalog-card-description">{product.description}</p>
        )}

        {location && (
          <p className="catalog-card-location">{location}</p>
        )}

        <div className="catalog-card-price-row">
          <div>
            <span>Daily rental</span>
            <strong>₹{parseFloat(product.price_daily).toLocaleString()}<small>/day</small></strong>
          </div>
          <div>
            <span>Security deposit</span>
            <strong>₹{parseFloat(product.deposit_amount).toLocaleString()}</strong>
          </div>
        </div>

        <div className="catalog-card-status">
          <span className={isAvailable ? 'status-dot is-available' : 'status-dot is-unavailable'} />
          <span>{isAvailable ? `${product.total_quantity} units available` : 'Currently unavailable'}</span>
        </div>

        <div className="catalog-card-actions mt-auto">
          <Link to={`/products/${product.product_id}`} className="catalog-view-button">
            View Details
          </Link>
          <Link
            to={`/booking/${product.product_id}`}
            className="catalog-rent-button"
            aria-disabled={!isAvailable}
            onClick={(event) => {
              if (!isAvailable) event.preventDefault();
            }}
          >
            Rent Now
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
