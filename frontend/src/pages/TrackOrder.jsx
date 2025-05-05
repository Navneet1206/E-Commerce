import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Package, Truck, Home, CreditCard, Clock, CheckCircle, X, Printer, Upload } from 'lucide-react';

const TrackOrder = () => {
  const { idoforder } = useParams();
  const { backendUrl, token, currency, getDiscountedPrice } = useContext(ShopContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnRequest, setReturnRequest] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [returnImages, setReturnImages] = useState([null, null]);
  const navigate = useNavigate();

  const fetchOrder = async () => {
    try {
      if (!token) {
        toast.error("Please log in to view order details");
        navigate('/login');
        return;
      }
      const response = await axios.get(`${backendUrl}/api/order/${idoforder}`, { headers: { token } });
      if (response.data.success) {
        const fetchedOrder = response.data.order;
        if (fetchedOrder.status === 'Delivered' && new Date(fetchedOrder.deliveryDate) > new Date()) {
          fetchedOrder.deliveryDate = new Date();
        }
        setOrder(fetchedOrder);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnRequest = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/return-refund/order/${idoforder}`, { headers: { token } });
      if (response.data.success) {
        const request = response.data.request;
        if (request.status === 'Refund Initiated' && request.pickupDate && new Date(request.pickupDate) > new Date()) {
          request.pickupDate = new Date();
        }
        setReturnRequest({
          status: request.status,
          reason: request.reason,
          description: request.description || 'No description provided',
          images: request.images || [],
          pickupDate: request.pickupDate || null
        });
      } else {
        setReturnRequest(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching return request");
    }
  };

  const isWithinReturnPeriod = () => {
    if (!order?.deliveryDate) return false;
    const deliveryDate = new Date(order.deliveryDate);
    const currentDate = new Date();
    const diffTime = currentDate - deliveryDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3 && order.status === 'Delivered';
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnReason) {
      toast.error("Please select a reason for return");
      return;
    }
    if (!returnDescription) {
      toast.error("Please provide a description for the return");
      return;
    }
    if (!order?._id) {
      toast.error("Order ID is missing");
      return;
    }
    if (!order?.userId) {
      toast.error("User ID is missing");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('reason', returnReason);
      formData.append('description', returnDescription);
      formData.append('userId', order.userId);

      // Append images
      returnImages.forEach((image, index) => {
        if (image) {
          formData.append('images', image);
        }
      });

      // Debug: Log FormData contents
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const response = await axios.post(`${backendUrl}/api/return-refund/request`, formData, {
        headers: { 
          token, 
          'Content-Type': 'multipart/form-data' 
        }
      });

      if (response.data.success) {
        toast.success("Return/Refund request submitted");
        setShowReturnForm(false);
        setReturnReason('');
        setReturnDescription('');
        setReturnImages([null, null]);
        await fetchReturnRequest();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Return submission error:", error);
      toast.error(error.response?.data?.message || "Error submitting return request");
    }
  };

  const handleImageChange = (index, file) => {
    const updatedImages = [...returnImages];
    updatedImages[index] = file;
    setReturnImages(updatedImages);
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        nav, footer, header, .no-print { display: none !important; }
        .print-container { position: absolute; left: 0; top: 0; width: 100%; background-color: white; padding: 20px; box-shadow: none; }
        .print-hide { display: none !important; }
        .print-content { display: block !important; page-break-inside: avoid; }
        body { color: black; background-color: white; }
        a { text-decoration: none !important; color: black !important; }
        .bg-blue-600, .bg-gray-50, .bg-gray-200 { background-color: white !important; color: black !important; }
        .text-blue-600, .text-gray-500, .text-gray-600 { color: black !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  useEffect(() => {
    fetchOrder();
    fetchReturnRequest();
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
        <button onClick={() => navigate('/orders')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300">
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
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl print-container">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Order Tracking</h1>
          <p className="text-gray-600">Track the status of your order #{order._id}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-blue-600 text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium">{order.status}</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-gray-500 text-sm mb-1">Order Date</p>
                <p className="font-medium">{formatDate(order.date)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Delivery Date</p>
                <p className="font-medium">{formatDate(order.deliveryDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Amount</p>
                <p className="font-medium text-lg text-blue-600">{currency}{order.amount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Delivery Status</h2>
          <div className="relative">
            <div className="hidden md:block absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 z-0">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${currentStatusIndex >= 0 ? (currentStatusIndex / (statusOrder.length - 1)) * 100 : 0}%` }}></div>
            </div>
            <div className="hidden md:flex justify-between relative z-10">
              {statusOrder.map((status, index) => (
                <div key={status} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index <= currentStatusIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} transition duration-300`}>
                    {statusIcons[index]}
                  </div>
                  <p className={`text-sm mt-2 text-center max-w-xs ${index <= currentStatusIndex ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{status}</p>
                </div>
              ))}
            </div>
            <div className="md:hidden space-y-6">
              {statusOrder.map((status, index) => (
                <div key={status} className={`flex items-center ${index <= currentStatusIndex ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${index <= currentStatusIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {statusIcons[index]}
                  </div>
                  <div>
                    <p className={`font-medium ${index <= currentStatusIndex ? 'text-blue-600' : 'text-gray-500'}`}>{status}</p>
                    {index === currentStatusIndex && <p className="text-sm text-blue-500">Current Status</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Package className="mr-2 w-5 h-5 text-blue-600" />
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const discountedPrice = getDiscountedPrice ? getDiscountedPrice(item.price / item.quantity) * item.quantity : item.price;
                  const hasDiscount = discountedPrice < item.price;
                  return (
                    <div key={index} className="flex items-center border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="ml-4 flex-grow">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <div className="flex flex-wrap mt-1 text-sm text-gray-600">
                          <span className="mr-4">Qty: {item.quantity}</span>
                          <span className="mr-4">Size: {item.size}</span>
                        </div>
                        <p className="text-gray-600">
                          {hasDiscount && <span className="line-through text-gray-500">{currency}{item.price}</span>}{' '}
                          {currency}{discountedPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.status === 'Delivered' && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Return / Refund Request</h2>
                {returnRequest ? (
                  <div className="bg-white p-4 rounded-md border border-gray-200 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                          <th className="px-4 py-2 text-left font-medium">Status</th>
                          <th className="px-4 py-2 text-left font-medium">Reason</th>
                          <th className="px-4 py-2 text-left font-medium">Description</th>
                          <th className="px-4 py-2 text-left font-medium">Images</th>
                          {returnRequest.pickupDate && <th className="px-4 py-2 text-left font-medium">Pickup Date</th>}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-700">{returnRequest.status}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-700">{returnRequest.reason}</td>
                          <td className="px-4 py-2 text-gray-700 max-w-xs break-words">{returnRequest.description}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {returnRequest.images.length > 0 ? (
                              <div className="flex gap-2 flex-wrap">
                                {returnRequest.images.map((img, idx) => (
                                  <img key={idx} src={img} alt={`Return Image ${idx + 1}`} className="w-16 h-16 object-cover rounded-md" />
                                ))}
                              </div>
                            ) : 'None'}
                          </td>
                          {returnRequest.pickupDate && (
                            <td className="px-4 py-2 whitespace-nowrap text-gray-700">{formatDate(returnRequest.pickupDate)}</td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : isWithinReturnPeriod() ? (
                  <div>
                    <p className="text-gray-600 mb-4">You can request a return or refund within 3 days of delivery.</p>
                    {!showReturnForm ? (
                      <button
                        onClick={() => setShowReturnForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300"
                      >
                        Request Return/Refund
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Return</label>
                          <select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="">Select Reason</option>
                            <option value="wrong_item">Wrong item received</option>
                            <option value="damaged">Damaged or defective product</option>
                            <option value="size_fit">Size or fit issue</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={returnDescription}
                            onChange={(e) => setReturnDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Enter detailed description for return/refund"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos (Optional, Max 2)</label>
                          <div className="flex gap-4 flex-wrap">
                            {[0, 1].map((index) => (
                              <div key={index} className="flex flex-col items-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageChange(index, e.target.files[0])}
                                  className="mb-2"
                                />
                                {returnImages[index] && (
                                  <img
                                    src={URL.createObjectURL(returnImages[index])}
                                    alt={`Return Image ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-md"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                          <button
                            onClick={handleReturnSubmit}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition duration-300"
                          >
                            Submit Request
                          </button>
                          <button
                            onClick={() => setShowReturnForm(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Return Window Closed</h2>
                    <p className="text-gray-600">This product is no longer eligible for return or refund. Our return policy allows requests within 3 days of delivery only.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
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
                <p className="mt-2"><span className="font-medium">Phone:</span> {order.address.phone}</p>
              </div>
            </div>

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

        <div className="flex flex-wrap justify-center mt-8 gap-4 no-print">
          <button onClick={() => navigate('/orders')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-300">
            Back to Orders
          </button>
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300 flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;