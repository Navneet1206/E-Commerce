import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Order Placed');
  const [loading, setLoading] = useState(true);
  const [datePickerOrderId, setDatePickerOrderId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  const orderStatusOptions = [
    'All',
    'Order Placed',
    'Packing',
    'Shipped',
    'Out for delivery',
    'Delivered'
  ];

  const fetchAllOrders = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${backendUrl}api/order/all-orders`,
        { headers: { token } }
      );
      if (response.data.success) {
        setOrders(response.data.orders);
        handleFilterChange('Order Placed');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    if (status === 'All') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === status));
    }
  };

  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value;
    if (newStatus === 'Packing') {
      setDatePickerOrderId(orderId);
      setSelectedDate('');
    } else {
      try {
        const response = await axios.post(
          `${backendUrl}api/order/status`,
          { orderId, status: newStatus },
          { headers: { token } }
        );
        if (response.data.success) {
          toast.success('Order status updated');
          await fetchAllOrders();
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  };

  const confirmPaymentHandler = async (orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}api/order/confirm-payment`,
        { orderId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success('Payment confirmed');
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm payment');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await axios.get(`${backendUrl}api/order/invoice/${orderId}`, {
        headers: { token },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'bg-blue-100 text-blue-800';
      case 'Packing': return 'bg-orange-100 text-orange-800';
      case 'Shipped': return 'bg-indigo-100 text-indigo-800';
      case 'Out for delivery': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Orders Management</h3>
        <div className="w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <div className="flex flex-wrap gap-2">
              {orderStatusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <img className="w-10 h-10" src={assets.parcel_icon} alt="Parcel Icon" />
                  <div>
                    <span className="text-xs text-gray-500">Order ID:</span>
                    <p className="font-medium text-sm">{order._id.substring(0, 10)}...</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    order.payment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {order.payment ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Items</h4>
                  <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-b-0 border-gray-100">
                        <span className="font-medium">{item.name}</span>
                        <div className="text-gray-600">
                          <span>Size: {item.size}</span>
                          <span className="mx-2">·</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer</h4>
                  <div className="text-sm">
                    <p className="font-medium">{order.address.firstName} {order.address.lastName}</p>
                    <p className="text-gray-600 text-xs mt-1">{order.address.phone}</p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">{order.address.street}, {order.address.city}</p>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Details</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items:</span>
                      <span>{order.items.length}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-blue-600">{currency}{order.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Actions</h4>
                  <div className="flex flex-col gap-2">
                    <select
                      onChange={(event) => statusHandler(event, order._id)}
                      value={order.status}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {orderStatusOptions.filter(option => option !== 'All').map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {order.paymentMethod === 'COD' && !order.payment && (
                        <button
                          onClick={() => confirmPaymentHandler(order._id)}
                          className="bg-green-600 text-white px-3 py-2 text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Confirm Payment
                        </button>
                      )}
                      <button
                        onClick={() => downloadInvoice(order._id)}
                        className="bg-blue-600 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-500">No orders found with '{statusFilter}' status</p>
          <button 
            onClick={() => handleFilterChange('All')} 
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            View all orders
          </button>
        </div>
      )}

      {datePickerOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Select Expected Delivery Date</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="border p-2 rounded-md w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDatePickerOrderId(null)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedDate) {
                    toast.error('Please select a date');
                    return;
                  }
                  try {
                    const response = await axios.post(
                      `${backendUrl}api/order/status`,
                      { orderId: datePickerOrderId, status: 'Packing', deliveryDate: selectedDate },
                      { headers: { token } }
                    );
                    if (response.data.success) {
                      toast.success('Order status updated');
                      await fetchAllOrders();
                      setDatePickerOrderId(null);
                    } else {
                      toast.error(response.data.message);
                    }
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to update status');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;