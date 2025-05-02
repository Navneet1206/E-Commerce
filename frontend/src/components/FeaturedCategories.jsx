import React from 'react'

const FeaturedCategories = () => {
  const categories = [
    { name: 'Men', image: assets.men_category },
    { name: 'Women', image: assets.women_category },
    { name: 'Accessories', image: assets.accessories_category },
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl text-center mb-12 font-medium">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl aspect-[4/5]"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h3 className="text-white text-3xl font-medium">{category.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCategories
