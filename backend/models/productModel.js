import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: [
    {
      size: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 }
    }
  ],
  bestseller: { type: Boolean, default: false },
  date: { type: Number, required: true },
  codAvailable: { type: Boolean, default: true },
  color: { type: String },
  weight: { type: Number }, // in grams
  dimensions: {
    length: { type: Number }, // in cm
    width: { type: Number }, // in cm
    height: { type: Number } // in cm
  },
  returnable: { type: Boolean, default: true },
  tags: { type: [String], default: [] }
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;