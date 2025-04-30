import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { toast } from 'react-toastify';

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, isLoading, token } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const fetchProductData = () => {
    const product = products.find((item) => item._id === productId);
    if (product) {
      console.log("Product images:", product.images);
      setProductData(product);
      setImage(product.images?.[0] || assets.placeholder_image);
    } else {
      setProductData(null);
    }
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const handleBuyNow = () => {
    if (!token) {
      toast.error("Please log in to proceed");
      navigate('/login');
      return;
    }
    if (!size) {
      toast.error("Select Product Size");
      return;
    }
    addToCart(productData._id, size);
    navigate('/place-order');
  };

  useEffect(() => {
    if (!isLoading && products.length > 0) {
      fetchProductData();
    }
  }, [productId, products, isLoading]);

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading...</div>;
  }

  if (!productData) {
    return <div className="text-center py-10 text-gray-600">Product not found</div>;
  }

  const stock = productData.stock || 0;
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
            <img
              src={image || assets.placeholder_image}
              className="w-full h-auto rounded-md border border-gray-300 transition-transform duration-300 group-hover:scale-105 sm:group-hover:scale-100"
              alt="Main Product"
              onError={() => setImage(assets.placeholder_image)}
              onClick={() => window.innerWidth < 640 && setShowPopup(true)}
              onMouseMove={handleMouseMove}
            />
            <div
              className="hidden sm:block absolute w-24 h-24 border border-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                left: `${zoomPosition.x}%`,
                top: `${zoomPosition.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            ></div>
            <div
              className="hidden sm:block absolute top-0 left-full ml-4 w-96 h-96 bg-white border border-gray-300 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              style={{
                backgroundImage: `url(${image || assets.placeholder_image})`,
                backgroundSize: "300% 300%",
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2 text-gray-800">{productData.name}</h1>
          <div className="mt-5 flex items-center gap-2">
            <span className="text-gray-500 line-through text-sm">{formattedOriginalPrice}</span>
            <span className="text-red-600 font-bold text-3xl">{formattedPrice}</span>
            <span className="text-green-600 text-sm font-medium">Save {discountPercent}%</span>
          </div>
          <p className="mt-2 text-gray-600">Available stock: {stock}</p>
          <div className="flex flex-col gap-4 my-8">
            <p className="text-gray-700 font-medium">Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  key={index}
                  className={`bg-gray-100 py-2 px-4 border rounded-md ${item === size ? "border-blue-500" : "border-gray-300"} hover:bg-gray-200`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {stock > 0 ? (
            <div className="flex gap-4">
              <button
                onClick={() => addToCart(productData._id, size)}
                className="bg-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                className="bg-green-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm hover:bg-green-700 transition-colors"
                disabled={isLoading}
              >
                BUY NOW
              </button>
            </div>
          ) : (
            <p className="text-red-500 font-bold">Out of Stock</p>
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
              className="fixed top-2 right-2 bg-black text-white rounded-full p-2 font-medium"
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