import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

const Edit = ({ token }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Men');
  const [subCategory, setSubCategory] = useState('Topwear');
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [sizeStocks, setSizeStocks] = useState({});
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([null, null, null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.post(`${backendUrl}api/product/single`, { productId }, { headers: { token } });
        if (response.data.success) {
          const prod = response.data.product;
          setProduct(prod);
          setName(prod.name);
          setDescription(prod.description);
          setPrice(prod.price.toString());
          setCategory(prod.category);
          setSubCategory(prod.subCategory);
          setBestseller(prod.bestseller);
          setSizes(prod.sizes.map(s => s.size));
          setSizeStocks(prod.sizes.reduce((acc, s) => ({ ...acc, [s.size]: s.stock.toString() }), {}));
          setExistingImages(prod.images);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, token]);

  const handleImageRemove = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (index, file) => {
    const updatedImages = [...newImages];
    updatedImages[index] = file;
    setNewImages(updatedImages);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const sizesWithStock = sizes.map(size => ({
        size,
        stock: Number(sizeStocks[size]) || 0
      })).filter(s => s.stock >= 0);

      if (!name || !description || !price || sizesWithStock.length === 0) {
        toast.error("Please fill all required fields");
        return;
      }

      if (existingImages.length === 0 && newImages.every(img => !img)) {
        toast.error("At least one image is required");
        return;
      }

      const formData = new FormData();
      formData.append("id", product._id);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizesWithStock));
      formData.append("existingImages", JSON.stringify(existingImages));

      newImages.forEach((image, index) => {
        if (image) formData.append(`image${index + 1}`, image);
      });

      const response = await axios.post(`${backendUrl}api/product/update`, formData, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/list');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.message);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!product) return <div className="text-center py-10">Product not found</div>;

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Edit Product</h2>

      {/* Image Management */}
      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Existing Images</p>
        <div className="flex flex-wrap gap-4">
          {existingImages.map((img, index) => (
            <div key={index} className="relative">
              <img src={img} className="w-24 h-24 object-cover rounded-md" alt={`Existing ${index + 1}`} />
              <button
                type="button"
                onClick={() => handleImageRemove(index)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                X
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 mb-2 text-gray-700 font-medium">Add New Images (will append to existing ones)</p>
        <div className="grid grid-cols-2 gap-6">
          {[0, 1, 2, 3].map(num => (
            <label key={num} htmlFor={`image${num}`} className="flex flex-col items-center">
              <img
                className="w-24 h-24 object-cover rounded-md border border-gray-300"
                src={newImages[num] ? URL.createObjectURL(newImages[num]) : assets.upload_area}
                alt={`Upload ${num + 1}`}
              />
              <input
                onChange={(e) => handleImageChange(num, e.target.files[0])}
                type="file"
                id={`image${num}`}
                className="mt-2 text-sm"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Product Details */}
      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Type here"
          required
        />
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Description</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write description here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Product Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Sub Category</p>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Product Price</p>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            placeholder="25"
            min="0"
            required
          />
        </div>
      </div>

      {/* Sizes and Stock */}
      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Sizes</p>
        <div className="flex gap-3 flex-wrap">
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div
              key={size}
              onClick={() => setSizes((prev) => prev.includes(size) ? prev.filter(item => item !== size) : [...prev, size])}
              className={`px-4 py-2 rounded-md cursor-pointer ${sizes.includes(size) ? "bg-blue-100 border-blue-500" : "bg-gray-200 border-gray-300"} border`}
            >
              {size}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full mt-4">
        <p className="mb-2 text-gray-700 font-medium">Stock for each size</p>
        {sizes.map((size) => (
          <div key={size} className="flex items-center gap-2 mb-2">
            <label>{size}</label>
            <input
              type="number"
              min="0"
              className="w-24 px-2 py-1 border border-gray-300 rounded-md"
              placeholder="Stock"
              value={sizeStocks[size] || ''}
              onChange={(e) => setSizeStocks(prev => ({ ...prev, [size]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          checked={bestseller}
          onChange={() => setBestseller(prev => !prev)}
          type="checkbox"
          id="bestseller"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="bestseller" className="text-gray-700 cursor-pointer">Add to Bestseller</label>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          SAVE CHANGES
        </button>
        <button type="button" onClick={() => navigate('/list')} className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
          CANCEL
        </button>
      </div>
    </form>
  );
};

export default Edit;