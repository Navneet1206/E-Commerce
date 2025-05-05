import React, { useEffect, useState } from 'react';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Login from './components/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Wishlist from './pages/Wishlist';
import Edit from './pages/Edit';
import Discount from './pages/Discount';
import ReturnRefund from './pages/ReturnRefund';
import ManageUsers from './pages/ManageUsers';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
console.log("Backend URL:", backendUrl);
export const currency = '₹';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || ''); 
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  useEffect(() => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  }, [token, role]);

  const ProtectedRoute = ({ element, allowedRoles }) => {
    if (!allowedRoles.includes(role)) {
      return <div className="text-center py-10">Access Denied</div>;
    }
    return element;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer/>
      {token === '' ? (
        <Login setToken={setToken} setRole={setRole} />
      ) : (
        <>
          <NavBar setToken={setToken} setRole={setRole} />
          <hr />
          <div className="flex w-full">
            <Sidebar role={role} />
            <div className="flex-1 mx-8 my-8 text-gray-700 text-base">
              <Routes>
                <Route path="/add" element={<ProtectedRoute element={<Add token={token}/>} allowedRoles={['admin', 'manager']} />} />
                <Route path="/list" element={<ProtectedRoute element={<List token={token}/>} allowedRoles={['admin', 'manager']} />} />
                <Route path="/order" element={<ProtectedRoute element={<Orders token={token}/>} allowedRoles={['admin', 'logistics']} />} />
                <Route path="/wishlists" element={<ProtectedRoute element={<Wishlist token={token}/>} allowedRoles={['admin', 'manager']} />} />
                <Route path="/edit/:productId" element={<ProtectedRoute element={<Edit token={token}/>} allowedRoles={['admin', 'manager']} />} />
                <Route path="/discounts" element={<ProtectedRoute element={<Discount token={token}/>} allowedRoles={['admin']} />} />
                <Route path="/return-refund" element={<ProtectedRoute element={<ReturnRefund token={token}/>} allowedRoles={['admin', 'logistics']} />} />
                <Route path="/manage-users" element={<ProtectedRoute element={<ManageUsers token={token}/>} allowedRoles={['admin']} />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;