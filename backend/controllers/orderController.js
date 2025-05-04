import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import CouponUsage from "../models/couponUsageModel.js";
import Discount from "../models/Discount.js";
import { sendOrderUpdateEmail, sendOrderBookingEmail, sendOrderNotificationToAdmin } from "../config/sendmessage.js";
import PDFDocument from 'pdfkit';
import fetch from 'node-fetch';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Geocode an address using Here Map API
const geocodeAddress = async (address) => {
  const query = `${address.street}, ${address.city}, ${address.state}, ${address.zipcode}, ${address.country}`;
  const url = `https://geocode.search.hereapi.com/v1/geocode?apiKey=${process.env.HERE_API_KEY}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.items && data.items.length > 0) {
    const position = data.items[0].position;
    return { lat: position.lat, lng: position.lng };
  } else {
    throw new Error('Unable to geocode address');
  }
};

// Calculate distance between two coordinates using Here Map API
const calculateDistance = async (coord1, coord2) => {
  const url = `https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=${process.env.HERE_API_KEY}&waypoint0=${coord1.lat},${coord1.lng}&waypoint1=${coord2.lat},${coord2.lng}&mode=fastest;car;traffic:disabled`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.response && data.response.route) {
    return data.response.route[0].summary.distance / 1000; // Distance in km
  } else {
    throw new Error('Unable to calculate distance');
  }
};

// New endpoint to calculate delivery charge
const calculateDeliveryCharge = async (req, res) => {
  try {
    const { address } = req.body;
    const admin = await userModel.findOne({ role: 'admin' });
    if (!admin || !admin.address) {
      return res.status(500).json({ success: false, message: "Admin address not found" });
    }
    const adminAddress = admin.address;
    const adminCoord = await geocodeAddress(adminAddress);
    const userCoord = await geocodeAddress(address);
    const distance = await calculateDistance(adminCoord, userCoord);
    let deliveryCharge = 0;
    if (distance > 150) {
      deliveryCharge = 0.3 * distance;
    } else if (distance > 80) {
      deliveryCharge = 0.5 * distance;
    }
    res.json({ success: true, deliveryCharge });
  } catch (error) {
    console.error("Calculate Delivery Charge Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkStockAvailability = async (items) => {
  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) {
      return { isAvailable: false, message: `Product with ID ${item._id} not found` };
    }
    const sizeData = product.sizes.find(s => s.size === item.size);
    if (!sizeData) {
      return { isAvailable: false, message: `Size ${item.size} not available for ${product.name}` };
    }
    if (sizeData.stock < item.quantity) {
      return {
        isAvailable: false,
        message: `Insufficient stock for ${product.name} size ${item.size}. Available: ${sizeData.stock}, Requested: ${item.quantity}`,
      };
    }
  }
  return { isAvailable: true };
};

const decrementStock = async (items) => {
  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (product) {
      const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
      if (sizeIndex !== -1) {
        product.sizes[sizeIndex].stock -= item.quantity;
        if (product.sizes[sizeIndex].stock < 0) product.sizes[sizeIndex].stock = 0;
        await product.save();
      }
    }
  }
};

const validateCoupon = async (couponCode, userId, cartItems) => {
  const products = await productModel.find({ _id: { $in: cartItems.map(item => item._id) } });
  const coupons = {
    [process.env.COUPON1 || '']: parseFloat(process.env.VALUEOFFINPERCENT1) || 0,
    [process.env.COUPON2 || '']: parseFloat(process.env.VALUEOFFINPERCENT2) || 0,
    [process.env.COUPON3 || '']: parseFloat(process.env.VALUEOFFINPERCENT3) || 0,
    [process.env.COUPON4 || '']: parseFloat(process.env.VALUEOFFINPERCENT4) || 0,
    [process.env.COUPON5 || '']: parseFloat(process.env.VALUEOFFINPERCENT5) || 0,
  };

  if (!couponCode || !coupons[couponCode]) {
    return { valid: false, message: 'Invalid coupon code', discount: 0 };
  }

  const used = await CouponUsage.findOne({ userId, couponCode });
  if (used) {
    return { valid: false, message: 'Coupon already used', discount: 0 };
  }

  const greaterThanPrice = parseFloat(process.env.GREATERTHANPRICE) || 0;
  const eligibleProducts = cartItems.filter(item => {
    const product = products.find(p => p._id.toString() === item._id);
    return product && product.price > greaterThanPrice;
  });

  if (eligibleProducts.length === 0) {
    return { valid: false, message: 'No eligible products for this coupon', discount: 0 };
  }

  const eligibleAmount = eligibleProducts.reduce((sum, item) => {
    const product = products.find(p => p._id.toString() === item._id);
    return sum + (product.price * item.quantity);
  }, 0);

  const discount = (coupons[couponCode] / 100) * eligibleAmount;
  return { valid: true, discountPercent: coupons[couponCode], discount, message: `Coupon applied! ${coupons[couponCode]}% off eligible items.` };
};

const validateCouponEndpoint = async (req, res) => {
  try {
    const { couponCode, userId, items } = req.body;
    if (!couponCode || !userId || !items) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const validation = await validateCoupon(couponCode, userId, items);
    if (validation.valid) {
      res.json({
        success: true,
        message: validation.message,
        discount: validation.discount,
        finalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - validation.discount
      });
    } else {
      res.status(400).json({ success: false, message: validation.message });
    }
  } catch (error) {
    console.error("Validate Coupon Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDiscountedPrice = async (price, userId) => {
  const globalDiscounts = await Discount.find({ type: 'global' });
  const userDiscounts = userId ? await Discount.find({ type: 'user', userId }) : [];
  
  let maxDiscount = 0;
  for (const discount of userDiscounts) {
    if (price >= discount.minPrice && price <= discount.maxPrice) {
      maxDiscount = Math.max(maxDiscount, discount.percentage);
    }
  }
  if (maxDiscount === 0) {
    for (const discount of globalDiscounts) {
      if (price >= discount.minPrice && price <= discount.maxPrice) {
        maxDiscount = Math.max(maxDiscount, discount.percentage);
      }
    }
  }
  
  return maxDiscount > 0 ? price * (1 - maxDiscount / 100) : price;
};

const calculateOrderTotal = async (items, userId) => {
  let total = 0;
  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) throw new Error(`Product ${item._id} not found`);
    const discountedPrice = await getDiscountedPrice(product.price, userId);
    total += discountedPrice * item.quantity;
  }
  return total;
};

const placeOrder = async (req, res) => {
  try {
    const { userId, items, address, couponCode } = req.body;

    if (!userId || !items || !address) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    // Calculate distance and delivery charge
    const admin = await userModel.findOne({ role: 'admin' });
    if (!admin || !admin.address) {
      return res.status(500).json({ success: false, message: "Admin address not found" });
    }
    const adminAddress = admin.address;
    const adminCoord = await geocodeAddress(adminAddress);
    const userCoord = await geocodeAddress(address);
    const distance = await calculateDistance(adminCoord, userCoord);
    let deliveryCharge = 0;
    if (distance > 150) {
      deliveryCharge = 0.3 * distance;
    } else if (distance > 80) {
      deliveryCharge = 0.5 * distance;
    }

    let totalAmount = await calculateOrderTotal(items, userId);
    let discount = 0;
    if (couponCode) {
      const validation = await validateCoupon(couponCode, userId, items);
      if (validation.valid) {
        discount = validation.discount;
        await CouponUsage.create({ userId, couponCode });
      } else {
        return res.status(400).json({ success: false, message: validation.message });
      }
    }

    const finalAmount = totalAmount - discount + deliveryCharge;

    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const orderData = {
      userId,
      items,
      amount: finalAmount,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      deliveryDate,
      status: 'Order Placed',
      couponCode: couponCode || null,
      discount,
      deliveryCharge
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await decrementStock(orderData.items);
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const user = await userModel.findById(userId);
    if (user && user.email) {
      await sendOrderBookingEmail(user.email, newOrder._id, finalAmount);
    }

    const adminUser = await userModel.findOne({ role: 'admin' });
    if (adminUser && adminUser.email) {
      await sendOrderNotificationToAdmin(adminUser.email, newOrder._id, user.email || "Unknown User");
    }

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, items, address, couponCode } = req.body;

    if (!userId || !items || !address) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    // Calculate distance and delivery charge
    const admin = await userModel.findOne({ role: 'admin' });
    if (!admin || !admin.address) {
      return res.status(500).json({ success: false, message: "Admin address not found" });
    }
    const adminAddress = admin.address;
    const adminCoord = await geocodeAddress(adminAddress);
    const userCoord = await geocodeAddress(address);
    const distance = await calculateDistance(adminCoord, userCoord);
    let deliveryCharge = 0;
    if (distance > 150) {
      deliveryCharge = 0.3 * distance;
    } else if (distance > 80) {
      deliveryCharge = 0.5 * distance;
    }

    let totalAmount = await calculateOrderTotal(items, userId);
    let discount = 0;
    if (couponCode) {
      const validation = await validateCoupon(couponCode, userId, items);
      if (validation.valid) {
        discount = validation.discount;
      } else {
        return res.status(400).json({ success: false, message: validation.message });
      }
    }

    const finalAmount = totalAmount - discount + deliveryCharge;

    if (typeof finalAmount !== "number" || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay configuration error" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const orderData = {
      userId,
      items,
      amount: finalAmount,
      address,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
      razorpayOrderId: order.id,
      deliveryDate,
      couponCode: couponCode || null,
      discount,
      deliveryCharge
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    res.json({ success: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID, finalAmount });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, couponCode } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await orderModel.findOneAndUpdate(
      { razorpayOrderId },
      { payment: true, status: 'Order Placed' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (couponCode) {
      await CouponUsage.create({ userId, couponCode });
    }

    await decrementStock(order.items);
    await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

    const user = await userModel.findById(order.userId);
    if (user && user.email) {
      await sendOrderBookingEmail(user.email, order._id, order.amount);
    }

    const admin = await userModel.findOne({ role: 'admin' });
    if (admin && admin.email) {
      await sendOrderNotificationToAdmin(admin.email, order._id, user.email || "Unknown User");
    }

    res.json({ success: true, message: "Payment verified and order placed" });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.error("All Orders Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("User Orders Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Order ID and status are required" });
    }
    const order = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const user = await userModel.findById(order.userId);
    if (user && user.email) {
      await sendOrderUpdateEmail(user.email, order._id, status);
    }
    res.json({ success: true, message: "Order Status Updated" });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.userId !== req.body.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`);
    doc.moveDown();

    doc.text(`Customer: ${order.address.firstName} ${order.address.lastName}`);
    doc.text(`Email: ${order.address.email}`);
    doc.text(`Address: ${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.zipcode}, ${order.address.country}`);
    doc.moveDown();

    doc.fontSize(14).text('Items:', { underline: true });
    doc.moveDown(0.5);
    order.items.forEach((item, index) => {
      doc.fontSize(12).text(`Item ${index + 1}:`);
      doc.text(`  Product Name: ${item.name || 'Unknown Product'}`);
      doc.text(`  Size: ${item.size}`);
      doc.text(`  Quantity: ${item.quantity}`);
      doc.text(`  Price: ${item.price}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Delivery Charge: ${order.deliveryCharge || 0}`);
    doc.text(`Total Amount: ${order.amount}`);

    doc.moveDown();
    doc.text('Thank you for your purchase!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error("Generate Invoice Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: "Payment confirmation is only for COD orders" });
    }
    if (order.payment) {
      return res.status(400).json({ success: false, message: "Payment already confirmed" });
    }
    order.payment = true;
    await order.save();
    res.json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderRazorpay,
  verifyPayment,
  allOrders,
  updateStatus,
  userOrders,
  getOrderById,
  generateInvoice,
  confirmPayment,
  validateCouponEndpoint,
  calculateDeliveryCharge
};