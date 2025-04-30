import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import fs from 'fs/promises'; // Use promises for async file operations

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

// Function for adding a product
const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes, bestseller, stock } = req.body;

    // Validate required fields early
    if (!name || !description || !price || !category || !subCategory || !sizes) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check for image uploads
    const imageUploads = [
      req.files.image1 ? req.files.image1[0] : null,
      req.files.image2 ? req.files.image2[0] : null,
      req.files.image3 ? req.files.image3[0] : null,
      req.files.image4 ? req.files.image4[0] : null,
    ].filter(file => file !== null);

    if (imageUploads.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    // Upload images to Cloudinary
    const images = [];
    for (const file of imageUploads) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce_products',
        });
        images.push(result.secure_url);
        // Delete temporary file
        await fs.unlink(file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Clean up any remaining files
        for (const f of imageUploads) {
          try {
            await fs.unlink(f.path);
          } catch (e) {}
        }
        return res.status(500).json({ success: false, message: "Failed to upload images to Cloudinary" });
      }
    }

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: JSON.parse(sizes),
      bestseller: bestseller === "true" || bestseller === true,
      stock: Number(stock) || 0,
      images,
      date: Date.now(),
    };

    const product = await productModel.create(productData);
    res.status(201).json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    console.error("Add product error:", error);
    // Clean up any remaining files
    if (req.files) {
      for (const key of ['image1', 'image2', 'image3', 'image4']) {
        if (req.files[key]) {
          try {
            await fs.unlink(req.files[key][0].path);
          } catch (e) {}
        }
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function for listing products
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.error("List products error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Function for removing a product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.error("Remove product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.error("Single product error:", error);
    res.json({ success: false, message: error.message });
  }
};

export { listProducts, addProduct, removeProduct, singleProduct };