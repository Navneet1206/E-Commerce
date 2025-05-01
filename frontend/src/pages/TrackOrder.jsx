import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Package, Truck, Home, CreditCard, Clock, CheckCircle, X, Printer } from 'lucide-react';

const TrackOrder = () => {
  const { idoforder } = useParams();
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Function to handle printing with custom styling
  const handlePrint = () => {
    // Add a print-specific stylesheet to the document head
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Hide navigation, footer, and other page elements */
        nav, footer, header, .no-print {
          display: none !important;
        }
        
        /* Make the order details take up the full page */
        .print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background-color: white;
          padding: 20px;
          box-shadow: none;
        }
        
        /* Remove unneeded styling for print */
        .print-hide {
          display: none !important;
        }
        
        /* Ensure all content is visible */
        .print-content {
          display: block !important;
          page-break-inside: avoid;
        }
        
        /* Adjust colors for better printing */
        body {
          color: black;
          background-color: white;
        }
        
        /* Make sure links don't show underlines and URLs */
        a {
          text-decoration: none !important;
          color: black !important;
        }
        
        /* Reset background colors */
        .bg-blue-600, .bg-gray-50, .bg-gray-200 {
          background-color: white !important;
          color: black !important;
        }
        
        /* Ensure text is black for better printing */
        .text-blue-600, .text-gray-500, .text-gray-600 {
          color: black !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Print the page
    window.print();
    
    // Remove the style element after printing
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <X className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">We couldn't find any order with the provided ID.</p>
        <button 
          onClick={() => navigate('/orders')} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300"
        >
          View All Orders
        </button>
      </div>
    </div>
  );

  const statusOrder = ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'];
  const currentStatusIndex = statusOrder.indexOf(order.status);
  
  const statusIcons = [
    <Clock className="w-5 h-5" />,
    <Package className="w-5 h-5" />,
    <Truck className="w-5 h-5" />,
    <Home className="w-5 h-5" />,
    <CheckCircle className="w-5 h-5" />
  ];

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Order Tracking</h1>
          <p className="text-gray-600">Track the status of your order #{order._id}</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-blue-600 text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                {order.status}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">Order Date</p>
                <p className="font-medium">{formatDate(order.date)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Estimated Delivery</p>
                <p className="font-medium">{formatDate(order.deliveryDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Amount</p>
                <p className="font-medium text-lg text-blue-600">{currency}{order.amount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Delivery Status</h2>
          
          <div className="relative">
            {/* Progress Bar */}
            <div className="hidden md:block absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 z-0">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ 
                  width: `${currentStatusIndex >= 0 ? (currentStatusIndex / (statusOrder.length - 1)) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            {/* Status Steps - Desktop */}
            <div className="hidden md:flex justify-between relative z-10">
              {statusOrder.map((status, index) => (
                <div key={status} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStatusIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    } transition duration-300`}
                  >
                    {statusIcons[index]}
                  </div>
                  <p className={`text-sm mt-2 text-center max-w-xs ${
                    index <= currentStatusIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {status}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Status Steps - Mobile */}
            <div className="md:hidden space-y-6">
              {statusOrder.map((status, index) => (
                <div 
                  key={status} 
                  className={`flex items-center ${
                    index <= currentStatusIndex ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      index <= currentStatusIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {statusIcons[index]}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      index <= currentStatusIndex ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {status}
                    </p>
                    {index === currentStatusIndex && (
                      <p className="text-sm text-blue-500">Current Status</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Package className="mr-2 w-5 h-5 text-blue-600" />
                Order Items
              </h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center border-b pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-grow">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <div className="flex flex-wrap mt-1 text-sm text-gray-600">
                        <span className="mr-4">Qty: {item.quantity}</span>
                        <span className="mr-4">Size: {item.size}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">{currency}{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Home className="mr-2 w-5 h-5 text-blue-600" />
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <p className="font-medium">{order.address.firstName} {order.address.lastName}</p>
                <p className="mt-2">{order.address.street}</p>
                <p>{order.address.city}, {order.address.state}, {order.address.zipcode}</p>
                <p>{order.address.country}</p>
                <p className="mt-2">
                  <span className="font-medium">Phone:</span> {order.address.phone}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="mr-2 w-5 h-5 text-blue-600" />
                Payment Details
              </h2>
              <div className="text-gray-700">
                <div className="flex justify-between mb-2">
                  <span>Payment Method:</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`font-medium ${order.payment ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.payment ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center mt-8 gap-4">
          <button 
            onClick={() => navigate('/orders')} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-300"
          >
            Back to Orders
          </button>
          <button 
            onClick={() => handlePrint()} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300 flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Order Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;