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
          <div className="w-full sm:w-[80%]">
            <img
              src={image || assets.placeholder_image}
              className="w-full h-auto rounded-md border border-gray-300"
              alt="Main Product"
              onError={() => setImage(assets.placeholder_image)}
            />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2 text-gray-800">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            <img src={assets.star_icon} className="w-4" alt="Star" />
            <img src={assets.star_icon} className="w-4" alt="Star" />
            <img src={assets.star_icon} className="w-4" alt="Star" />
            <img src={assets.star_icon} className="w-4" alt="Star" />
            <img src={assets.star_dull_icon} className="w-4" alt="Dull Star" />
            <p className="pl-2 text-gray-600">122</p>
          </div>
          <p className="mt-5 text-3xl font-medium text-gray-900">
            {currency}
            {productData.price}
          </p>
          <p className="mt-2 text-gray-600">Available stock: {stock}</p>
          <p className="mt-5 text-gray-600">{productData.description}</p>
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
                className="bg-blue-600 text-white px-8 py-3 rounded-md text-sm hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                ADD TO CART
              </button>
              <button
                onClick={handleBuyNow}
                className="bg-green-600 text-white px-8 py-3 rounded-md text-sm hover:bg-green-700 transition-colors"
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
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return & exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <div className="flex">
          <b className="border px-5 py-3 text-sm text-gray-700 bg-gray-100 rounded-t-md">Description</b>
        </div>
        <div className="flex flex-col gap-4 border border-gray-300 px-6 py-6 text-sm text-gray-600 bg-white rounded-b-md">
          <p>{productData.description}</p>
        </div>
      </div>

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  );
};

export default Product;