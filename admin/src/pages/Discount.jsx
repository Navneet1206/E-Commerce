import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Discount = ({ token }) => {
  const [globalMinPrice, setGlobalMinPrice] = useState('');
  const [globalMaxPrice, setGlobalMaxPrice] = useState('');
  const [globalPercentage, setGlobalPercentage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userMinPrice, setUserMinPrice] = useState('');
  const [userMaxPrice, setUserMaxPrice] = useState('');
  const [userPercentage, setUserPercentage] = useState('');
  const [discounts, setDiscounts] = useState([]);

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get(`${backendUrl}api/discount`, { headers: { token } });
      if (response.data.success) {
        setDiscounts(response.data.discounts);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [token]);

  const addGlobalDiscount = async (e) => {
    e.preventDefault();
    try {
      const minPriceNum = Number(globalMinPrice);
      const maxPriceNum = Number(globalMaxPrice);
      const percentageNum = Number(globalPercentage);
      if (isNaN(minPriceNum) || isNaN(maxPriceNum) || isNaN(percentageNum)) {
        return toast.error('All fields must be numbers');
      }
      if (minPriceNum < 0 || maxPriceNum < 0 || percentageNum < 0 || percentageNum > 100) {
        return toast.error('Invalid price range or percentage');
      }
      if (minPriceNum >= maxPriceNum) {
        return toast.error('Min price must be less than max price');
      }
      const response = await axios.post(
        `${backendUrl}api/discount/global`,
        { minPrice: minPriceNum, maxPrice: maxPriceNum, percentage: percentageNum },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success('Global discount added');
        fetchDiscounts();
        setGlobalMinPrice('');
        setGlobalMaxPrice('');
        setGlobalPercentage('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addUserDiscount = async (e) => {
    e.preventDefault();
    try {
      const minPriceNum = Number(userMinPrice);
      const maxPriceNum = Number(userMaxPrice);
      const percentageNum = Number(userPercentage);
      if (!userEmail || isNaN(minPriceNum) || isNaN(maxPriceNum) || isNaN(percentageNum)) {
        return toast.error('All fields are required and must be numbers');
      }
      if (minPriceNum < 0 || maxPriceNum < 0 || percentageNum < 0 || percentageNum > 100) {
        return toast.error('Invalid price range or percentage');
      }
      if (minPriceNum >= maxPriceNum) {
        return toast.error('Min price must be less than max price');
      }
      const response = await axios.post(
        `${backendUrl}api/discount/user`,
        { email: userEmail, minPrice: minPriceNum, maxPrice: maxPriceNum, percentage: percentageNum },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success('User-specific discount added');
        fetchDiscounts();
        setUserEmail('');
        setUserMinPrice('');
        setUserMaxPrice('');
        setUserPercentage('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteDiscount = async (id) => {
    try {
      const response = await axios.delete(`${backendUrl}api/discount/${id}`, { headers: { token } });
      if (response.data.success) {
        toast.success('Discount deleted');
        fetchDiscounts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Manage Discounts</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Add Global Discount</h3>
        <form onSubmit={addGlobalDiscount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="number"
              value={globalMinPrice}
              onChange={(e) => setGlobalMinPrice(e.target.value)}
              placeholder="Min Price"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
            <input
              type="number"
              value={globalMaxPrice}
              onChange={(e) => setGlobalMaxPrice(e.target.value)}
              placeholder="Max Price"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
            <input
              type="number"
              value={globalPercentage}
              onChange={(e) => setGlobalPercentage(e.target.value)}
              placeholder="Percentage (%)"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              required
            />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Add Global Discount
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Add User-Specific Discount</h3>
        <form onSubmit={addUserDiscount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="User Email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              value={userMinPrice}
              onChange={(e) => setUserMinPrice(e.target.value)}
              placeholder="Min Price"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
            <input
              type="number"
              value={userMaxPrice}
              onChange={(e) => setUserMaxPrice(e.target.value)}
              placeholder="Max Price"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
            <input
              type="number"
              value={userPercentage}
              onChange={(e) => setUserPercentage(e.target.value)}
              placeholder="Percentage (%)"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              required
            />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Add User Discount
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Discounts List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">User Email</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Min Price</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Max Price</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Percentage</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-700">{discount.type}</td>
                  <td className="py-2 px-4 text-sm text-gray-700">{discount.userId ? discount.userId.email : 'N/A'}</td>
                  <td className="py-2 px-4 text-sm text-gray-700">{discount.minPrice}</td>
                  <td className="py-2 px-4 text-sm text-gray-700">{discount.maxPrice}</td>
                  <td className="py-2 px-4 text-sm text-gray-700">{discount.percentage}%</td>
                  <td className="py-2 px-4 text-sm">
                    <button
                      onClick={() => deleteDiscount(discount._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Discount;