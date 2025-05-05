import express from 'express';
import ReturnRefund from '../models/returnRefundModel.js';
import { adminAndLogisticsAuth } from '../middleware/roleAuth.js';
import authUser from '../middleware/auth.js';
import userModel from '../models/userModel.js';
import { v2 as cloudinary } from 'cloudinary';

const returnRefundRouter = express.Router();

// Get all return/refund requests (Admin)
returnRefundRouter.get('/all', adminAndLogisticsAuth, async (req, res) => {
  try {
    const requests = await ReturnRefund.find({}).populate('userId', 'email');
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get return/refund request for a specific order (User)
returnRefundRouter.get('/order/:orderId', authUser, async (req, res) => {
  try {
    const request = await ReturnRefund.findOne({ orderId: req.params.orderId });
    if (request) {
      res.json({ success: true, request });
    } else {
      res.json({ success: false, message: 'No request found' });
    }
  } catch (error) {
    console.error('Error fetching request for order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit a new return/refund request
returnRefundRouter.post('/request', authUser, async (req, res) => {
  try {
    const { orderId, reason, description, userId } = req.body;
    const files = req.files && req.files.images ? (Array.isArray(req.files.images) ? req.files.images : [req.files.images]) : [];

    // Debug: Log incoming request
    console.log('Received request body:', { orderId, reason, description, userId });
    console.log('Received files:', files);

    // Validate required fields
    if (!orderId || !reason || !description || !userId) {
      return res.status(400).json({ success: false, message: 'Order ID, reason, description, and user ID are required' });
    }

    // Check for existing request
    const existingRequest = await ReturnRefund.findOne({ orderId, userId });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'A return/refund request already exists for this order' });
    }

    // Handle image uploads to Cloudinary
    let imageUrls = [];
    if (files.length > 0) {
      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'return_refund',
          resource_type: 'image'
        });
        imageUrls.push(result.secure_url);
      }
    }

    // Create new return/refund request
    const newRequest = new ReturnRefund({
      orderId,
      userId,
      reason,
      description,
      images: imageUrls,
      status: 'Pending'
    });

    await newRequest.save();
    res.json({ success: true, message: 'Return/Refund request submitted successfully' });
  } catch (error) {
    console.error('Error in return/refund request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update status of a return/refund request (Admin)
returnRefundRouter.post('/update-status', adminAndLogisticsAuth, async (req, res) => {
  try {
    const { requestId, status, pickupDate } = req.body;
    if (!requestId || !status) return res.status(400).json({ success: false, message: "Request ID and status are required" });

    const updateData = { status };
    if (status === 'Refund Initiated') {
      updateData.pickupDate = pickupDate || new Date();
    } else if (pickupDate) {
      updateData.pickupDate = pickupDate;
    }

    const request = await ReturnRefund.findByIdAndUpdate(requestId, updateData, { new: true });
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a return/refund request (Admin)
returnRefundRouter.delete('/:id', adminAndLogisticsAuth, async (req, res) => {
  try {
    const request = await ReturnRefund.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default returnRefundRouter;