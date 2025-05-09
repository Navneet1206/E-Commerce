import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const ProductCard = ({ _id, images, name, price, stock }) => {
  const { currency } = useContext(ShopContext);

  // Ensure `images` is an array and has at least one element
  const productImage = Array.isArray(images) && images.length > 0 ? images[0] : assets.placeholder_image;

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

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { y: -8, boxShadow: '0 10px 20px rgba(0,0,0,0.15)', transition: { duration: 0.3 } },
  };

  const imageVariants = {
    hover: { scale: 1.1, transition: { duration: 0.5 } },
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.3 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: '#4338CA', transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  return (
    <Link to={_id ? `/product/${_id}` : '#'} className="block">
      <motion.div
        className="group bg-white rounded-xl overflow-hidden shadow-md flex flex-col relative"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        role="article"
        aria-label={`Product: ${name || 'Unnamed Product'}`}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden" style={{ paddingTop: '125%' }}>
          {/* Badges */}
          {stock <= 0 ? (
            <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
              Sold Out
            </span>
          ) : (
            hasValidPrices && (
              <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                Sale
              </span>
            )
          )}

          {/* Product Image */}
          <motion.img
            src={productImage}
            alt={name || 'Product'}
            className="absolute top-0 left-0 w-full h-full object-cover object-center"
            variants={imageVariants}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = assets.placeholder_image;
            }}
          />

          {/* Overlay with Quick View Button */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"
            variants={overlayVariants}
            initial="initial"
            animate="initial"
            whileHover="hover"
          >
            <motion.button
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-100"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              aria-label="Quick view product"
            >
              Quick View
            </motion.button>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col justify-between bg-white">
          <div className="mb-2">
            <h3 className="text-gray-800 font-semibold text-base truncate group-hover:text-indigo-600 transition-colors duration-300">
              {name || 'Product Name'}
            </h3>
            <p className="text-xs text-gray-500 uppercase mt-1 group-hover:text-gray-700 transition-colors duration-300">
              My Store
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasValidPrices && (
              <span className="text-gray-400 line-through text-sm group-hover:text-gray-500 transition-colors duration-300">
                {formattedOriginalPrice}
              </span>
            )}
            <span className="text-indigo-600 font-bold text-lg group-hover:text-indigo-700 transition-colors duration-300">
              {formattedPrice}
            </span>
            {hasValidPrices && discountPercent > 0 && (
              <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                Save {discountPercent}%
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;