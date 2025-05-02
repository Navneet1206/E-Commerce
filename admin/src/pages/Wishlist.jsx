import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';

const Wishlist = ({ token }) => {
  const [wishlistedProducts, setWishlistedProducts] = useState([]);

  useEffect(() => {
    const fetchWishlistedProducts = async () => {
      try {
        const response = await axios.get(`${backendUrl}api/user/wishlists/products`, {
          headers: { token }
        });
        if (response.data.success) {
          setWishlistedProducts(response.data.wishlistedProducts);
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching wishlisted products:", error);
      }
    };
    if (token) {
      fetchWishlistedProducts();
    }
  }, [token]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Wishlisted Products</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Product Name</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Wishlist Count</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Sizes and Stock</th>
            </tr>
          </thead>
          <tbody>
            {wishlistedProducts.map((item) => (
              <tr key={item.productId} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 text-sm text-gray-700">{item.name}</td>
                <td className="py-2 px-4 text-sm text-gray-700">{item.wishlistCount}</td>
                <td className="py-2 px-4 text-sm text-gray-700">
                  {item.sizes.map((size, index) => (
                    <span key={index}>{size.size}: {size.stock}{index < item.sizes.length - 1 ? ', ' : ''}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Wishlist;