import React, { useContext, useState, useEffect } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
  const [method, setMethod] = useState('cod');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true); // Default to true for first-time users

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

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('Razorpay script failed to load');
      toast.error('Failed to load Razorpay');
      setRazorpayLoaded(false);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/user/addresses`, { headers: { token } });
        if (response.data.success) {
          setAddresses(response.data.addresses);
          if (response.data.addresses.length === 0) {
            setUseNewAddress(true); // Auto-enable new address form for first-time users
          }
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error(error.message);
      }
    };
    if (token) {
      fetchAddresses();
    }
  }, [token, backendUrl]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const deleteAddress = async (addressId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/delete-address`,
        { addressId },
        { headers: { token } }
      );
      if (response.data.success) {
        setAddresses((prev) => prev.filter((addr) => addr._id.toString() !== addressId));
        if (selectedAddress?._id.toString() === addressId) {
          setSelectedAddress(null);
        }
        toast.success("Address deleted");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.message);
    }
  };

  const editAddress = (addr) => {
    setUseNewAddress(true);
    setFormData({
      firstName: addr.firstName,
      lastName: addr.lastName,
      email: addr.email,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipcode: addr.zipcode,
      country: addr.country,
      phone: addr.phone,
    });
    setSelectedAddress(addr);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (!backendUrl) throw new Error('Backend URL not defined');
      if (!token) throw new Error('Please log in first');

      const addressToUse = useNewAddress ? formData : selectedAddress;
      if (!addressToUse) {
        throw new Error("Please select an address or add a new one");
      }

      const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'zipcode', 'country', 'phone'];
      for (const field of requiredFields) {
        if (!addressToUse[field]) throw new Error(`Please fill ${field}`);
      }

      let orderItems = [];
      for (const itemId in cartItems) {
        for (const size in cartItems[itemId]) {
          if (cartItems[itemId][size] > 0) {
            const itemInfo = structuredClone(products.find((product) => product._id === itemId));
            if (itemInfo) {
              itemInfo.size = size;
              itemInfo.quantity = cartItems[itemId][size];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      if (orderItems.length === 0) throw new Error('Cart is empty');

      const orderData = {
        address: addressToUse,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
        userId: JSON.parse(atob(token.split('.')[1])).id,
      };

      console.log('Sending order data:', orderData);

      if (method === 'cod') {
        const response = await axios.post(`${backendUrl}/api/order/place`, orderData, { headers: { token } });
        if (response.data.success) {
          if (useNewAddress && saveAddress) {
            const addressResponse = await axios.post(
              `${backendUrl}/api/user/add-address`,
              { address: formData },
              { headers: { token } }
            );
            if (addressResponse.data.success) {
              setAddresses((prev) => [...prev, { ...formData, _id: addressResponse.data.addressId }]);
            }
          }
          setCartItems({});
          toast.success('Order placed');
          navigate('/orders');
        } else {
          throw new Error(response.data.message);
        }
      } else if (method === 'razorpay') {
        if (!razorpayLoaded || !window.Razorpay) throw new Error('Razorpay not loaded');

        const response = await axios.post(`${backendUrl}/api/order/razorpay`, orderData, { headers: { token } });
        if (!response.data.success) throw new Error(response.data.message);

        const { orderId, keyId } = response.data;
        const options = {
          key: keyId,
          amount: (orderData.amount * 100).toString(),
          currency: "INR",
          name: "Forever",
          description: "Order Payment",
          order_id: orderId,
          handler: async (response) => {
            try {
              const verificationData = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: orderData.userId,
              };
              const verifyResponse = await axios.post(`${backendUrl}/api/order/verify`, verificationData, { headers: { token } });
              if (verifyResponse.data.success) {
                if (useNewAddress && saveAddress) {
                  const addressResponse = await axios.post(
                    `${backendUrl}/api/user/add-address`,
                    { address: formData },
                    { headers: { token } }
                  );
                  if (addressResponse.data.success) {
                    setAddresses((prev) => [...prev, { ...formData, _id: addressResponse.data.addressId }]);
                  }
                }
                setCartItems({});
                toast.success('Payment successful');
                navigate('/orders');
              } else {
                throw new Error(verifyResponse.data.message);
              }
            } catch (error) {
              toast.error(error.message);
            }
          },
          prefill: {
            name: `${addressToUse.firstName} ${addressToUse.lastName}`,
            email: addressToUse.email,
            contact: addressToUse.phone,
          },
          theme: { color: "#3399cc" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => toast.error(response.error.description));
        rzp.open();
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Error placing order');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        {addresses.length > 0 && !useNewAddress ? (
          <div>
            <p className="text-gray-700 mb-2">Select a saved address:</p>
            {addresses.map((addr, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <input
                  type="radio"
                  name="address"
                  value={addr._id}
                  onChange={() => setSelectedAddress(addr)}
                  checked={selectedAddress?._id === addr._id}
                />
                <p className="text-gray-600">{`${addr.firstName} ${addr.lastName}, ${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}, ${addr.zipcode}`}</p>
                <button type="button" onClick={() => editAddress(addr)} className="text-blue-500 ml-2">Edit</button>
                <button type="button" onClick={() => deleteAddress(addr._id)} className="text-red-500 ml-2">Delete</button>
              </div>
            ))}
            <button type="button" onClick={() => setUseNewAddress(true)} className="mt-2 text-green-500">Use New Address</button>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-2">{addresses.length === 0 ? "Please add a new address for your order:" : "Add New Address"}</p>
            <div className='flex gap-3'>
              <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='First name' />
              <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Last name' />
            </div>
            <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full mt-3' type="email" placeholder='Email address' />
            <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full mt-3' type="text" placeholder='Street' />
            <div className='flex gap-3 mt-3'>
              <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City' />
              <input required onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State' />
            </div>
            <div className='flex gap-3 mt-3'>
              <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Zipcode' />
              <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Country' />
            </div>
            <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full mt-3' type="number" placeholder='Phone' />
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              <label className="text-gray-700">Save this address for future use</label>
            </div>
          </div>
        )}
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
              <img className='h-5 mx-4' src={assets.razorpay_logo} alt="Razorpay" />
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