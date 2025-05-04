import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { send2StepVerificationEmail } from "../config/sendmessage.js";

dotenv.config();

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

// Temporary OTP storage (use Redis in production)
const otpStore = new Map();

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (user) {
      return res.json({ success: false, message: "User already exists" });
    }
    const now = Date.now();
    const storedData = otpStore.get(email);
    if (storedData && now - storedData.lastSent < 30000) {
      return res.json({ success: false, message: "Please wait 30 seconds before requesting another OTP" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = now + 10 * 60 * 1000; // 10 minutes
    await send2StepVerificationEmail(email, otp);
    otpStore.set(email, { otp, expires: otpExpires, lastSent: now });
    res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.json({ success: false, message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    const storedOtpData = otpStore.get(email);
    if (!storedOtpData || storedOtpData.otp !== otp || Date.now() > storedOtpData.expires) {
      return res.json({ success: false, message: "Invalid or expired OTP" });
    }
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });
    const user = await newUser.save();
    const token = createToken(user._id, user.role);
    otpStore.delete(email); // Clean up OTP after successful registration
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error("Register error:", error);
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }
    const token = createToken(user._id, user.role);
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error("User login error:", error);
    res.json({ success: false, message: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }
    if (user.role !== "admin") {
      return res.json({ success: false, message: "Access denied: Admins only" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }
    const token = createToken(user._id, user.role);
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error("Admin login error:", error);
    res.json({ success: false, message: error.message });
  }
};

const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    user.addresses.push(address);
    await user.save();
    res.json({ success: true, message: "Address added" });
  } catch (error) {
    console.error("Add address error:", error);
    res.json({ success: false, message: error.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { addressId, address } = req.body;
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const addrIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);
    if (addrIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }
    user.addresses[addrIndex] = address;
    await user.save();
    res.json({ success: true, message: "Address updated" });
  } catch (error) {
    console.error("Update address error:", error);
    res.json({ success: false, message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    user.addresses = user.addresses.filter((addr) => addr._id.toString() !== addressId);
    await user.save();
    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.json({ success: false, message: error.message });
  }
};

const getAddresses = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.json({ success: false, message: error.message });
  }
};

const sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetPasswordCode = code;
    user.resetPasswordExpires = expires;
    await user.save();
    await send2StepVerificationEmail(email, code);
    res.json({ success: true, message: "Reset code sent" });
  } catch (error) {
    console.error("Send reset code error:", error);
    res.json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.resetPasswordCode !== code || Date.now() > user.resetPasswordExpires) {
      return res.json({ success: false, message: "Invalid or expired code" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.json({ success: false, message: error.message });
  }
};

const mergeCart = async (req, res) => {
  try {
    const { userId, localCart } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const mergedCart = { ...user.cartData };
    for (const itemId in localCart) {
      if (!mergedCart[itemId]) {
        mergedCart[itemId] = {};
      }
      for (const size in localCart[itemId]) {
        mergedCart[itemId][size] = (mergedCart[itemId][size] || 0) + localCart[itemId][size];
      }
    }

    user.cartData = mergedCart;
    await user.save();
    res.json({ success: true, cartData: user.cartData });
  } catch (error) {
    console.error("Merge cart error:", error);
    res.json({ success: false, message: error.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.body.userId; // Set by authUser middleware
    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.wishlist.includes(productId)) return res.json({ success: false, message: "Product already in wishlist" });
    user.wishlist.push(productId);
    await user.save();
    res.json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();
    res.json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId).populate('wishlist');
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getAllWishlists = async (req, res) => {
  try {
    const users = await userModel.find({}).populate('wishlist');
    const wishlists = users.map(user => ({
      userId: user._id,
      userName: user.name,
      wishlist: user.wishlist
    }));
    res.json({ success: true, wishlists });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getWishlistedProducts = async (req, res) => {
  try {
    const result = await userModel.aggregate([
      { $unwind: "$wishlist" },
      { $group: { _id: "$wishlist", count: { $sum: 1 } } },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { 
        productId: "$_id", 
        name: "$product.name", 
        wishlistCount: "$count", 
        sizes: "$product.sizes" 
      } },
      { $sort: { wishlistCount: -1 } }
    ]);
    res.json({ success: true, wishlistedProducts: result });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const addMultipleToWishlist = async (req, res) => {
  try {
    const { productIds } = req.body;
    const user = await userModel.findById(req.body.userId);
    if (!user) return res.json({ success: false, message: "User not found" });
    const newWishlist = [...new Set([...user.wishlist, ...productIds])];
    user.wishlist = newWishlist;
    await user.save();
    res.json({ success: true, message: "Wishlist updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { 
  loginUser, 
  registerUser, 
  adminLogin, 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  getAddresses, 
  sendOtp, 
  sendResetCode, 
  resetPassword, 
  mergeCart, 
  addToWishlist, 
  removeFromWishlist, 
  getWishlist, 
  getAllWishlists,
  getWishlistedProducts,
  addMultipleToWishlist 
};