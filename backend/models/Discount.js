import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  type: { type: String, enum: ['global', 'user'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // only for 'user' type
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, required: true, min: 0 },
  percentage: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true });

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;