import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import fs from 'fs/promises';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes, bestseller, codAvailable, color, weight, dimensions, returnable, tags } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !subCategory || !sizes) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Collect uploaded files
    const imageUploads = [
      req.files?.image1?.[0] || null,
      req.files?.image2?.[0] || null,
      req.files?.image3?.[0] || null,
      req.files?.image4?.[0] || null,
    ].filter(file => file !== null);

    if (imageUploads.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    // Upload images to Cloudinary
    const images = [];
    for (const file of imageUploads) {
      if (!file?.path) {
        console.warn("Skipping invalid file:", file);
        continue;
      }
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce_products',
        });
        images.push(result.secure_url);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Clean up any uploaded files
        for (const f of imageUploads) {
          if (f?.path) {
            try {
              await fs.unlink(f.path);
            } catch (unlinkError) {
              console.warn("Failed to unlink file:", unlinkError.message);
            }
          }
        }
        return res.status(500).json({ success: false, message: "Failed to upload images to Cloudinary" });
      }
    }

    // Clean up temporary files
    for (const file of imageUploads) {
      if (file?.path) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.warn("Failed to unlink file:", unlinkError.message);
        }
      }
    }

    // Parse additional fields
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    let dimensionsObj = {};
    if (dimensions) {
      try {
        dimensionsObj = JSON.parse(dimensions);
        dimensionsObj = {
          length: Number(dimensionsObj.length) || undefined,
          width: Number(dimensionsObj.width) || undefined,
          height: Number(dimensionsObj.height) || undefined,
        };
      } catch (e) {
        console.warn("Error parsing dimensions:", e.message);
      }
    }

    let parsedSizes;
    try {
      parsedSizes = JSON.parse(sizes);
      if (!Array.isArray(parsedSizes)) {
        throw new Error("Sizes must be an array");
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid sizes format" });
    }

    // Prepare product data
    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: parsedSizes,
      bestseller: bestseller === "true" || bestseller === true,
      images,
      date: Date.now(),
      codAvailable: codAvailable === "true" || codAvailable === true,
      color: color || undefined,
      weight: weight ? Number(weight) : undefined,
      dimensions: Object.keys(dimensionsObj).length ? dimensionsObj : undefined,
      returnable: returnable === "true" || returnable === true,
      tags: tagsArray.length ? tagsArray : undefined,
    };

    // Create product
    const product = await productModel.create(productData);
    res.status(201).json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    console.error("Add product error:", error);
    // Clean up any remaining files
    if (req.files) {
      for (const key of ['image1', 'image2', 'image3', 'image4']) {
        if (req.files[key]?.[0]?.path) {
          try {
            await fs.unlink(req.files[key][0].path);
          } catch (unlinkError) {
            console.warn("Failed to unlink file:", unlinkError.message);
          }
        }
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, category, subCategory, sizes, bestseller, existingImages, codAvailable, color, weight, dimensions, returnable, tags } = req.body;

    // Validate product ID
    if (!id) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (subCategory) product.subCategory = subCategory;
    if (sizes) {
      try {
        const parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          throw new Error("Sizes must be an array");
        }
        product.sizes = parsedSizes;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid sizes format" });
      }
    }
    if (bestseller !== undefined) product.bestseller = bestseller === "true" || bestseller === true;
    if (codAvailable !== undefined) product.codAvailable = codAvailable === "true" || codAvailable === true;
    if (color !== undefined) product.color = color || undefined;
    if (weight !== undefined) product.weight = weight ? Number(weight) : undefined;
    if (dimensions) {
      try {
        const dimensionsObj = JSON.parse(dimensions);
        product.dimensions = {
          length: Number(dimensionsObj.length) || undefined,
          width: Number(dimensionsObj.width) || undefined,
          height: Number(dimensionsObj.height) || undefined,
        };
      } catch (e) {
        console.warn("Error parsing dimensions:", e.message);
      }
    }
    if (returnable !== undefined) product.returnable = returnable === "true" || returnable === true;
    if (tags) {
      product.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Handle images
    const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];
    const imageUploads = [
      req.files?.image1?.[0] || null,
      req.files?.image2?.[0] || null,
      req.files?.image3?.[0] || null,
      req.files?.image4?.[0] || null,
    ].filter(file => file !== null);

    const newImages = [];
    for (const file of imageUploads) {
      if (!file?.path) {
        console.warn("Skipping invalid file:", file);
        continue;
      }
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce_products',
        });
        newImages.push(result.secure_url);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Clean up any uploaded files
        for (const f of imageUploads) {
          if (f?.path) {
            try {
              await fs.unlink(f.path);
            } catch (unlinkError) {
              console.warn("Failed to unlink file:", unlinkError.message);
            }
          }
        }
        return res.status(500).json({ success: false, message: "Failed to upload images to Cloudinary" });
      }
    }

    // Clean up temporary files
    for (const file of imageUploads) {
      if (file?.path) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.warn("Failed to unlink file:", unlinkError.message);
        }
      }
    }

    // Update images
    product.images = [...parsedExistingImages, ...newImages];
    if (product.images.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    // Save product
    await product.save();
    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    console.error("Update product error:", error);
    // Clean up any remaining files
    if (req.files) {
      for (const key of ['image1', 'image2', 'image3', 'image4']) {
        if (req.files[key]?.[0]?.path) {
          try {
            await fs.unlink(req.files[key][0].path);
          } catch (unlinkError) {
            console.warn("Failed to unlink file:", unlinkError.message);
          }
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

const getSubCategories = async (req, res) => {
  try {
    const subCategories = await productModel.distinct('subCategory');
    res.json({ success: true, subCategories });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const getColors = async (req, res) => {
  try {
    const colors = await productModel.distinct('color');
    res.json({ success: true, colors });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export { listProducts, addProduct, removeProduct, singleProduct, updateProduct, getSubCategories, getColors };