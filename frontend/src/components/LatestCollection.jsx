import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';

const LatestCollection = () => {
  const { products, currency, navigate } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      setLatestProducts(products.slice(0, 15)); // Show 4 products for a grid layout
    }
  }, [products]);

  if (!latestProducts || latestProducts.length === 0) {
    return null;
  }

  const handleViewAllClick = () => {
    if (navigate) {
      navigate('/collection');
    } else {
      window.location.href = '/collection';
    }
  };

  return (
    <div className="py-10 bg-white">
      <div className="container mx-auto px-4">
        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {latestProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              currency={currency}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleViewAllClick}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg"
          >
            View All Collections
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, currency }) => {
  const { navigate } = useContext(ShopContext);

  const {
    _id = "",
    name = "",
    price = 799.00, // Default discounted price
    images = [],
    stock = 1
  } = product || {};

  // Calculate original price based on 20% discount
  const discountPercentage = 0.20;
  const originalPrice = price / (1 - discountPercentage);

  const hasValidPrices = price !== undefined && originalPrice !== undefined &&
                        !isNaN(price) && !isNaN(originalPrice) &&
                        originalPrice > price;

  const handleProductClick = () => {
    if (navigate) {
      navigate(`/product/${_id}`);
    } else {
      window.location.href = `/product/${_id}`;
    }
  };

  const primaryImage = images && images.length > 0 ? images[0] : assets.placeholder_image;

  const formattedOriginalPrice = hasValidPrices ?
    `${currency} ${originalPrice.toFixed(2)}` : "";
  const formattedPrice = price !== undefined && !isNaN(price) ?
    `${currency} ${price.toFixed(2)}` : "Price unavailable";

  const discountPercent = hasValidPrices ? Math.round(discountPercentage * 100) : 0;

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={handleProductClick}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: '125%' }}>
        {stock <= 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full">
            Out of Stock
          </span>
        )}
        <img
          src={primaryImage}
          alt={name}
          className="absolute top-0 left-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = assets.placeholder_image;
          }}
        />
      </div>

      <div className="p-3">
        <div className="mb-2">
          <h3 className="text-gray-800 font-medium text-sm truncate group-hover:text-red-600 transition-colors duration-300">
            {name || "Product Name"}
          </h3>
          <p className="text-xs text-gray-500 uppercase mt-1 group-hover:text-gray-700 transition-colors duration-300">
            MY STORE
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasValidPrices && (
            <span className="text-gray-500 line-through text-sm group-hover:text-gray-400 transition-colors duration-300">
              {formattedOriginalPrice}
            </span>
          )}
          <span className="text-red-600 font-bold text-base group-hover:text-red-700 transition-colors duration-300">
            {formattedPrice}
          </span>
          {hasValidPrices && discountPercent > 0 && (
            <span className="text-green-600 text-xs font-medium">
              Save {discountPercent}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestCollection;