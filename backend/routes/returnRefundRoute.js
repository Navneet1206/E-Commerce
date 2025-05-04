import express from 'express';
import ReturnRefund from '../models/returnRefundModel.js';
import adminAuth from '../middleware/adminAuth.js';
import userModel from '../models/userModel.js';

const returnRefundRouter = express.Router();

// Get all return/refund requests (Admin only)
returnRefundRouter.get('/all', adminAuth, async (req, res) => {
  try {
    const requests = await ReturnRefund.find({}).populate('userId', 'email');
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update return/refund status (Admin only)
returnRefundRouter.post('/update-status', adminAuth, async (req, res) => {
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

// Delete return/refund request (Admin only)
returnRefundRouter.delete('/:id', adminAuth, async (req, res) => {
  try {
    const request = await ReturnRefund.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default returnRefundRouter;