import express from 'express';
import ReturnRefund from '../models/returnRefundModel.js';
import { adminAndLogisticsAuth } from '../middleware/roleAuth.js'; // Updated to use adminAndLogisticsAuth
import authUser from '../middleware/auth.js';
import userModel from '../models/userModel.js';

const returnRefundRouter = express.Router();

// Get all return/refund requests (Admin and Logistics)
returnRefundRouter.get('/all', adminAndLogisticsAuth, async (req, res) => {
  try {
    const requests = await ReturnRefund.find({}).populate('userId', 'email');
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User: Get return/refund request for a specific order
returnRefundRouter.get('/order/:orderId', authUser, async (req, res) => {
  try {
    const request = await ReturnRefund.findOne({ orderId: req.params.orderId, userId: req.body.userId });
    if (request) {
      res.json({ success: true, request });
    } else {
      res.json({ success: false, message: 'No request found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update return/refund status (Admin and Logistics)
returnRefundRouter.post('/update-status', adminAndLogisticsAuth, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!requestId || !status) return res.status(400).json({ success: false, message: "Request ID and status are required" });

    const request = await ReturnRefund.findByIdAndUpdate(requestId, { status }, { new: true });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete return/refund request (Admin and Logistics)
returnRefundRouter.delete('/:id', adminAndLogisticsAuth, async (req, res) => {
  try {
    const request = await ReturnRefund.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default returnRefundRouter;