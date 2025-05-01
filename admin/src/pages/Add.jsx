import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [sizeStocks, setSizeStocks] = useState({});

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (!token) {
        toast.error("Authentication token missing. Please log in again.");
        return;
      }

      const sizesWithStock = sizes.map(size => ({
        size,
        stock: Number(sizeStocks[size]) || 0
      }));

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizesWithStock));

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(`${backendUrl}api/product/add`, formData, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        setName('');
        setDescription('');
        setPrice('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setSizes([]);
        setSizeStocks({});
        setBestseller(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      if (error.response?.status === 401) {
        toast.error("Invalid or expired token. Please log in again.");
      } else {
        toast.error(error.message);
      }
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-4 p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-2 gap-6">
        <label htmlFor="image1" className="flex flex-col items-center">
          <img className="w-24 h-24 object-cover rounded-md border border-gray-300" src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="Upload 1" />
          <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" className="mt-2" required />
        </label>
        <label htmlFor="image2" className="flex flex-col items-center">
          <img className="w-24 h-24 object-cover rounded-md border border-gray-300" src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="Upload 2" />
          <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" className="mt-2" />
        </label>
        <label htmlFor="image3" className="flex flex-col items-center">
          <img className="w-24 h-24 object-cover rounded-md border border-gray-300" src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="Upload 3" />
          <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" className="mt-2" />
        </label>
        <label htmlFor="image4" className="flex flex-col items-center">
          <img className="w-24 h-24 object-cover rounded-md border border-gray-300" src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="Upload 4" />
          <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" className="mt-2" />
        </label>
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Type here"
          required
        />
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write description here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Product Category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
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
            onChange={(e) => setSubCategory(e.target.value)}
            value={subCategory}
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
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            placeholder="25"
            min="0"
            required
          />
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Sizes</p>
        <div className="flex gap-3">
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div
              key={size}
              onClick={() => setSizes((prev) => (prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]))}
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
          onChange={() => setBestseller((prev) => !prev)}
          checked={bestseller}
          type="checkbox"
          id="bestseller"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="bestseller" className="text-gray-700 cursor-pointer">Add to Bestseller</label>
      </div>

      <button type="submit" className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        ADD PRODUCT
      </button>
    </form>
  );
};

export default Add;