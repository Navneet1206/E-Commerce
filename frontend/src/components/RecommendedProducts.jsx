import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';
import Title from './Title';

const RecommendedProducts = () => {
  const { token, backendUrl } = useContext(ShopContext);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${backendUrl}/api/user/recommendations`, {
          headers: { token },
        });
        const data = await response.json();
        if (data.success) {
          setRecommended(data.recommendations);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };
    fetchRecommendations();
  }, [token, backendUrl]);

  if (recommended.length === 0) return null;

  return (
    <motion.section
      className="my-12 py-12 bg-gradient-to-b from-gray-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center text-3xl py-8">
          <Title text1={'RECOMMENDED'} text2={'FOR YOU'} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {recommended.map((item, index) => (
            <ProductItem
              key={index}
              id={item._id}
              image={item.images}
              name={item.name}
              price={item.price}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default RecommendedProducts;