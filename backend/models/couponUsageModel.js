// backend/models/couponUsageModel.js
import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  couponCode: { type: String, required: true },
  usedAt: { type: Date, default: Date.now }
});

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

export default CouponUsage;