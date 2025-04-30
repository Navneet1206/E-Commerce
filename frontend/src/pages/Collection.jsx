import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relevant');

  const toggleCategory = (e) => {
    const value = e.target.value;
    setCategory(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const toggleSubCategory = (e) => {
    const value = e.target.value;
    setSubCategory(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    let productsCopy = products.slice();
    if (showSearch && search) {
      productsCopy = productsCopy.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(item => subCategory.includes(item.subCategory));
    }
    let sortedProducts = [...productsCopy];
    switch (sortType) {
      case 'low-high':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    setFilterProducts(sortedProducts);
  }, [category, subCategory, search, showSearch, products, sortType]);

  return (
    <div className="pt-10 border-t">
      {/* Toggle Button for Filters */}
      <button
        onClick={() => setShowFilter(!showFilter)}
        className="bg-gray-200 hover:bg-gray-300 p-2 mb-4 w-full sm:w-auto rounded-md transition-colors"
      >
        {showFilter ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filter Section */}
      <div
        className={`${
          showFilter ? 'block' : 'hidden'
        } fixed inset-0 z-50 bg-white p-4 sm:relative sm:p-0 sm:z-auto sm:bg-transparent sm:max-w-md`}
      >
        <div className="flex justify-between items-center mb-4 sm:hidden">
          <p className="text-xl font-medium">FILTERS</p>
          <button onClick={() => setShowFilter(false)} className="text-gray-600 hover:text-gray-800">
            Close
          </button>
        </div>

        {/* Category Filter */}
        <div className="border border-gray-300 p-5 py-3 mb-6 rounded-md">
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <label className="flex gap-2">
              <input type="checkbox" onChange={toggleCategory} value="Men" /> Men
            </label>
            <label className="flex gap-2">
              <input type="checkbox" onChange={toggleCategory} value="Women" /> Women
            </label>
            <label className="flex gap-2">
              <input type="checkbox" onChange={toggleCategory} value="Kids" /> Men
            </label>
          </div>
        </div>

        {/* Subcategory Filter */}
        <div className="border border-gray-300 p-5 py-3 mb-6 rounded-md">
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <label className="flex gap-2">
              <input type="checkbox" onChange={toggleSubCategory} value="Topwear" /> Topwear
            </label>
            <label className="flex gap-2">
              <input type="checkbox" onChange={toggleSubCategory} value="Bottomwear" /> Bottomwear
            </label>
            <label className="flex gap-2">
              <input type="checkbox" onChange={toggleSubCategory} value="Winterwear" /> Winterwear
            </label>
          </div>
        </div>

        {/* Hide Filters Button for Larger Screens */}
        <button
          onClick={() => setShowFilter(false)}
          className="hidden sm:block bg-gray-200 hover:bg-gray-300 p-2 w-full text-center rounded-md transition-colors"
        >
          Hide Filters
        </button>
      </div>

      {/* Product Display */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <Title text1={'ALL'} text2={'COLLECTIONS'} />
          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2 rounded-md"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filterProducts.map((item, index) => (
            <ProductItem
              key={index}
              name={item.name}
              id={item._id}
              price={item.price}
              image={item.images}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collection;