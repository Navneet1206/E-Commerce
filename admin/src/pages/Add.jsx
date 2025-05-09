import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Men');
  const [subCategory, setSubCategory] = useState('');
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [sizeStocks, setSizeStocks] = useState({});
  const [codAvailable, setCodAvailable] = useState(true);
  const [color, setColor] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [returnable, setReturnable] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const subCatResponse = await axios.get(`${backendUrl}api/product/subcategories`);
        if (subCatResponse.data.success) {
          setSubCategories(subCatResponse.data.subCategories);
        }
        const colorsResponse = await axios.get(`${backendUrl}api/product/colors`);
        if (colorsResponse.data.success) {
          setColors(colorsResponse.data.colors);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    };
    fetchSuggestions();
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        return;
      }

      const sizesWithStock = sizes.map((size) => ({
        size,
        stock: Number(sizeStocks[size]) || 0,
      }));

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', bestseller);
      formData.append('sizes', JSON.stringify(sizesWithStock));
      formData.append('codAvailable', codAvailable);
      formData.append('color', color);
      formData.append('weight', weight);
      formData.append('dimensions', JSON.stringify(dimensions));
      formData.append('returnable', returnable);
      formData.append('tags', tagsInput);

      image1 && formData.append('image1', image1);
      image2 && formData.append('image2', image2);
      image3 && formData.append('image3', image3);
      image4 && formData.append('image4', image4);

      const response = await axios.post(`${backendUrl}api/product/add`, formData, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setName('');
        setDescription('');
        setPrice('');
        setCategory('Men');
        setSubCategory('');
        setBestseller(false);
        setSizes([]);
        setSizeStocks({});
        setCodAvailable(true);
        setColor('');
        setWeight('');
        setDimensions({ length: '', width: '', height: '' });
        setReturnable(true);
        setTagsInput('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      if (error.response?.status === 401) {
        toast.error('Invalid or expired token. Please log in again.');
      } else {
        toast.error(error.message);
      }
    }
  };

  // Animation variants for form elements
  const inputVariants = {
    focus: { scale: 1.02, borderColor: '#4F46E5', transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, backgroundColor: '#4338CA', transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  return (
    <motion.form
      onSubmit={onSubmitHandler}
      className="flex flex-col w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Product</h2>

      {/* Image Uploads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[setImage1, setImage2, setImage3, setImage4].map((setImage, index) => (
          <label
            key={index}
            htmlFor={`image${index + 1}`}
            className="flex flex-col items-center cursor-pointer"
          >
            <motion.div
              className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img
                className="w-full h-full object-cover"
                src={
                  !eval(`image${index + 1}`)
                    ? assets.upload_area
                    : URL.createObjectURL(eval(`image${index + 1}`))
                }
                alt={`Upload ${index + 1}`}
              />
            </motion.div>
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id={`image${index + 1}`}
              className="mt-2 text-sm text-gray-600 hidden"
              accept="image/*"
              required={index === 0}
            />
            <span className="mt-1 text-sm text-gray-500">Image {index + 1}</span>
          </label>
        ))}
      </div>

      {/* Product Name */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
        <motion.input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          placeholder="Enter product name"
          required
          whileFocus="focus"
          variants={inputVariants}
        />
      </div>

      {/* Product Description */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
        <motion.textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Write product description"
          rows="4"
          required
          whileFocus="focus"
          variants={inputVariants}
        />
      </div>

      {/* Category, Sub-Category, Color, Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <motion.select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            whileFocus="focus"
            variants={inputVariants}
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </motion.select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
          <motion.input
            list="subCategories"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter or select sub-category"
            required
            whileFocus="focus"
            variants={inputVariants}
          />
          <datalist id="subCategories">
            {subCategories.map((subCat, index) => (
              <option key={index} value={subCat} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <motion.input
            list="colors"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter or select color"
            whileFocus="focus"
            variants={inputVariants}
          />
          <datalist id="colors">
            {colors.map((col, index) => (
              <option key={index} value={col} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <motion.input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type="number"
            placeholder="25"
            min="0"
            step="0.01"
            required
            whileFocus="focus"
            variants={inputVariants}
          />
        </div>
      </div>

      {/* Weight and Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
          <motion.input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Weight in grams"
            min="0"
            step="1"
            whileFocus="focus"
            variants={inputVariants}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (cm)</label>
          <div className="grid grid-cols-3 gap-2">
            <motion.input
              type="number"
              value={dimensions.length}
              onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Length"
              min="0"
              step="0.1"
              whileFocus="focus"
              variants={inputVariants}
            />
            <motion.input
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Width"
              min="0"
              step="0.1"
              whileFocus="focus"
              variants={inputVariants}
            />
            <motion.input
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Height"
              min="0"
              step="0.1"
              whileFocus="focus"
              variants={inputVariants}
            />
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={codAvailable}
            onChange={(e) => setCodAvailable(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">COD Available</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={returnable}
            onChange={(e) => setReturnable(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Returnable/Refundable</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bestseller}
            onChange={() => setBestseller((prev) => !prev)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Add to Bestseller</span>
        </label>
      </div>

      {/* Tags */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <motion.input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter tags (e.g., casual, summer, trendy)"
          whileFocus="focus"
          variants={inputVariants}
        />
      </div>

      {/* Sizes */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
        <div className="flex flex-wrap gap-3">
          {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <motion.div
              key={size}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
                )
              }
              className={`px-4 py-2 rounded-full cursor-pointer border transition-colors ${
                sizes.includes(size)
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {size}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stock for Sizes */}
      {sizes.length > 0 && (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock for Each Size</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sizes.map((size) => (
              <div key={size} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{size}</span>
                <motion.input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Stock"
                  value={sizeStocks[size] || ''}
                  onChange={(e) =>
                    setSizeStocks((prev) => ({ ...prev, [size]: e.target.value }))
                  }
                  whileFocus="focus"
                  variants={inputVariants}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        Add Product
      </motion.button>
    </motion.form>
  );
};

export default Add;