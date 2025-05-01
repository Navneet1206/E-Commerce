import express from 'express';
   import { placeOrder, placeOrderRazorpay, verifyPayment, updateStatus, allOrders, userOrders, getOrderById } from '../controllers/orderController.js';
   import adminAuth from '../middleware/adminAuth.js';
   import authUser from '../middleware/auth.js';

   const orderRouter = express.Router();

   // Admin features
   orderRouter.post('/list', adminAuth, allOrders);
   orderRouter.post('/status', adminAuth, updateStatus);

   // Payment features
   orderRouter.post('/place', authUser, placeOrder);
   orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
   orderRouter.post('/verify', authUser, verifyPayment);
   orderRouter.get('/:id', authUser, getOrderById);
   // User features
   orderRouter.post('/userorders', authUser, userOrders);

   export default orderRouter;