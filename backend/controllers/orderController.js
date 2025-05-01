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

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    if (!userId || !items || !amount || !address) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.isAvailable) {
      console.log("Stock check failed:", stockCheck.message);
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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

    await decrementStock(orderData.items);

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

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

    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.isAvailable) {
      console.log("Stock check failed:", stockCheck.message);
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
      await decrementStock(order.items);
      await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

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

export { placeOrder, placeOrderRazorpay, verifyPayment, allOrders, updateStatus, userOrders, getOrderById };