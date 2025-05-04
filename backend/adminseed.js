import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/userModel.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Defined" : "Undefined");
    console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log("ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD);

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

    const adminUser = new User({
      name: "Admin User",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      cartData: {},
      addresses: [
        {
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          street: "Jawahar Nagar",
          city: "Satna",
          state: "Madhya Pradesh",
          zipcode: "485001",
          country: "India",
          phone: "1234567890",
        },
      ],
      wishlist: [],
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