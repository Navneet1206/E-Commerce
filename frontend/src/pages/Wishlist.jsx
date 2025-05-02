import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from '../components/ProductItem';
import Title from '../components/Title';

const Wishlist = () => {
  const { products, token, wishlist, localWishlist, removeFromWishlist } = useContext(ShopContext);
  const [wishlistProducts, setWishlistProducts] = useState([]);

  useEffect(() => {
    if (token) {
      setWishlistProducts(products.filter(product => wishlist.includes(product._id)));
    } else {
      setWishlistProducts(products.filter(product => localWishlist.includes(product._id)));
    }
  }, [token, wishlist, localWishlist, products]);

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={'MY'} text2={'WISHLIST'} />
      </div>
      {wishlistProducts.length === 0 ? (
        <p className="text-center py-10 text-gray-600">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {wishlistProducts.map((product, index) => (
            <div key={index} className="relative">
              <ProductItem id={product._id} image={product.images} name={product.name} price={product.price} />
              <button
                onClick={() => removeFromWishlist(product._id)}
                className="mt-2 w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;