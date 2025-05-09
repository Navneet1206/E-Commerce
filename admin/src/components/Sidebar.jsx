import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '../assets/assets';
import { FaBars, FaTimes } from 'react-icons/fa';

const Sidebar = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Sidebar animation variants
  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
    closed: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  // Link animation variants
  const linkVariants = {
    hover: { scale: 1.05, backgroundColor: '#e0e7ff', transition: { duration: 0.2 } },
    active: { backgroundColor: '#4F46E5', color: '#ffffff' },
  };

  // Define navigation items based on role
  const navItems = [
    ...(role === 'admin' || role === 'manager'
      ? [
          { to: '/add', icon: assets.add_icon, label: 'Add Items' },
          { to: '/list', icon: assets.order_icon, label: 'List Items' },
          { to: '/wishlists', icon: assets.order_icon, label: 'Wishlists' },
        ]
      : []),
    ...(role === 'admin' || role === 'logistics'
      ? [
          { to: '/order', icon: assets.order_icon, label: 'Order Items' },
          { to: '/return-refund', icon: assets.order_icon, label: 'Returns/Refunds' },
        ]
      : []),
    ...(role === 'admin'
      ? [
          { to: '/discounts', icon: assets.order_icon, label: 'Discounts' },
          { to: '/manage-users', icon: assets.order_icon, label: 'Manage Users' },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-indigo-600 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.div
          className={`fixed md:sticky top-0 left-0 h-screen bg-gradient-to-b from-indigo-50 to-white border-r-2 shadow-lg z-40 md:w-[18%] w-64 md:flex flex-col pt-16 md:pt-6 transition-all duration-300 ${
            isOpen ? 'block' : 'hidden md:block'
          }`}
          initial="closed"
          animate={isOpen || window.innerWidth >= 768 ? 'open' : 'closed'}
          variants={sidebarVariants}
          role="navigation"
          aria-label="Admin Sidebar"
        >
          <div className="flex flex-col gap-2 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-l-lg border border-gray-200 border-r-0 text-gray-800 hover:text-indigo-600 transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-100'
                  }`
                }
                onClick={() => setIsOpen(false)} // Close sidebar on mobile after clicking
              >
                <motion.div variants={linkVariants} whileHover="hover">
                  <img src={item.icon} alt="" className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;