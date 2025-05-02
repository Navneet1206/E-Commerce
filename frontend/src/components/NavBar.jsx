import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const NavBar = () => {
    const [visible, setVisible] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
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
            setSearchOpen(false);
            setVisible(false);
        }
    };

    const toggleProfileMenu = () => {
        setProfileMenuOpen(!profileMenuOpen);
    };

    const toggleSearch = () => {
        setSearchOpen(!searchOpen);
        if (searchOpen) setSearchQuery('');
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <span className="text-xl sm:text-2xl font-bold text-indigo-800 transition-transform duration-300 hover:scale-105">ShopVibe</span>
                </Link>

                {/* Navigation Links */}
                <ul className="hidden lg:flex items-center gap-8 text-base font-medium text-gray-700">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${isActive ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' : 'hover:text-indigo-600'}`
                            }
                        >
                            HOME
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/collection"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${isActive ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' : 'hover:text-indigo-600'}`
                            }
                        >
                            COLLECTION
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${isActive ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' : 'hover:text-indigo-600'}`
                            }
                        >
                            ABOUT
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/contact"
                            className={({ isActive }) =>
                                `relative transition duration-300 ${isActive ? 'text-indigo-600 font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-indigo-600' : 'hover:text-indigo-600'}`
                            }
                        >
                            CONTACT
                        </NavLink>
                    </li>
                </ul>

                {/* Search and User Actions */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Search Bar */}
                    <div className="flex items-center">
                        <button
                            onClick={searchOpen ? handleSearch : toggleSearch}
                            className="p-1 rounded-full hover:bg-indigo-100 transition-transform duration-300 hover:scale-110"
                            aria-label={searchOpen ? "Search" : "Open search"}
                        >
                            <img src={assets.search_icon} className="w-6 h-6 sm:w-7 sm:h-7" alt="Search" />
                        </button>
                        <form
                            onSubmit={handleSearch}
                            className={`flex items-center overflow-hidden transition-all duration-300 ${
                                searchOpen ? 'w-28 sm:w-32 lg:w-64 opacity-100' : 'w-0 opacity-0'
                            }`}
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full py-1.5 pl-3 pr-8 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={toggleSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                    aria-label="Close search"
                                >
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Profile/Login */}
                    <div className="relative">
                        {token ? (
                            <>
                                <button
                                    onClick={toggleProfileMenu}
                                    className="flex items-center p-1 rounded-full hover:bg-indigo-100 transition-transform duration-300 hover:scale-110"
                                    aria-label="Toggle user menu"
                                >
                                    <img
                                        src={assets.profile_icon}
                                        className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-indigo-200 rounded-full"
                                        alt="Profile"
                                    />
                                </button>
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 animate-fadeIn">
                                        <div className="py-2 text-gray-700 text-sm">
                                        
                                            <Link
                                                to="/orders"
                                                onClick={() => setProfileMenuOpen(false)}
                                                className="block px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                My Orders
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600"
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
                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-transform duration-300 hover:scale-105 text-sm"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Cart */}
                    <Link to="/cart" className="relative">
                        <div className="p-1 rounded-full hover:bg-indigo-100 transition-transform duration-300 hover:scale-110">
                            <img src={assets.cart_icon} className="w-7 h-7 sm:w-8 sm:h-8" alt="Cart" />
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {getCartCount()}
                            </span>
                        </div>
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setVisible(true)}
                        className="lg:hidden p-1 rounded-full hover:bg-indigo-100 transition-transform duration-300 hover:scale-110"
                        aria-label="Toggle menu"
                    >
                        <img src={assets.menu_icon} className="w-7 h-7 sm:w-8 sm:h-8" alt="Menu" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`fixed top-0 right-0 bottom-0 bg-white shadow-lg transition-transform duration-300 z-50 lg:hidden w-72 sm:w-80 ${
                    visible ? 'translate-x-0' : 'translate-x-full'
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
                    <div className="flex flex-col items-center justify-center flex-1 text-lg font-medium text-gray-700">
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors duration-300 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                            }
                        >
                            HOME
                        </NavLink>
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/collection"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors duration-300 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                            }
                        >
                            COLLECTION
                        </NavLink>
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/about"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors duration-300 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                            }
                        >
                            ABOUT
                        </NavLink>
                        <NavLink
                            onClick={() => setVisible(false)}
                            to="/contact"
                            className={({ isActive }) =>
                                `py-4 w-full text-center hover:bg-indigo-50 transition-colors duration-300 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`
                            }
                        >
                            CONTACT
                        </NavLink>
                        {token && (
                            <>
                               
                                <Link
                                    onClick={() => setVisible(false)}
                                    to="/orders"
                                    className="py-4 w-full text-center hover:bg-indigo-50 text-gray-700 transition-colors duration-300"
                                >
                                    My Orders
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setVisible(false);
                                    }}
                                    className="py-4 w-full text-center hover:bg-red-50 text-red-600 transition-colors duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Inline CSS for Custom Animations */}
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
                        animation: fadeIn 0.3s ease-in forwards;
                    }
                `}
            </style>
        </nav>
    );
};

export default NavBar;