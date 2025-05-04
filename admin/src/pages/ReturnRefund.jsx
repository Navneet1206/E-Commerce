import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { Trash2, Eye } from 'lucide-react';

const ReturnRefund = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`${backendUrl}api/return-refund/all`, { headers: { token } });
        if (response.data.success) {
          setRequests(response.data.requests);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error fetching requests");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRequests();
  }, [token]);

  const updateStatus = async (requestId, status) => {
    try {
      const response = await axios.post(
        `${backendUrl}api/return-refund/update-status`,
        { requestId, status },
        { headers: { token } }
      );
      if (response.data.success) {
        setRequests(requests.map(req => req._id === requestId ? { ...req, status } : req));
        toast.success("Status updated successfully");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating status");
    }
  };

  const deleteRequest = async (requestId) => {
    try {
      const response = await axios.delete(`${backendUrl}api/return-refund/${requestId}`, { headers: { token } });
      if (response.data.success) {
        setRequests(requests.filter(req => req._id !== requestId));
        toast.success("Request deleted successfully");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting request");
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Return/Refund Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Order ID</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">User</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Reason</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Images</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 text-sm text-gray-700">{request.orderId}</td>
                <td className="py-2 px-4 text-sm text-gray-700">{request.userId.email}</td>
                <td className="py-2 px-4 text-sm text-gray-700">{request.reason}</td>
                <td className="py-2 px-4 text-sm text-gray-700">
                  {request.images.length > 0 ? (
                    <button
                      onClick={() => setSelectedImages(request.images)}
                      className="text-blue-500 hover:text-blue-700 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </button>
                  ) : 'None'}
                </td>
                <td className="py-2 px-4 text-sm text-gray-700">
                  <select
                    value={request.status}
                    onChange={(e) => updateStatus(request._id, e.target.value)}
                    className="p-1 border border-gray-300 rounded-md"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Pickup Scheduled">Pickup Scheduled</option>
                    <option value="Refund Initiated">Refund Initiated</option>
                  </select>
                </td>
                <td className="py-2 px-4 text-sm">
                  <button
                    onClick={() => deleteRequest(request._id)}
                    className="text-red-500 hover:text-red-700 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedImages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full">
            <h3 className="text-lg font-semibold mb-4">Uploaded Images</h3>
            <div className="flex gap-4">
              {selectedImages.map((img, index) => (
                <a href={img} target="_blank" rel="noopener noreferrer" key={index}>
                  <img
                    src={img}
                    alt={`Return Image ${index + 1}`}
                    className="max-w-full max-h-[80vh] object-contain cursor-pointer rounded-md"
                  />
                </a>
              ))}
            </div>
            <button
              onClick={() => setSelectedImages(null)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRefund;