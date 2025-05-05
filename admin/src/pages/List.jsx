import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const List = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        toast.error('Please log in to view products.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${backendUrl}api/product/list`, {
        headers: { token },
        timeout: 5000,
      });

      if (response.data.success) {
        setList(response.data.products || []);
      } else {
        setError(response.data.message || 'Failed to fetch products');
        toast.error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error fetching products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      const response = await axios.post(
        `${backendUrl}api/product/remove`,
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-2xl font-semibold mb-4">All Products List</p>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Log In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <p className="text-2xl font-semibold mb-4">All Products List</p>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="text-2xl font-semibold mb-4">All Products List</p>
      <div className="flex flex-col gap-2">
        {/* List Table Title */}
        <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className="text-center">Action</b>
        </div>

        {/* Product List */}
        {list.length === 0 ? (
          <p className="text-gray-500 text-center">No products found.</p>
        ) : (
          list.map((item, index) => (
            <div
              className="grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm"
              key={item._id || index}
            >
              <img
                className="w-12"
                src={item.images?.[0] || 'default-image-url'}
                alt={item.name || 'Product'}
              />
              <p>{item.name || 'N/A'}</p>
              <p>{item.category || 'N/A'}</p>
              <p>
                {currency}
                {item.price || 'N/A'}
              </p>
              <div className="flex justify-center gap-2">
                <span
                  onClick={() => removeProduct(item._id)}
                  className="cursor-pointer text-red-500 hover:text-red-700"
                >
                  Delete
                </span>
                <span
                  onClick={() => navigate(`/edit/${item._id}`)}
                  className="cursor-pointer text-blue-500 hover:text-blue-700"
                >
                  Edit
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default List;