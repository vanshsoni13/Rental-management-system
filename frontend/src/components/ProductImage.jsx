import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

const ProductImage = ({ src, alt, className = '' }) => {
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setUnavailable(false);
  }, [src]);

  if (!src || unavailable) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <Package className="w-6 h-6 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setUnavailable(true)}
    />
  );
};

export default ProductImage;
