import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';

// In-memory storage for recommendation data
let coOccurrence = {};
let purchaseCount = {};
let categoryTopSellers = {};

// Compute recommendation data from orders
const computeRecommendationData = async () => {
  try {
    // Fetch all orders
    const orders = await orderModel.find({});

    // Initialize data structures
    coOccurrence = {};
    purchaseCount = {};

    // Process each order
    for (const order of orders) {
      const productIds = order.items.map(item => item._id.toString());

      // Update purchase counts
      for (const productId of productIds) {
        if (!purchaseCount[productId]) purchaseCount[productId] = 0;
        purchaseCount[productId] += 1;
      }

      // Update co-occurrence matrix
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const p1 = productIds[i];
          const p2 = productIds[j];

          if (!coOccurrence[p1]) coOccurrence[p1] = {};
          if (!coOccurrence[p1][p2]) coOccurrence[p1][p2] = 0;
          coOccurrence[p1][p2] += 1;

          if (!coOccurrence[p2]) coOccurrence[p2] = {};
          if (!coOccurrence[p2][p1]) coOccurrence[p2][p1] = 0;
          coOccurrence[p2][p1] += 1;
        }
      }
    }

    // Compute top sellers per category
    const allProducts = await productModel.find({});
    categoryTopSellers = {};

    for (const product of allProducts) {
      const cat = product.category;
      if (!categoryTopSellers[cat]) categoryTopSellers[cat] = [];
      categoryTopSellers[cat].push({
        productId: product._id.toString(),
        count: purchaseCount[product._id.toString()] || 0
      });
    }

    for (const cat in categoryTopSellers) {
      categoryTopSellers[cat].sort((a, b) => b.count - a.count);
    }

    console.log('Recommendation data computed successfully');
  } catch (error) {
    console.error('Error computing recommendation data:', error);
  }
};

// Generate recommendations for a user
const getRecommendations = async (userId) => {
  try {
    // Get user's purchase history
    const userOrders = await orderModel.find({ userId });
    const purchasedProducts = new Set();

    for (const order of userOrders) {
      for (const item of order.items) {
        purchasedProducts.add(item._id.toString());
      }
    }

    // If no purchases, recommend top-selling products
    if (purchasedProducts.size === 0) {
      const topProducts = Object.entries(purchaseCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([prodId]) => prodId);
      const recommendedProducts = await productModel.find({ _id: { $in: topProducts } });
      return recommendedProducts;
    }

    // Get co-occurring products
    let coOccurRecs = {};
    for (const productId of purchasedProducts) {
      if (coOccurrence[productId]) {
        for (const otherProductId in coOccurrence[productId]) {
          if (!purchasedProducts.has(otherProductId)) {
            if (!coOccurRecs[otherProductId]) coOccurRecs[otherProductId] = 0;
            coOccurRecs[otherProductId] += coOccurrence[productId][otherProductId];
          }
        }
      }
    }

    // Get user categories
    let userCategories = new Set();
    for (const productId of purchasedProducts) {
      const product = await productModel.findById(productId);
      if (product) userCategories.add(product.category);
    }

    // Get top-selling products from user categories
    let topSellerRecs = {};
    for (const cat of userCategories) {
      if (categoryTopSellers[cat]) {
        for (const item of categoryTopSellers[cat].slice(0, 10)) {
          const prodId = item.productId;
          if (!purchasedProducts.has(prodId)) {
            if (!topSellerRecs[prodId]) topSellerRecs[prodId] = 0;
            topSellerRecs[prodId] += item.count;
          }
        }
      }
    }

    // Combine recommendations
    let allRecs = {};
    for (const prodId in coOccurRecs) {
      if (!allRecs[prodId]) allRecs[prodId] = 0;
      allRecs[prodId] += coOccurRecs[prodId];
    }
    for (const prodId in topSellerRecs) {
      if (!allRecs[prodId]) allRecs[prodId] = 0;
      allRecs[prodId] += topSellerRecs[prodId];
    }

    // Sort and select top 10
    const sortedRecs = Object.entries(allRecs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Fetch product details
    const recommendedProducts = await Promise.all(
      sortedRecs.map(async ([prodId]) => {
        const product = await productModel.findById(prodId);
        return product;
      })
    );

    return recommendedProducts.filter(product => product != null);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
};

export { computeRecommendationData, getRecommendations };