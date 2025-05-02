import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { toast } from 'react-toastify';

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, isLoading, token, getProductsData, addToWishlist, removeFromWishlist, isInWishlist } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomActive, setIsZoomActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getProductsData) {
      getProductsData();
    }
  }, [getProductsData]);

  const fetchProductData = () => {
    const product = products.find((item) => item._id === productId);
    if (product) {
      setProductData(product);
      setImage(product.images?.[0] || assets.placeholder_image);
      // Select the first size with stock
      const firstAvailableSize = product.sizes.find((s) => s.stock > 0)?.size;
      setSize(firstAvailableSize || "");
      console.log("Fetched Product Data:", product);
    } else {
      setProductData(null);
      console.log("Product not found for ID:", productId);
    }
  };

  useEffect(() => {
    if (!isLoading && products.length > 0) {
      fetchProductData();
    }
  }, [productId, products, isLoading]);

  const handleMouseEnter = () => setIsZoomActive(true);
  const handleMouseLeave = () => setIsZoomActive(false);

  const handleMouseMove = (e) => {
    if (!isZoomActive) return;
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const selectedSizeStock = size ? (productData?.sizes.find((s) => s.size === size)?.stock || 0) : 0;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 0) {
      setQuantity(0);
    } else if (value > selectedSizeStock) {
      setQuantity(selectedSizeStock);
      toast.error(`Only ${selectedSizeStock} items available for size ${size}`);
    } else {
      setQuantity(value);
    }
    console.log("Quantity changed via input:", value);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!token) {
      toast.error("Please log in to proceed");
      navigate('/login');
      return;
    }
    if (!size) {
      toast.error("Select Product Size");
      return;
    }
    if (quantity <= 0) {
      toast.error("Select a valid quantity");
      return;
    }
    addToCart(productData._id, size, quantity);
    navigate('/place-order');
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!size) {
      toast.error("Select Product Size");
      return;
    }
    if (quantity <= 0) {
      toast.error("Select a valid quantity");
      return;
    }
    addToCart(productData._id, size, quantity);
    toast.success("Added to cart");
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading...</div>;
  }

  if (!productData) {
    return <div className="text-center py-10 text-gray-600">Product not found</div>;
  }

  const discountPercentage = 0.20;
  const originalPrice = productData.price / (1 - discountPercentage);
  const formattedOriginalPrice = `${currency}${originalPrice.toFixed(2)}`;
  const formattedPrice = `${currency}${productData.price.toFixed(2)}`;
  const discountPercent = Math.round(discountPercentage * 100);

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100 bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row gap-12">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto sm:w-[20%] w-full gap-2">
            {productData.images && productData.images.length > 0 ? (
              productData.images.map((item, index) => (
                <img
                  onClick={() => setImage(item)}
                  src={item}
                  key={index}
                  className={`w-24 h-24 object-cover cursor-pointer rounded-md border ${image === item ? "border-blue-500" : "border-gray-300"}`}
                  alt={`Thumbnail ${index + 1}`}
                  onError={() => console.error(`Failed to load image: ${item}`)}
                />
              ))
            ) : (
              <p className="text-gray-600">No images available</p>
            )}
          </div>
          <div className="w-full sm:w-[80%] relative group">
            <div className="relative">
              <img
                src={image || assets.placeholder_image}
                className="w-full h-auto rounded-md border border-gray-300 transition-transform duration-300 group-hover:scale-105 sm:group-hover:scale-100 cursor-pointer"
                alt="Main Product"
                onError={() => setImage(assets.placeholder_image)}
                onClick={() => window.innerWidth < 640 && setShowPopup(true)}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
              <div
                className={`hidden lg:block absolute w-24 h-24 border border-gray-400 pointer-events-none ${isZoomActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 z-10`}
                style={{
                  left: `${zoomPosition.x}%`,
                  top: `${zoomPosition.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              ></div>
              <div
                className="hidden lg:block absolute top-0 left-[calc(100%+16px)] w-96 h-96 bg-white border border-gray-300 shadow-lg pointer-events-none transition-opacity duration-300 z-50"
                style={{
                  backgroundImage: `url(${image || assets.placeholder_image})`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundColor: '#fff',
                  opacity: isZoomActive ? 1 : 0,
                  backgroundRepeat: 'no-repeat'
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative z-20 min-w-[300px]">
          <h1 className="font-medium text-2xl mt-2 text-gray-800">{productData.name}</h1>
          <div className="mt-5 flex items-center gap-2">
            <span className="text-gray-500 line-through text-sm">{formattedOriginalPrice}</span>
            <span className="text-red-600 font-bold text-3xl">{formattedPrice}</span>
            <span className="text-green-600 text-sm font-medium">Save {discountPercent}%</span>
          </div>
          <p className="mt-2 text-gray-600">
            {size
              ? `Available stock for size ${size}: ${selectedSizeStock}`
              : "Please select a size"}
          </p>
          <div className="flex flex-col gap-4 my-8">
            <p className="text-gray-700 font-medium">Select Size</p>
            <div className="flex gap-2 flex-wrap">
              {productData.sizes && Array.isArray(productData.sizes) ? (
                productData.sizes.map((item, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Size clicked:", item.size);
                      setSize(item.size);
                    }}
                    className={`relative py-2 px-4 border rounded-md cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      item.size === size
                        ? "border-blue-500 bg-blue-50"
                        : item.stock > 0
                        ? "border-gray-300 bg-gray-100 hover:bg-gray-200"
                        : "border-gray-300 bg-gray-100 opacity-75"
                    }`}
                    disabled={item.stock === 0}
                  >
                    <span
                      className={`relative z-10 ${
                        item.stock === 0 ? "line-through text-gray-500" : "text-gray-800"
                      }`}
                    >
                      {item.size}
                    </span>
                    {item.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-gray-500 transform rotate-12"></div>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-red-500">No sizes available</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-gray-700 font-medium">Select Quantity</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Decrement clicked, current quantity:", quantity);
                    setQuantity((prev) => Math.max(prev - 1, 0));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 cursor-pointer relative z-30 transition-transform duration-200 hover:scale-110"
                  disabled={quantity <= 0 || selectedSizeStock === 0 || !size}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={selectedSizeStock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 py-2 px-3 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text relative z-30"
                  disabled={selectedSizeStock === 0 || !size}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Increment clicked, current quantity:", quantity, "stock:", selectedSizeStock);
                    setQuantity((prev) => (prev + 1 <= selectedSizeStock ? prev + 1 : prev));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 cursor-pointer relative z-30 transition-transform duration-200 hover:scale-110"
                  disabled={quantity >= selectedSizeStock || selectedSizeStock === 0 || !size}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          {size && selectedSizeStock > 0 ? (
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm hover:bg-blue-700 transition-colors cursor-pointer relative z-30"
                disabled={isLoading || !size}
              >
                ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                className="bg-green-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm hover:bg-green-700 transition-colors cursor-pointer relative z-30"
                disabled={isLoading || !size}
              >
                BUY NOW
              </button>
              {isInWishlist(productData._id) ? (
                <button
                  onClick={() => removeFromWishlist(productData._id)}
                  className="bg-red-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm hover:bg-red-700 transition-colors cursor-pointer relative z-30"
                >
                  Remove from Wishlist
                </button>
              ) : (
                <button
                  onClick={() => addToWishlist(productData._id)}
                  className="bg-yellow-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm hover:bg-yellow-700 transition-colors cursor-pointer relative z-30"
                >
                  Add to Wishlist
                </button>
              )}
            </div>
          ) : (
            <p className="text-red-500 font-bold">
              {size ? "Out of Stock for selected size" : "Please select a size"}
            </p>
          )}
          <hr className="mt-8 sm:w-4/5 border-gray-300" />
          <div className="text-sm text-gray-600 mt-5 flex flex-col gap-1">
            <b className="border px-5 py-3 text-sm text-gray-700 bg-gray-100 rounded-t-md">Description</b>
            <p className="mt-5 text-gray-600">{productData.description}</p>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full overflow-auto">
            <img
              src={image || assets.placeholder_image}
              className="w-auto h-auto max-w-none"
              alt="Popup Product"
            />
            <button
              onClick={() => setShowPopup(false)}
              className="fixed top-2 right-2 bg-black text-white rounded-full p-2 font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  );
};

export default Product;