import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/userModel.js";
import fetch from 'node-fetch';

dotenv.config();

const geocodeAdminLocation = async () => {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    throw new Error("HERE_API_KEY is not defined in .env");
  }

  const defaultAddress = "Jawahar Nagar, Satna, Madhya Pradesh, India, 485001";
  const url = `https://geocode.search.hereapi.com/v1/geocode?apiKey=${apiKey}&q=${encodeURIComponent(defaultAddress)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error(`No geocoding results found for address: ${defaultAddress}`);
    }

    const position = data.items[0].position;
    return { latitude: position.lat, longitude: position.lng };
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};

const seedAdmin = async () => {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Defined" : "Undefined");
    console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log("ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD);
    console.log("HERE_API_KEY:", process.env.HERE_API_KEY ? "Defined" : "Undefined");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env");
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    console.log("Hashed Password:", hashedPassword);

    const adminLocation = await geocodeAdminLocation();

    const adminUser = new User({
      name: "Admin User",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      cartData: {},
      address: {
        street: "Jawahar Nagar",
        city: "Satna",
        state: "Madhya Pradesh",
        district: "Satna",
        zipcode: "485001",
        country: "India",
        latitude: adminLocation.latitude,
        longitude: adminLocation.longitude
      }
    });

    await adminUser.save();
    console.log("Admin user created successfully:", adminEmail);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedAdmin();