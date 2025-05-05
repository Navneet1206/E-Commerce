import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const ManageUsers = ({ token }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [subAdmins, setSubAdmins] = useState([]);

  const fetchSubAdmins = async () => {
    try {
      const response = await axios.get(`${backendUrl}api/user/list-subadmins`, { headers: { token } });
      if (response.data.success) {
        setSubAdmins(response.data.subAdmins);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, [token]);

  const createSubAdmin = async (e) => {
    e.preventDefault();
    // Explicitly define the payload to avoid extra fields
    const payload = { name, email, password, role: role.trim() };
    console.log('Sending payload:', payload);

    try {
      const response = await axios.post(
        `${backendUrl}api/user/create-subadmin`,
        payload,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success('Sub-admin created');
        fetchSubAdmins();
        setName('');
        setEmail('');
        setPassword('');
        setRole('manager');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Manage Sub-Admins</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Create New Sub-Admin</h3>
        <form onSubmit={createSubAdmin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="manager">Inventory Manager</option>
              <option value="logistics">Logistics</option>
            </select>
          </div>
          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create Sub-Admin
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Sub-Admins List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody>
              {subAdmins.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-700">{user.name}</td>
                  <td className="py-2 px-4 text-sm text-gray-700">{user.email}</td>
                  <td className="py-2 px-4 text-sm text-gray-700">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;