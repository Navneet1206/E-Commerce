// frontend/src/components/CartTotal.jsx
import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const CartTotal = ({ discount = 0 }) => {
  const { getCartAmount, delivery_fee } = useContext(ShopContext);

  const subtotal = getCartAmount() || 0;
  const deliveryFee = delivery_fee || 0;
  const validDiscount = discount || 0;

  const finalAmount = subtotal - validDiscount + deliveryFee;

  return (
    <div className='w-full'>
      <div className='text-lg font-medium'>Cart Total</div>
      <div className='text-sm mt-2'>
        <div className='flex justify-between py-1'>
          <p>Subtotal</p>
          <p>₹{subtotal}</p>
        </div>
        {validDiscount > 0 && (
          <div className='flex justify-between py-1'>
            <p>Discount</p>
            <p>-₹{validDiscount}</p>
          </div>
        )}
        <div className='flex justify-between py-1'>
          <p>Delivery Fee</p>
          <p>₹{deliveryFee}</p>
        </div>
        <div className='flex justify-between py-1 font-medium'>
          <p>Total</p>
          <p>₹{finalAmount}</p>
        </div>
      </div>
    </div>
  );
};


export default CartTotal;