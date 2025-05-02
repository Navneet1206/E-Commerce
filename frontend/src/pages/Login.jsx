import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Title from '../components/Title';

const Login = () => {
  const { backendUrl, setToken, mergeCart } = useContext(ShopContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgetPassword, setIsForgetPassword] = useState(false);
  const [forgetStep, setForgetStep] = useState(1); // 1: enter email, 2: enter code and new password
  const [forgetEmail, setForgetEmail] = useState('');
  const [forgetCode, setForgetCode] = useState('');
  const [forgetNewPassword, setForgetNewPassword] = useState('');
  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (!backendUrl) {
        throw new Error('Backend URL is not defined');
      }
      new URL(backendUrl);
      const response = await axios.post(`${backendUrl}/api/user/login`, { email, password });
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        await mergeCart(); // Merge local cart with backend cart
        toast.success('Login successful');
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'An error occurred during login');
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${backendUrl}/api/user/forget-password`, { email: forgetEmail });
      if (response.data.success) {
        setForgetStep(2);
        toast.success('Reset code sent to your email');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      toast.error(error.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
        email: forgetEmail,
        code: forgetCode,
        newPassword: forgetNewPassword,
      });
      if (response.data.success) {
        toast.success('Password reset successfully');
        setIsForgetPassword(false);
        setForgetEmail('');
        setForgetCode('');
        setForgetNewPassword('');
        setForgetStep(1);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-2xl mb-6">
          <Title text1={isForgetPassword ? 'FORGET' : 'LOGIN'} text2={isForgetPassword ? 'PASSWORD' : 'NOW'} />
        </div>
        {isForgetPassword ? (
          <div>
            {forgetStep === 1 ? (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={forgetEmail}
                    onChange={(e) => setForgetEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Send Code
                </button>
                <p className="mt-2 text-center text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => setIsForgetPassword(false)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Back to Login
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification Code</label>
                  <input
                    type="text"
                    value={forgetCode}
                    onChange={(e) => setForgetCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter 6-digit code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={forgetNewPassword}
                    onChange={(e) => setForgetNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset Password
                </button>
                <p className="mt-2 text-center text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => setIsForgetPassword(false)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Back to Login
                  </button>
                </p>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmitHandler} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
            <p className="mt-2 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => setIsForgetPassword(true)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Forget Password?
              </button>
            </p>
            <p className="mt-2 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 hover:text-indigo-800">
                Sign up
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;