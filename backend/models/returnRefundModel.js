import mongoose from "mongoose";

const returnRefundSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  reason: { type: String, required: true },
  images: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Pickup Scheduled', 'Refund Initiated'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now },
});

const ReturnRefund = mongoose.model('ReturnRefund', returnRefundSchema);
export default ReturnRefund;