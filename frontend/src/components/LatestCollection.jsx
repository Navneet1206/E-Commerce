import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';

const LatestCollection = () => {
  const { products, currency, navigate, getDiscountedPrice } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      setLatestProducts(products.slice(0, 15));
    }
  }, [products]);

  if (!latestProducts || latestProducts.length === 0) {
    return null;
  }

  const handleViewAllClick = () => {
    navigate ? navigate('/collection') : (window.location.href = '/collection');
  };

  // Animation variants for product card
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
    <motion.section
      className="py-12 bg-gradient-to-b from-gray-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Latest Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {latestProducts.map((product, index) => {
            const {
              _id = '',
              name = 'Product Name',
              price = 799.0,
              images = [],
              stock = 1,
            } = product || {};

            const discountedPrice = getDiscountedPrice(price);
            const hasDiscount =
              discountedPrice < price && !isNaN(discountedPrice) && !isNaN(price);
            const discountPercent = hasDiscount
              ? Math.round(((price - discountedPrice) / price) * 100)
              : 0;

            const primaryImage =
              images && images.length > 0 ? images[0] : assets.placeholder_image;
            const formattedOriginalPrice = hasDiscount ? `${currency}${price.toFixed(2)}` : '';
            const formattedPrice = !isNaN(discountedPrice)
              ? `${currency}${discountedPrice.toFixed(2)}`
              : 'Price unavailable';

            return (
              <motion.div
                key={_id || index}
                className="bg-white rounded-xl overflow-hidden shadow-md flex flex-col relative group"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: index * 0.1 }}
                role="article"
                aria-label={`Product: ${name}`}
                onClick={() =>
                  navigate
                    ? navigate(`/product/${_id}`)
                    : (window.location.href = `/product/${_id}`)
                }
              >
                {/* Image Section */}
                <div className="relative overflow-hidden" style={{ paddingTop: '125%' }}>
                  {/* Badges */}
                  {stock <= 0 ? (
                    <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                      Sold Out
                    </span>
                  ) : (
                    hasDiscount && (
                      <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                        Sale
                      </span>
                    )
                  )}

                  {/* Product Image */}
                  <motion.img
                    src={primaryImage}
                    alt={name}
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
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigating to product page
                        // Add quick view logic here (e.g., open modal)
                      }}
                    >
                      Quick View
                    </motion.button>
                  </motion.div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div className="mb-2">
                    <h3 className="text-gray-800 font-semibold text-base truncate group-hover:text-indigo-600 transition-colors duration-300">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase mt-1 group-hover:text-gray-700 transition-colors duration-300">
                      My Store
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {hasDiscount && (
                      <span className="text-gray-400 line-through text-sm group-hover:text-gray-500 transition-colors duration-300">
                        {formattedOriginalPrice}
                      </span>
                    )}
                    <span className="text-indigo-600 font-bold text-lg group-hover:text-indigo-700 transition-colors duration-300">
                      {formattedPrice}
                    </span>
                    {hasDiscount && discountPercent > 0 && (
                      <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                        Save {discountPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <motion.button
            onClick={handleViewAllClick}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            aria-label="View all collections"
          >
            View All Collections
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

export default LatestCollection;