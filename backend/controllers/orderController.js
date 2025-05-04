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
import ReturnRefund from "../models/returnRefundModel.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    const finalAmount = totalAmount - discount;

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
      discount
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await decrementStock(orderData.items);
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const user = await userModel.findById(userId);
    if (user && user.email) {
      await sendOrderBookingEmail(user.email, newOrder._id, finalAmount);
    }

    const admin = await userModel.findOne({ role: 'admin' });
    if (admin && admin.email) {
      await sendOrderNotificationToAdmin(admin.email, newOrder._id, user.email || "Unknown User");
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

    const finalAmount = totalAmount - discount;

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
      discount
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

    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    doc.pipe(res);

    const primaryColor = '#4F6D7A';
    const secondaryColor = '#86B3D1';
    const textColor = '#333333';
    const lightGray = '#EEEEEE';

    doc.fontSize(10).fillColor(textColor).text('Your Company Name', 50, 50, { align: 'left' });
    doc.fontSize(8).text('123 Business Street, City, Country', 50, 65, { align: 'left' });
    doc.text('Email: contact@yourcompany.com', 50, 80, { align: 'left' });
    doc.text('Phone: +1 234 567 890', 50, 95, { align: 'left' });

    doc.fontSize(24).fillColor(primaryColor).text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor(textColor).text(`Invoice #: INV-${orderId.substring(0, 8).toUpperCase()}`, 400, 80, { align: 'right' });
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 400, 95, { align: 'right' });
    doc.text(`Due Date: ${new Date(new Date(order.date).getTime() + 30*24*60*60*1000).toLocaleDateString()}`, 400, 110, { align: 'right' });

    doc.strokeColor(lightGray).lineWidth(1).moveTo(50, 130).lineTo(550, 130).stroke();

    doc.fontSize(12).fillColor(primaryColor).text('Bill To:', 50, 150);
    doc.fontSize(10).fillColor(textColor).text(`${order.address.firstName} ${order.address.lastName}`, 50, 170);
    doc.text(order.address.email, 50, 185);
    doc.text(`${order.address.street}`, 50, 200);
    doc.text(`${order.address.city}, ${order.address.state} ${order.address.zipcode}`, 50, 215);
    doc.text(order.address.country, 50, 230);

    doc.fontSize(12).fillColor(primaryColor).text('Payment Details:', 300, 150);
    doc.fontSize(10).fillColor(textColor).text(`Payment Method: ${order.paymentMethod || 'Credit Card'}`, 300, 170);
    doc.text(`Order ID: ${order._id}`, 300, 185);
    doc.text(`Order Date: ${new Date(order.date).toLocaleDateString()}`, 300, 200);

    const tableTop = 270;
    doc.fontSize(10).fillColor(primaryColor);
    doc.rect(50, tableTop, 500, 20).fill();
    doc.fillColor('#FFFFFF');
    doc.text('Item', 60, tableTop + 5, { width: 190 });
    doc.text('Size', 250, tableTop + 5, { width: 50 });
    doc.text('Qty', 300, tableTop + 5, { width: 50, align: 'center' });
    doc.text('Unit Price', 350, tableTop + 5, { width: 100, align: 'right' });
    doc.text('Amount', 450, tableTop + 5, { width: 90, align: 'right' });

    let y = tableTop + 30;
    let subtotal = 0;
    order.items.forEach((item, index) => {
      const lineHeight = 20;
      const isEvenRow = index % 2 === 0;
      
      if (isEvenRow) {
        doc.rect(50, y - 5, 500, lineHeight).fill(lightGray);
      }
      
      doc.fillColor(textColor);
      doc.fontSize(9);
      doc.text(item.name || 'Unknown Product', 60, y, { width: 190 });
      doc.text(item.size || 'N/A', 250, y, { width: 50 });
      doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'center' });
      
      const unitPrice = parseFloat(item.price) / item.quantity;
      const itemTotal = parseFloat(item.price);
      subtotal += itemTotal;
      
      doc.text(`$${unitPrice.toFixed(2)}`, 350, y, { width: 100, align: 'right' });
      doc.text(`$${itemTotal.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
      
      y += lineHeight;
    });

    const tax = subtotal * 0.1;
    const shipping = order.shipping || 0;
    const total = subtotal + tax + shipping;

    y += 10;
    doc.strokeColor(lightGray).lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    y += 20;

    doc.fontSize(10);
    doc.text('Subtotal:', 400, y, { width: 70, align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
    y += 15;
    
    doc.text('Tax (10%):', 400, y, { width: 70, align: 'right' });
    doc.text(`$${tax.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
    y += 15;
    
    doc.text('Shipping:', 400, y, { width: 70, align: 'right' });
    doc.text(`$${shipping.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
    y += 20;
    
    doc.fontSize(12).fillColor(primaryColor);
    doc.rect(400, y-5, 150, 25).fillAndStroke(primaryColor, primaryColor);
    doc.fillColor('#FFFFFF');
    doc.text('TOTAL:', 400, y, { width: 70, align: 'right' });
    doc.text(`$${total.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

    y += 50;
    doc.fontSize(10).fillColor(primaryColor).text('Notes:', 50, y);
    doc.fontSize(9).fillColor(textColor).text('Payment is due within 30 days. Please include the invoice number with your payment.', 50, y + 15, { width: 400 });

    const footerTop = doc.page.height - 50;
    doc.fontSize(8).fillColor(textColor).text('Thank you for your business!', 50, footerTop, { align: 'center', width: 500 });
    doc.text(`Invoice generated on ${new Date().toLocaleString()}`, 50, footerTop + 15, { align: 'center', width: 500 });
    doc.text(`Page 1`, 50, footerTop + 30, { align: 'center', width: 500 });

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

const requestReturnRefund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.body.userId;

    if (!orderId || !reason) return res.status(400).json({ success: false, message: "Order ID and reason are required" });

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.userId !== userId) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (order.status !== 'Delivered') return res.status(400).json({ success: false, message: "Order must be delivered to request a return" });

    const deliveryDate = new Date(order.deliveryDate);
    const currentDate = new Date();
    const diffTime = currentDate - deliveryDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 3) return res.status(400).json({ success: false, message: "Return period has expired" });

    const existingRequest = await ReturnRefund.findOne({ orderId });
    if (existingRequest) return res.status(400).json({ success: false, message: "Return/Refund request already submitted" });

    const imageUploads = [
      req.files.image1 ? req.files.image1[0] : null,
      req.files.image2 ? req.files.image2[0] : null,
    ].filter(file => file !== null);

    const images = [];
    for (const file of imageUploads) {
      try {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'return_refund_images' });
        images.push(result.secure_url);
        await fs.unlink(file.path);
      } catch (uploadError) {
        for (const f of imageUploads) await fs.unlink(f.path).catch(() => {});
        return res.status(500).json({ success: false, message: "Failed to upload images to Cloudinary" });
      }
    }

    const returnRefundData = {
      orderId,
      userId,
      reason,
      images,
      status: 'Pending'
    };

    const newRequest = new ReturnRefund(returnRefundData);
    await newRequest.save();

    res.json({ success: true, message: "Return/Refund request submitted successfully" });
  } catch (error) {
    if (req.files) {
      for (const key of ['image1', 'image2']) {
        if (req.files[key]) await fs.unlink(req.files[key][0].path).catch(() => {});
      }
    }
    console.error("Request Return/Refund Error:", error);
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
  requestReturnRefund
};