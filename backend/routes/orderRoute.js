import express from 'express';
import { 
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
} from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
orderRouter.post('/verify', authUser, verifyPayment);
orderRouter.post('/validate-coupon', authUser, validateCouponEndpoint);
orderRouter.get('/all-orders', adminAuth, allOrders);
orderRouter.post('/user-orders', authUser, userOrders);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.get('/:id', authUser, getOrderById);
orderRouter.get('/invoice/:orderId', authUser, generateInvoice);
orderRouter.post('/confirm-payment', authUser, confirmPayment);
orderRouter.post('/calculate-delivery-charge', authUser, calculateDeliveryCharge);

export default orderRouter;