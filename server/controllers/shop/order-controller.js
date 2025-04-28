const razorpay = require('../../helpers/razorpay');
const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const crypto = require('crypto');

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    if (paymentMethod === 'razorpay') {
      console.log('Creating Razorpay order with amount:', totalAmount * 100);
      if (!totalAmount || totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid total amount',
        });
      }
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });
      console.log('Razorpay order created:', razorpayOrder);

      const newlyCreatedOrder = new Order({
        userId,
        cartId,
        cartItems,
        addressInfo,
        orderStatus: 'pending',
        paymentMethod,
        paymentStatus: 'pending',
        totalAmount,
        orderDate,
        orderUpdateDate,
        razorpayOrderId: razorpayOrder.id,
      });

      await newlyCreatedOrder.save();

      res.status(201).json({
        success: true,
        orderId: newlyCreatedOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount * 100,
        currency: 'INR',
      });
    } else if (paymentMethod === 'cod') {
      const newlyCreatedOrder = new Order({
        userId,
        cartId,
        cartItems,
        addressInfo,
        orderStatus: 'confirmed',
        paymentMethod,
        paymentStatus: 'pending',
        totalAmount,
        orderDate,
        orderUpdateDate,
      });

      await newlyCreatedOrder.save();
      await Cart.findByIdAndDelete(cartId);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully with COD',
        orderId: newlyCreatedOrder._id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }
  } catch (e) {
    console.error('Razorpay error details:', e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
      error: e.message,
      errorDetails: e,
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpayOrderId = razorpayOrderId;
    order.razorpaySignature = razorpaySignature;

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.title}`,
        });
      }
      product.totalStock -= item.quantity;
      await product.save();
    }

    await Cart.findByIdAndDelete(order.cartId);
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed',
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId });
    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: 'No orders found!',
      });
    }
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found!',
      });
    }
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occurred!',
    });
  }
};

module.exports = {
  createOrder,
  verifyRazorpayPayment,
  getAllOrdersByUser,
  getOrderDetails,
};