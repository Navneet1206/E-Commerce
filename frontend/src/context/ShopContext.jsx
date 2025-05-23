import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
  const currency = "₹";
  const delivery_fee = 0;
  const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
  const backendUrl = rawBackendUrl.endsWith("/") ? rawBackendUrl.slice(0, -1) : rawBackendUrl;
  console.log("Backend URL:", backendUrl);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [localWishlist, setLocalWishlist] = useState(JSON.parse(localStorage.getItem('localWishlist')) || []);
  const [globalDiscounts, setGlobalDiscounts] = useState([]);
  const [userDiscounts, setUserDiscounts] = useState([]);
  const navigate = useNavigate();

  try {
    new URL(backendUrl);
  } catch (error) {
    console.error("Invalid backend URL:", backendUrl);
    toast.error("Invalid backend URL configuration");
  }

  const getProductsData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    if (!token) {
      setGlobalDiscounts([]);
      setUserDiscounts([]);
      return;
    }
    try {
      const response = await axios.get(`${backendUrl}/api/discount/applicable`, { headers: { token } });
      if (response.data.success) {
        setGlobalDiscounts(response.data.globalDiscounts);
        setUserDiscounts(response.data.userDiscounts);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast.error(error.message);
    }
  };

  const getDiscountedPrice = (price) => {
    let maxDiscount = 0;
    for (const discount of userDiscounts) {
      if (price >= discount.minPrice && price <= discount.maxPrice) {
        maxDiscount = Math.max(maxDiscount, discount.percentage);
      }
    }
    if (maxDiscount === 0) {
      for (const discount of globalDiscounts) {
        if (price >= discount.minPrice && price <= discount.maxPrice) {
          maxDiscount = Math.max(maxDiscount, discount.percentage);
        }
      }
    }
    return maxDiscount > 0 ? price * (1 - maxDiscount / 100) : price;
  };

  const getUserCart = async (userToken) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
        {},
        { headers: { token: userToken } }
      );
      if (response.data.success) {
        setCartItems(response.data.message || {});
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error(error.message);
    }
  };

  const getUserWishlist = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/wishlist`, { headers: { token } });
      if (response.data.success) {
        setWishlist(response.data.wishlist.map(product => product._id));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error(error.message);
    }
  };

  const mergeWishlist = async () => {
    if (token && localWishlist.length > 0) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/user/wishlist/add-multiple`,
          { productIds: localWishlist },
          { headers: { token } }
        );
        if (response.data.success) {
          setLocalWishlist([]);
          localStorage.removeItem('localWishlist');
          await getUserWishlist();
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error("Merge wishlist error:", error);
        toast.error(error.message);
      }
    }
  };

  const addToCart = async (itemId, size, quantity) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }
  
    const product = products.find((p) => p._id === itemId);
    if (!product) {
      toast.error("Product not found");
      return;
    }
  
    const sizeStock = product.sizes.find(s => s.size === size)?.stock || 0;
    const currentTotal = Object.values(cartItems[itemId] || {}).reduce((acc, qty) => acc + qty, 0);
    if (currentTotal + quantity > sizeStock) {
      toast.error(`Not enough stock available for size ${size}`);
      return;
    }
  
    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += quantity;
      } else {
        cartData[itemId][size] = quantity;
      }
    } else {
      cartData[itemId] = { [size]: quantity };
    }
    setCartItems(cartData);
  
    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/add`,
          { itemId, size, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          console.error("Error in getCartCount:", error);
        }
      }
    }
    return totalCount;
  };

  const getWishlistCount = () => {
    return token ? wishlist.length : localWishlist.length;
  };

  const updateQuantity = async (itemId, size, quantity) => {
    const product = products.find((p) => p._id === itemId);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    const sizeStock = product.sizes.find(s => s.size === size)?.stock || 0;
    let cartData = structuredClone(cartItems);
    let total = 0;
    for (const s in cartData[itemId] || {}) {
      if (s === size) {
        total += quantity;
      } else {
        total += cartData[itemId][s];
      }
    }
    if (total > sizeStock) {
      toast.error(`Not enough stock available for size ${size}`);
      return;
    }

    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = quantity;
    if (quantity <= 0) {
      delete cartData[itemId][size];
      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
    }
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/update`,
          { itemId, size, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.error("Error updating quantity:", error);
        toast.error(error.message);
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue;
      const discountedPrice = getDiscountedPrice(itemInfo.price);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalAmount += discountedPrice * cartItems[items][item];
          }
        } catch (error) {
          console.error("Error in getCartAmount:", error);
        }
      }
    }
    return totalAmount;
  };

  const mergeCart = async () => {
    if (token && Object.keys(cartItems).length > 0) {
      try {
        for (const itemId in cartItems) {
          const product = products.find((p) => p._id === itemId);
          if (!product) {
            toast.error(`Product with ID ${itemId} not found`);
            return;
          }
          for (const size in cartItems[itemId]) {
            const sizeStock = product.sizes.find(s => s.size === size)?.stock || 0;
            if (cartItems[itemId][size] > sizeStock) {
              toast.error(`Not enough stock for size ${size} of product ${product.name}`);
              return;
            }
          }
        }

        const response = await axios.post(
          `${backendUrl}/api/user/merge-cart`,
          { localCart: cartItems },
          { headers: { token } }
        );
        if (response.data.success) {
          setCartItems(response.data.cartData);
          toast.success("Cart synchronized");
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error("Merge cart error:", error);
        toast.error(error.message);
      }
    }
  };

  const addToWishlist = async (productId) => {
    if (token) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/user/wishlist/add`,
          { productId },
          { headers: { token } }
        );
        if (response.data.success) {
          setWishlist(prev => [...prev, productId]);
          toast.success("Added to wishlist");
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      if (!localWishlist.includes(productId)) {
        const newLocalWishlist = [...localWishlist, productId];
        setLocalWishlist(newLocalWishlist);
        localStorage.setItem('localWishlist', JSON.stringify(newLocalWishlist));
        toast.success("Added to local wishlist");
      } else {
        toast.info("Product already in local wishlist");
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (token) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/user/wishlist/remove`,
          { productId },
          { headers: { token } }
        );
        if (response.data.success) {
          setWishlist(prev => prev.filter(id => id !== productId));
          toast.success("Removed from wishlist");
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    } else {
      const newLocalWishlist = localWishlist.filter(id => id !== productId);
      setLocalWishlist(newLocalWishlist);
      localStorage.setItem('localWishlist', JSON.stringify(newLocalWishlist));
      toast.success("Removed from local wishlist");
    }
  };

  const isInWishlist = (productId) => {
    if (token) {
      return wishlist.includes(productId);
    } else {
      return localWishlist.includes(productId);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('logoutTime');
    setToken('');
    setCartItems({});
    navigate('/login');
  };

  useEffect(() => {
    const checkLogoutTime = () => {
      const logoutTime = localStorage.getItem('logoutTime');
      if (logoutTime && Date.now() > parseInt(logoutTime)) {
        logout();
      }
    };
    checkLogoutTime();
    const interval = setInterval(checkLogoutTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    if (token) {
      getUserCart(token);
      getUserWishlist();
      fetchDiscounts();
      mergeWishlist();
    } else {
      setWishlist([]);
      setGlobalDiscounts([]);
      setUserDiscounts([]);
    }
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
    setProducts,
    isLoading,
    mergeCart,
    wishlist,
    setWishlist,
    localWishlist,
    setLocalWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getUserWishlist,
    mergeWishlist,
    getWishlistCount,
    getDiscountedPrice,
    globalDiscounts,
    userDiscounts,
    logout
  };

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;