import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { sendOrderUpdateEmail, sendOrderBookingEmail, sendOrderNotificationToAdmin } from "../config/sendmessage.js";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper function to check stock availability
const checkStockAvailability = async (items) => {
  const productQuantities = items.reduce((acc, item) => {
    acc[item._id] = (acc[item._id] || 0) + item.quantity;
    return acc;
  }, {});

  for (const [productId, requestedQuantity] of Object.entries(productQuantities)) {
    const product = await productModel.findById(productId);
    if (!product) {
      return { isAvailable: false, message: `Product with ID ${productId} not found` };
    }
    if (product.stock < requestedQuantity) {
      return {
        isAvailable: false,
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${requestedQuantity}`,
      };
    }
  }
  return { isAvailable: true };
};

// Helper function to decrement stock
const decrementStock = async (items) => {
  const productQuantities = items.reduce((acc, item) => {
    acc[item._id] = (acc[item._id] || 0) + item.quantity;
    return acc;
  }, {});
  for (const [productId, quantity] of Object.entries(productQuantities)) {
    const product = await productModel.findById(productId);
    if (product) {
      product.stock -= quantity;
      if (product.stock < 0) product.stock = 0;
      await product.save();
    }
  }
};

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // Validate stock availability
    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      deliveryDate,
      status: 'Order Placed'
    };
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Decrement stock for COD orders
    await decrementStock(orderData.items);

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Send confirmation email to user
    const user = await userModel.findById(userId);
    if (user && user.email) {
      console.log(`Sending order confirmation to ${user.email} for order ${newOrder._id}`);
      try {
        await sendOrderBookingEmail(user.email, newOrder._id, amount);
        console.log("Order confirmation email sent successfully to user");
      } catch (emailError) {
        console.error("Error sending order confirmation email to user:", emailError);
      }
    } else {
      console.log(`User or email not found for userId: ${userId}`);
    }

    // Send notification email to admin
    const admin = await userModel.findOne({ role: 'admin' });
    if (admin && admin.email) {
      console.log(`Sending admin notification to ${admin.email} for order ${newOrder._id}`);
      try {
        await sendOrderNotificationToAdmin(admin.email, newOrder._id, user.email || "Unknown User");
        console.log("Admin notification email sent successfully");
      } catch (emailError) {
        console.error("Error sending admin notification email:", emailError);
      }
    } else {
      console.log("Admin not found");
    }

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const placeOrderRazorpay = async (req, res) => {
  try {
    console.log("Razorpay Order Request:", req.body);
    const { userId, items, amount, address } = req.body;

    if (!userId || !items || !amount || !address) {
      console.error("Missing required fields:", { userId, items, amount, address });
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      console.error("Invalid amount:", amount);
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    // Validate stock availability
    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.isAvailable) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials missing");
      return res.status(500).json({ success: false, message: "Razorpay configuration error" });
    }

    console.log("Creating Razorpay order with amount:", amount * 100);
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    console.log("Razorpay Order Created:", order);

    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
      razorpayOrderId: order.id,
      deliveryDate,
    };

    console.log("Saving order to database:", orderData);
    const newOrder = new orderModel(orderData);
    await newOrder.save();
    console.log("Order saved successfully");

    res.json({ success: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Razorpay Order Error:", error.stack || error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    console.log("Verify Payment Request:", req.body);
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');
    if (generatedSignature === razorpaySignature) {
      const order = await orderModel.findOneAndUpdate(
        { razorpayOrderId },
        { payment: true, status: 'Order Placed' },
        { new: true }
      );
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      // Decrement stock after payment verification for Razorpay
      await decrementStock(order.items);
      await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

      // Send confirmation email to user
      const user = await userModel.findById(order.userId);
      if (user && user.email) {
        console.log(`Sending order confirmation to ${user.email} for order ${order._id}`);
        try {
          await sendOrderBookingEmail(user.email, order._id, order.amount);
          console.log("Order confirmation email sent successfully to user");
        } catch (emailError) {
          console.error("Error sending order confirmation email to user:", emailError);
        }
      } else {
        console.log(`User or email not found for userId: ${order.userId}`);
      }

      // Send notification email to admin
      const admin = await userModel.findOne({ role: 'admin' });
      if (admin && admin.email) {
        console.log(`Sending admin notification to ${admin.email} for order ${order._id}`);
        try {
          await sendOrderNotificationToAdmin(admin.email, order._id, user.email || "Unknown User");
          console.log("Admin notification email sent successfully");
        } catch (emailError) {
          console.error("Error sending admin notification email:", emailError);
        }
      } else {
        console.log("Admin not found");
      }

      res.json({ success: true, message: "Payment verified and order placed" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
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
      console.log(`Attempting to send order update email to ${user.email} for order ${order._id} with status ${status}`);
      try {
        await sendOrderUpdateEmail(user.email, order._id, status);
        console.log("Order update email sent successfully");
      } catch (emailError) {
        console.error("Error sending order update email:", emailError);
      }
    } else {
      console.log(`User or email not found for orderId: ${orderId}, userId: ${order.userId}`);
    }
    res.json({ success: true, message: "Order Status Updated" });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { placeOrder, placeOrderRazorpay, verifyPayment, allOrders, updateStatus, userOrders };