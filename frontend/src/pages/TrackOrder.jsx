import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const TrackOrder = () => {
  const { idoforder } = useParams();
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrder = async () => {
    try {
      if (!token) {
        toast.error("Please log in to view order details");
        navigate('/login');
        return;
      }
      const response = await axios.get(`${backendUrl}/api/order/${idoforder}`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error(error.response?.data?.message || "Error fetching order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [idoforder, token]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!order) return <div className="text-center py-10">Order not found</div>;

  const statusOrder = ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'];
  const currentStatusIndex = statusOrder.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order Tracking - {order._id}</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Order Summary */}
        <div className="mb-6">
          <p><strong>Order Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
          <p><strong>Estimated Delivery:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
          <p><strong>Current Status:</strong> <span className="text-green-600">{order.status}</span></p>
          <p><strong>Total Amount:</strong> {currency}{order.amount}</p>
        </div>

        {/* Status Timeline */}
        <div className="relative mb-8">
          <div className="flex justify-between items-center">
            {statusOrder.map((status, index) => (
              <div key={status} className="flex flex-col items-center w-1/5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStatusIndex ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <p className="text-sm mt-2 text-center">{status}</p>
                {index < statusOrder.length - 1 && (
                  <div
                    className={`absolute top-3 h-1 w-[20%] left-[${20 * index + 10}%] ${
                      index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center mb-4 border-b pb-4">
              <img
                src={item.images[0]}
                alt={item.name}
                className="w-16 h-16 object-cover mr-4 rounded"
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Size: {item.size}</p>
                <p>{currency}{item.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping Address */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <p>{order.address.firstName} {order.address.lastName}</p>
          <p>{order.address.street}</p>
          <p>{order.address.city}, {order.address.state}, {order.address.zipcode}</p>
          <p>{order.address.country}</p>
          <p>Phone: {order.address.phone}</p>
        </div>

        {/* Payment Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          <p>Payment Method: {order.paymentMethod}</p>
          <p>Payment Status: {order.payment ? 'Paid' : 'Pending'}</p>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;