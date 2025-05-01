import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Build cartData only after products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const itemId in cartItems) {
        for (const size in cartItems[itemId]) {
          if (cartItems[itemId][size] > 0) {
            tempData.push({
              _id: itemId,
              size: size,
              quantity: cartItems[itemId][size],
            });
          }
        }
      }
      setCartData(tempData);
      setLoading(false);
    }
  }, [cartItems, products]);

  // Handle quantity increment
  const handleIncrement = (itemId, size, currentQuantity, stock) => {
    if (currentQuantity >= stock) {
      toast.error(`Only ${stock} items available in stock`);
      return;
    }
    updateQuantity(itemId, size, currentQuantity + 1);
  };

  // Handle quantity decrement
  const handleDecrement = (itemId, size, currentQuantity) => {
    if (currentQuantity <= 1) {
      updateQuantity(itemId, size, 0); // Remove item if quantity becomes 0
      return;
    }
    updateQuantity(itemId, size, currentQuantity - 1);
  };

  // Handle direct input change
  const handleQuantityChange = (itemId, size, value, stock) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (newQuantity > stock) {
      toast.error(`Only ${stock} items available in stock`);
      updateQuantity(itemId, size, stock);
      return;
    }
    if (newQuantity === 0) {
      updateQuantity(itemId, size, 0); // Remove item
    } else {
      updateQuantity(itemId, size, newQuantity);
    }
  };

  // Show a loading message while products are being fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>
      {cartData.length === 0 ? (
        <div className="text-center py-10 text-gray-600">Your cart is empty</div>
      ) : (
        <>
          <div>
            {cartData.map((item, index) => {
              // Find the product matching the item's _id
              const productData = products.find((product) => product._id === item._id);

              // Skip rendering if productData is undefined
              if (!productData) {
                console.warn(`Product with id ${item._id} not found`);
                return null;
              }

              return (
                <div
                  key={index}
                  className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                >
                  <div className="flex items-start gap-6">
                    <img
                      src={productData.images?.[0] || assets.placeholder_image}
                      className="w-16 sm:w-20"
                      alt={productData.name}
                    />
                    <div>
                      <p className="text-xs sm:text-lg font-medium">{productData.name}</p>
                      <div className="flex items-center gap-5 mt-2">
                        <p>{currency}{productData.price}</p>
                        <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">{item.size}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(item._id, item.size, item.quantity)}
                      className="px-2 py-1 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
                      disabled={item.quantity <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={productData.stock}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item._id, item.size, e.target.value, productData.stock)}
                      className="w-16 py-2 px-3 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                      disabled={productData.stock === 0}
                    />
                    <button
                      onClick={() => handleIncrement(item._id, item.size, item.quantity, productData.stock)}
                      className="px-2 py-1 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
                      disabled={item.quantity >= productData.stock}
                    >
                      +
                    </button>
                  </div>
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    src={assets.bin_icon}
                    className="w-4 mr-4 sm:w-5 cursor-pointer"
                    alt="Remove"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end my-20">
            <div className="w-full sm:w-[450px]">
              <CartTotal />
              <div className="w-full text-end">
                <button
                  onClick={() => navigate('/place-order')}
                  className="bg-black text-white text-sm my-8 px-8 py-3"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;