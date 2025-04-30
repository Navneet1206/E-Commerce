import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("User login attempt:", { email });
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

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
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
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error("Register error:", error);
    res.json({ success: false, message: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin login attempt:", { email });
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

export { loginUser, registerUser, adminLogin, addAddress, updateAddress, deleteAddress, getAddresses };