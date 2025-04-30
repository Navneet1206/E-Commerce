import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const NavBar = () => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { getCartCount, token, setToken, setCartItems, products, setShowSearch } = useContext(ShopContext);
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const filteredProducts = products.filter(product =>
                (product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.type && product.type.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setShowSearch(true);
            navigate('/search', { state: { filteredProducts, query: searchQuery } });
            setSearchQuery('');
            setVisible(false); // Close mobile menu if open
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    {/* <img src={assets.logo} className="w-10 h-10 rounded-full" alt="Logo" /> */}
                    <span className="text-xl font-bold text-indigo-800">ShopVibe</span>
                </Link>

                {/* Navigation Links */}
                <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `hover:text-indigo-600 transition duration-300 ${isActive ? 'text-indigo-600 font-semibold' : ''}`
                            }
                        >
                            HOME
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/collection"
                            className={({ isActive }) =>
                                `hover:text-indigo-600 transition duration-300 ${isActive ? 'text-indigo-600 font-semibold' : ''}`
                            }
                        >
                            COLLECTION
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `hover:text-indigo-600 transition duration-300 ${isActive ? 'text-indigo-600 font-semibold' : ''}`
                            }
                        >
                            ABOUT
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/contact"
                            className={({ isActive }) =>
                                `hover:text-indigo-600 transition duration-300 ${isActive ? 'text-indigo-600 font-semibold' : ''}`
                            }
                        >
                            CONTACT
                        </NavLink>
                    </li>
                </ul>

                {/* Search and User Actions */}
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="hidden md:block w-40 lg:w-64 py-2 pl-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="md:hidden w-32 py-2 pl-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <img src={assets.search_icon} className="w-5 h-5 text-gray-500" alt="Search" />
                            </button>
                        </div>
                    </form>

                    {/* Profile/Login */}
                    <div className="relative group">
                        {token ? (
                            <>
                                <img
                                    src={assets.profile_icon}
                                    className="w-8 h-8 rounded-full border-2 border-indigo-600 cursor-pointer"
                                    alt="Profile"
                                    aria-label="User menu"
                                />
                                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl">
                                    <div className="py-2 text-gray-700">
                                        <Link to="/profile" className="block px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600">My Profile</Link>
                                        <Link to="/orders" className="block px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600">Orders</Link>
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition duration-300"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Cart */}
                    <Link to="/cart" className="relative">
                        <img src={assets.cart_icon} className="w-8 h-8" alt="Cart" />
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {getCartCount()}
                        </span>
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setVisible(true)}
                        className="md:hidden focus:outline-none"
                        aria-label="Toggle menu"
                    >
                        <img src={assets.menu_icon} className="w-8 h-8" alt="Menu" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`fixed top-0 right-0 bottom-0 bg-white shadow-lg transition-all duration-300 z-50 ${
                    visible ? 'w-64' : 'w-0'
                }`}
            >
                <div className="flex flex-col h-full">
                    <button
                        onClick={() => setVisible(false)}
                        className="flex items-center gap-2 p-4 bg-indigo-600 text-white"
                        aria-label="Close menu"
                    >
                        <img src={assets.dropdown_icon} className="h-5 rotate-180" alt="Close" />
                        <span>Close</span>
                    </button>
                    <NavLink
                        onClick={() => setVisible(false)}
                        to="/"
                        className={({ isActive }) =>
                            `py-3 px-6 border-b border-gray-200 hover:bg-indigo-50 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                        }
                    >
                        HOME
                    </NavLink>
                    <NavLink
                        onClick={() => setVisible(false)}
                        to="/collection"
                        className={({ isActive }) =>
                            `py-3 px-6 border-b border-gray-200 hover:bg-indigo-50 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                        }
                    >
                        COLLECTION
                    </NavLink>
                    <NavLink
                        onClick={() => setVisible(false)}
                        to="/about"
                        className={({ isActive }) =>
                            `py-3 px-6 border-b border-gray-200 hover:bg-indigo-50 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                        }
                    >
                        ABOUT
                    </NavLink>
                    <NavLink
                        onClick={() => setVisible(false)}
                        to="/contact"
                        className={({ isActive }) =>
                            `py-3 px-6 border-b border-gray-200 hover:bg-indigo-50 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                        }
                    >
                        CONTACT
                    </NavLink>
                    {token && (
                        <>
                            <Link
                                onClick={() => setVisible(false)}
                                to="/profile"
                                className="py-3 px-6 border-b border-gray-200 hover:bg-indigo-50 text-gray-700"
                            >
                                My Profile
                            </Link>
                            <Link
                                onClick={() => setVisible(false)}
                                to="/orders"
                                className="py-3 px-6 border-b border-gray-200 hover:bg-indigo-50 text-gray-700"
                            >
                                Orders
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    setVisible(false);
                                }}
                                className="py-3 px-6 border-b border-gray-200 hover:bg-red-50 text-red-600 text-left"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;