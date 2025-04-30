import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      deliveryDate
    };
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

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
  
      // Validate request data
      if (!userId || !items || !amount || !address) {
        console.error("Missing required fields:", { userId, items, amount, address });
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }
  
      // Validate Razorpay credentials
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay credentials missing");
        return res.status(500).json({ success: false, message: "Razorpay configuration error" });
      }
  
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paisa
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
        deliveryDate
      };
  
      const newOrder = new orderModel(orderData);
      await newOrder.save();
  
      res.json({ success: true, orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

const verifyPayment = async (req, res) => {
  try {
    console.log("Verify Payment Request:", req.body); // Debug log
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');
    if (generatedSignature === razorpaySignature) {
      await orderModel.findOneAndUpdate(
        { razorpayOrderId },
        { payment: true, status: 'Order Placed' }
      );
      await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });
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
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Order Status Updated" });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { placeOrder, placeOrderRazorpay, verifyPayment, allOrders, updateStatus, userOrders };
