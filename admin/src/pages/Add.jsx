import React, { useState, useEffect } from 'react';
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
  const [subCategory, setSubCategory] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [sizeStocks, setSizeStocks] = useState({});
  const [codAvailable, setCodAvailable] = useState(true);
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  const [returnable, setReturnable] = useState(true);
  const [tagsInput, setTagsInput] = useState("");
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
      formData.append("codAvailable", codAvailable);
      formData.append("color", color);
      formData.append("weight", weight);
      formData.append("dimensions", JSON.stringify(dimensions));
      formData.append("returnable", returnable);
      formData.append("tags", tagsInput);

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
        setCategory("Men");
        setSubCategory("");
        setBestseller(false);
        setSizes([]);
        setSizeStocks({});
        setCodAvailable(true);
        setColor("");
        setWeight("");
        setDimensions({ length: "", width: "", height: "" });
        setReturnable(true);
        setTagsInput("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
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
        {[setImage1, setImage2, setImage3, setImage4].map((setImage, index) => (
          <label key={index} htmlFor={`image${index + 1}`} className="flex flex-col items-center">
            <img
              className="w-24 h-24 object-cover rounded-md border border-gray-300"
              src={!eval(`image${index + 1}`) ? assets.upload_area : URL.createObjectURL(eval(`image${index + 1}`))}
              alt={`Upload ${index + 1}`}
            />
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id={`image${index + 1}`}
              className="mt-2"
              required={index === 0}
            />
          </label>
        ))}
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Product Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
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
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Write description here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Sub-Category</p>
          <input
            list="subCategories"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Enter or select sub-category"
            required
          />
          <datalist id="subCategories">
            {subCategories.map((subCat, index) => (
              <option key={index} value={subCat} />
            ))}
          </datalist>
        </div>
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Color</p>
          <input
            list="colors"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Enter or select color"
          />
          <datalist id="colors">
            {colors.map((col, index) => (
              <option key={index} value={col} />
            ))}
          </datalist>
        </div>
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            type="number"
            placeholder="25"
            min="0"
            required
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="w-full sm:w-1/4">
          <p className="mb-2 text-gray-700 font-medium">Weight (grams)</p>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Weight in grams"
            min="0"
            step="1"
          />
        </div>
        <div className="w-full sm:w-3/4">
          <p className="mb-2 text-gray-700 font-medium">Dimensions (cm)</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={dimensions.length}
              onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Length"
              min="0"
              step="0.1"
            />
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Width"
              min="0"
              step="0.1"
            />
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Height"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={codAvailable}
            onChange={(e) => setCodAvailable(e.target.checked)}
            id="codAvailable"
          />
          <label htmlFor="codAvailable">COD Available</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={returnable}
            onChange={(e) => setReturnable(e.target.checked)}
            id="returnable"
          />
          <label htmlFor="returnable">Returnable/Refundable</label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Tags (comma-separated)</p>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Enter tags separated by commas"
        />
      </div>

      <div className="w-full">
        <p className="mb-2 text-gray-700 font-medium">Sizes</p>
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