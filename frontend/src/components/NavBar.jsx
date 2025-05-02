import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const NavBar = () => {
    const [visible, setVisible] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const { getCartCount, token, setToken, setCartItems } = useContext(ShopContext);
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
        navigate('/login');
    };

    const toggleProfileMenu = () => {
        setProfileMenuOpen(!profileMenuOpen);
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transition-transform duration-300 hover:scale-105">
                        ShopVibe
                    </span>
                </Link>

                <ul className="hidden lg:flex items-center gap-10 text-base font-medium text-gray-700">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${
                                    isActive 
                                    ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' 
                                    : 'hover:text-indigo-600 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-indigo-200'
                                }`
                            }
                        >
                            HOME
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/collection"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${
                                    isActive 
                                    ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' 
                                    : 'hover:text-indigo-600 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-indigo-200'
                                }`
                            }
                        >
                            COLLECTION
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${
                                    isActive 
                                    ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' 
                                    : 'hover:text-indigo-600 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-indigo-200'
                                }`
                            }
                        >
                            ABOUT
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/contact"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${
                                    isActive 
                                    ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' 
                                    : 'hover:text-indigo-600 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-indigo-200'
                                }`
                            }
                        >
                            CONTACT
                        </NavLink>
                    </li>
                </ul>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        {token ? (
                            <>
                                <button
                                    onClick={toggleProfileMenu}
                                    className="flex items-center p-1 rounded-full hover:bg-indigo-100 transition-all duration-300 hover:scale-110 relative"
                                    aria-label="Toggle user menu"
                                >
                                    <img
                                        src={assets.profile_icon}
                                        className="w-8 h-8 border-2 border-indigo-100 rounded-full shadow-sm"
                                        alt="Profile"
                                    />
                                </button>
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 animate-fadeIn origin-top-right">
                                        <div className="py-2 text-gray-700 text-sm">
                                            <Link
                                                to="/wishlist"
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="block px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            >
                                                My Wishlist
                                            </Link>
                                            <Link
                                                to="/orders"
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="block px-4 py-2.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            >
                                                My Orders
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-indigo-100"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    <Link to="/cart" className="relative">
                        <div className="p-1.5 rounded-full hover:bg-indigo-100 transition-all duration-300 hover:scale-110">
                            <img 
                                src={assets.cart_icon} 
                                className="w-8 h-8" 
                                alt="Cart" 
                            />
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                {getCartCount()}
                            </span>
                        </div>
                    </Link>

                    <button
                        onClick={() => setVisible(true)}
                        className="lg:hidden p-1.5 rounded-full hover:bg-indigo-100 transition-transform duration-300 hover:scale-110"
                        aria-label="Toggle menu"
                    >
                        <img src={assets.menu_icon} className="w-8 h-8" alt="Menu" />
                    </button>
                </div>
            </div>

            <div
                className={`fixed top-0 right-0 bottom-0 bg-white shadow-2xl transition-transform duration-300 z-50 lg:hidden w-80 ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    <button
                        onClick={() => setVisible(false)}
                        className="flex items-center gap-2 p-5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        aria-label="Close menu"
                    >
                        <img src={assets.dropdown_icon} className="h-5 rotate-180" alt="Close" />
                        <span className="font-medium">Close Menu</span>
                    </button>
                    <div className="flex flex-col items-center justify-center flex-1 text-lg font-medium text-gray-700">
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors ${
                                    isActive ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700'
                                }`
                            }
                        >
                            HOME
                        </NavLink>
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/collection"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors ${
                                    isActive ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700'
                                }`
                            }
                        >
                            COLLECTION
                        </NavLink>
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/about"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors ${
                                    isActive ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700'
                                }`
                            }
                        >
                            ABOUT
                        </NavLink>
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/contact"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors ${
                                    isActive ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-gray-700'
                                }`
                            }
                        >
                            CONTACT
                        </NavLink>
                        {token && (
                            <>
                                <Link
                                    onClick={() => setVisible(false)}
                                    to="/wishlist"
                                    className="py-4 w-full text-center hover:bg-indigo-50 text-gray-700 transition-colors"
                                >
                                    My Wishlist
                                </Link>
                                <Link
                                    onClick={() => setVisible(false)}
                                    to="/orders"
                                    className="py-4 w-full text-center hover:bg-indigo-50 text-gray-700 transition-colors"
                                >
                                    My Orders
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setVisible(false);
                                    }}
                                    className="py-4 w-full text-center hover:bg-red-50 text-red-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    }
                `}
            </style>
        </nav>
    );
};

export default NavBar;