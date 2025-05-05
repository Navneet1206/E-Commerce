import express from 'express';
import { placeOrder, placeOrderRazorpay, verifyPayment, allOrders, updateStatus, userOrders, getOrderById, generateInvoice, confirmPayment, validateCouponEndpoint, requestReturnRefund } from '../controllers/orderController.js';
import { adminAndLogisticsAuth } from '../middleware/roleAuth.js';
import authUser from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
orderRouter.post('/verify', verifyPayment);
orderRouter.post('/validate-coupon', authUser, validateCouponEndpoint);
orderRouter.get('/all-orders', adminAndLogisticsAuth, allOrders); // Updated to allow admin and logistics
orderRouter.post('/user-orders', authUser, userOrders);
orderRouter.post('/status', adminAndLogisticsAuth, updateStatus); // Updated to allow admin and logistics
orderRouter.get('/:id', authUser, getOrderById);
orderRouter.get('/invoice/:orderId', authUser, generateInvoice);
orderRouter.post('/confirm-payment', authUser, confirmPayment);
orderRouter.post('/return-refund', authUser, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]), requestReturnRefund);

export default orderRouter;