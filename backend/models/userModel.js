import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    cartData: { type: Object, default: {} },
    role: {
      type: String,
      enum: ["user", "admin", "manager", "logistics"],
      default: "user",
    },
    addresses: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipcode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true },
      },
    ],
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }]
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;