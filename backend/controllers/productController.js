import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import fs from 'fs/promises';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

    if (!name || !description || !price || !category || !subCategory || !sizes) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const imageUploads = [
      req.files.image1 ? req.files.image1[0] : null,
      req.files.image2 ? req.files.image2[0] : null,
      req.files.image3 ? req.files.image3[0] : null,
      req.files.image4 ? req.files.image4[0] : null,
    ].filter(file => file !== null);

    if (imageUploads.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    const images = [];
    for (const file of imageUploads) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce_products',
        });
        images.push(result.secure_url);
        await fs.unlink(file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
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
      images,
      date: Date.now(),
    };

    const product = await productModel.create(productData);
    res.status(201).json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    console.error("Add product error:", error);
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

const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.error("List products error:", error);
    res.json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.error("Remove product error:", error);
    res.json({ success: false, message: error.message });
  }
};

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

const updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, category, subCategory, sizes, bestseller, existingImages } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (subCategory) product.subCategory = subCategory;
    if (sizes) product.sizes = JSON.parse(sizes);
    if (bestseller !== undefined) product.bestseller = bestseller === "true" || bestseller === true;

    // Handle images
    const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
    const imageUploads = [
      req.files.image1 ? req.files.image1[0] : null,
      req.files.image2 ? req.files.image2[0] : null,
      req.files.image3 ? req.files.image3[0] : null,
      req.files.image4 ? req.files.image4[0] : null,
    ].filter(file => file !== null);

    const newImages = [];
    if (imageUploads.length > 0) {
      for (const file of imageUploads) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'ecommerce_products',
          });
          newImages.push(result.secure_url);
          await fs.unlink(file.path);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          for (const f of imageUploads) {
            try {
              await fs.unlink(f.path);
            } catch (e) {}
          }
          return res.status(500).json({ success: false, message: "Failed to upload images to Cloudinary" });
        }
      }
    }

    // Combine existing images with new ones
    product.images = [...parsedExistingImages, ...newImages];
    if (product.images.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    await product.save();
    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    console.error("Update product error:", error);
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

export { listProducts, addProduct, removeProduct, singleProduct, updateProduct }; 