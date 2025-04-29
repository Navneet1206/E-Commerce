import React, { useContext, useState, useEffect } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Load Razorpay key from environment variables
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
  const [method, setMethod] = useState('cod');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: ''
  });

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast.error('Failed to load Razorpay payment system');
      setRazorpayLoaded(false);
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      // Validate backendUrl
      if (!backendUrl) {
        throw new Error('Backend URL is not defined');
      }
      new URL(backendUrl);

      // Validate token
      if (!token) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Validate form data
      const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'zipcode', 'country', 'phone'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`Please fill in the ${field} field`);
        }
      }

      // Prepare order items
      let orderItems = [];
      Object.keys(cartItems).forEach((itemId) => {
        Object.keys(cartItems[itemId]).forEach((size) => {
          if (cartItems[itemId][size] > 0) {
            const itemInfo = structuredClone(products.find((product) => product._id === itemId));
            if (itemInfo) {
              itemInfo.size = size;
              itemInfo.quantity = cartItems[itemId][size];
              orderItems.push(itemInfo);
            } else {
              console.warn(`Product with ID ${itemId} not found`);
            }
          }
        });
      });

      if (orderItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Extract userId from token
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.id;
      } catch (error) {
        throw new Error('Invalid token format');
      }

      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
        userId
      };

      console.log('Order Data:', orderData); // Debug log

      switch (method) {
        case 'cod':
          const response = await axios.post(`${backendUrl}/api/order/place`, orderData, {
            headers: { token }
          });
          if (response.data.success) {
            setCartItems({});
            toast.success('Order placed successfully');
            navigate('/orders');
          } else {
            throw new Error(response.data.message || 'Failed to place order');
          }
          break;

        case 'razorpay':
          if (!razorpayLoaded || !window.Razorpay) {
            throw new Error('Razorpay payment system not loaded. Please try again.');
          }
          if (!RAZORPAY_KEY_ID) {
            throw new Error('Razorpay key is not configured');
          }
          const responseRazorpay = await axios.post(`${backendUrl}/api/order/razorpay`, orderData, {
            headers: { token }
          });
          if (responseRazorpay.data.success) {
            const { orderId, amount } = responseRazorpay.data;
            const options = {
              key: RAZORPAY_KEY_ID, // Use environment variable
              currency: "INR",
              name: "Forever",
              description: "Order Payment",
              order_id: orderId,
              handler: async function (response) {
                try {
                  const verificationData = {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    userId
                  };
                  const verificationResponse = await axios.post(
                    `${backendUrl}/api/order/verify`,
                    verificationData,
                    { headers: { token } }
                  );
                  if (verificationResponse.data.success) {
                    setCartItems({});
                    toast.success('Payment successful');
                    navigate('/orders');
                  } else {
                    throw new Error(verificationResponse.data.message || 'Payment verification failed');
                  }
                } catch (error) {
                  console.error('Payment verification error:', error);
                  toast.error(error.message || 'Payment verification failed');
                }
              },
              prefill: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                contact: formData.phone
              },
              theme: {
                color: "#3399cc"
              }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
              toast.error(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
          } else {
            throw new Error(responseRazorpay.data.message || 'Failed to initiate Razorpay payment');
          }
          break;

        default:
          throw new Error('Invalid payment method selected');
      }
    } catch (error) {
      console.error('Place order error:', error);
      toast.error(error.message || 'An error occurred while placing the order');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className='flex gap-3'>
          <input
            required
            onChange={onChangeHandler}
            name='firstName'
            value={formData.firstName}
            className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
            type="text"
            placeholder='First name'
          />
          <input
            required
            onChange={onChangeHandler}
            name='lastName'
            value={formData.lastName}
            className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
            type="text"
            placeholder='Last name'
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name='email'
          value={formData.email}
          className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
          type="email"
          placeholder='Email address'
        />
        <input
          required
          onChange={onChangeHandler}
          name='street'
          value={formData.street}
          className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
          type="text"
          placeholder='Street'
        />
        <div className='flex gap-3'>
          <input
            required
            onChange={onChangeHandler}
            name='city'
            value={formData.city}
            className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
            type="text"
            placeholder='City'
          />
          <input
            required
            onChange={onChangeHandler}
            name='state'
            value={formData.state}
            className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
            type="text"
            placeholder='State'
          />
        </div>
        <div className='flex gap-3'>
          <input
            required
            onChange={onChangeHandler}
            name='zipcode'
            value={formData.zipcode}
            className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
            type="number"
            placeholder='Zipcode'
          />
          <input
            required
            onChange={onChangeHandler}
            name='country'
            value={formData.country}
            className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
            type="text"
            placeholder='Country'
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name='phone'
          value={formData.phone}
          className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
          type="number"
          placeholder='Phone'
        />
      </div>
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal />
        </div>
        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          <div className='flex gap-3 flex-col lg:flex-row'>
            <div onClick={() => setMethod('razorpay')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'razorpay' ? 'bg-green-400' : ''}`}></p>
              <img className={`h-5 mx-4`} src={assets.razorpay_logo} alt="Razorpay" />
            </div>
            <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
            </div>
          </div>
          <div className='w-full text-end mt-8'>
            <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>PLACE ORDER</button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;