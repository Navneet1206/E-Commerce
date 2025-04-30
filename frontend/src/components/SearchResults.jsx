import React from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';

const SearchResults = () => {
  const { state } = useLocation();
  const filteredProducts = state?.filteredProducts || [];
  const query = state?.query || '';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Search Results for "{query}"
      </h1>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              _id={product._id}
              images={product.images}
              name={product.name}
              price={product.price}
              stock={product.stock}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center">No products found for "{query}".</p>
      )}
    </div>
  );
};

export default SearchResults;