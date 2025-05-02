import React from 'react';

const Testimonial = () => {
  return (
    <div className="py-10 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">"Amazing products and fast delivery!"</p>
            <p className="font-semibold">John Doe</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">"Great customer service and quality items."</p>
            <p className="font-semibold">Jane Smith</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">"I love the variety and the prices!"</p>
            <p className="font-semibold">Alice Johnson</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;