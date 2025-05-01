// frontend/src/components/CartTotal.jsx
import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const CartTotal = ({ discount, finalAmount }) => {
  const { getCartAmount, delivery_fee } = useContext(ShopContext);

  return (
    <div className='w-full'>
      <div className='text-lg font-medium'>Cart Total</div>
      <div className='text-sm mt-2'>
        <div className='flex justify-between py-1'>
          <p>Subtotal</p>
          <p>₹{getCartAmount()}</p>
        </div>
        {discount > 0 && (
          <div className='flex justify-between py-1'>
            <p>Discount</p>
            <p>-₹{discount}</p>
          </div>
        )}
        <div className='flex justify-between py-1'>
          <p>Delivery Fee</p>
          <p>₹{delivery_fee}</p>
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