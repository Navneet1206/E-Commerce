import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const ProductItem = ({ id, image, name, price, stock }) => {
  const { currency } = useContext(ShopContext);

  // Ensure `image` is an array and has at least one element
  const productImage = Array.isArray(image) && image.length > 0 ? image[0] : assets.placeholder_image;

  // Calculate original price based on 20% discount
  const discountPercentage = 0.20;
  const originalPrice = price / (1 - discountPercentage);

  const hasValidPrices =
    price !== undefined &&
    originalPrice !== undefined &&
    !isNaN(price) &&
    !isNaN(originalPrice) &&
    originalPrice > price;

  const formattedOriginalPrice = hasValidPrices ? `${currency}${originalPrice.toFixed(2)}` : '';
  const formattedPrice =
    price !== undefined && !isNaN(price) ? `${currency}${price.toFixed(2)}` : 'Price unavailable';
  const discountPercent = hasValidPrices ? Math.round(discountPercentage * 100) : 0;

  return (
    <Link
      className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col"
      to={id ? `/product/${id}` : '#'}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: '125%' }}>
        {stock <= 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full">
            Out of Stock
          </span>
        )}
        <img
          src={productImage}
          alt={name || 'Product'}
          className="absolute top-0 left-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = assets.placeholder_image;
          }}
        />
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="text-gray-800 font-medium text-sm truncate group-hover:text-red-600 transition-colors duration-300">
            {name || 'Product Name'}
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
    </Link>
  );
};

export default ProductItem;