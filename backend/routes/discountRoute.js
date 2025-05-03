import express from 'express';
import Discount from '../models/Discount.js';
import userModel from '../models/userModel.js'; // Use the exact export name from userModel.js
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const discountRouter = express.Router();

// Admin: Create global discount
discountRouter.post('/global', adminAuth, async (req, res) => {
  try {
    console.log('Received global discount request:', req.body);
    const { minPrice, maxPrice, percentage } = req.body;

    // Validation
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(percentage)) {
      console.warn('Invalid input: fields must be numbers');
      return res.status(400).json({ success: false, message: 'All fields must be valid numbers' });
    }
    if (minPrice < 0 || maxPrice < 0 || percentage < 0 || percentage > 100) {
      console.warn('Invalid range or percentage:', { minPrice, maxPrice, percentage });
      return res.status(400).json({ success: false, message: 'Price range and percentage must be between 0 and 100' });
    }
    if (minPrice >= maxPrice) {
      console.warn('Invalid price range: minPrice >= maxPrice');
      return res.status(400).json({ success: false, message: 'Minimum price must be less than maximum price' });
    }

    const discount = new Discount({ type: 'global', minPrice, maxPrice, percentage });
    console.log('Saving global discount:', discount);
    await discount.save();
    console.log('Global discount saved successfully');
    res.status(201).json({ success: true, message: 'Global discount created successfully' });
  } catch (error) {
    console.error('Error creating global discount:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to create global discount: ' + error.message });
  }
});

// Admin: Create user-specific discount
discountRouter.post('/user', adminAuth, async (req, res) => {
  try {
    console.log('Received user discount request:', req.body);
    const { email, minPrice, maxPrice, percentage } = req.body;

    // Validation
    if (!email || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(percentage)) {
      console.warn('Missing or invalid fields:', { email, minPrice, maxPrice, percentage });
      return res.status(400).json({ success: false, message: 'All fields are required and must be valid numbers' });
    }
    if (minPrice < 0 || maxPrice < 0 || percentage < 0 || percentage > 100) {
      console.warn('Invalid range or percentage:', { minPrice, maxPrice, percentage });
      return res.status(400).json({ success: false, message: 'Price range and percentage must be between 0 and 100' });
    }
    if (minPrice >= maxPrice) {
      console.warn('Invalid price range: minPrice >= maxPrice');
      return res.status(400).json({ success: false, message: 'Minimum price must be less than maximum price' });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      console.warn('User not found for email:', email);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const discount = new Discount({ 
      type: 'user', 
      userId: user._id, 
      minPrice, 
      maxPrice, 
      percentage 
    });
    console.log('Saving user-specific discount:', discount);
    await discount.save();
    console.log('User-specific discount saved successfully');
    res.status(201).json({ success: true, message: 'User-specific discount created successfully' });
  } catch (error) {
    console.error('Error creating user-specific discount:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to create user-specific discount: ' + error.message });
  }
});

// Admin: List all discounts
discountRouter.get('/', adminAuth, async (req, res) => {
  try {
    console.log('Fetching all discounts');
    const discounts = await Discount.find({}).populate('userId', 'email');
    console.log('Discounts fetched:', discounts.length);
    res.json({ success: true, discounts });
  } catch (error) {
    console.error('Error fetching discounts:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch discounts: ' + error.message });
  }
});

// Admin: Delete discount
discountRouter.delete('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Deleting discount with ID:', req.params.id);
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      console.warn('Discount not found for ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    console.log('Discount deleted successfully');
    res.json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to delete discount: ' + error.message });
  }
});

// User: Get applicable discounts
discountRouter.get('/applicable', authUser, async (req, res) => {
  try {
    console.log('Fetching applicable discounts for user:', req.body.userId);
    const globalDiscounts = await Discount.find({ type: 'global' });
    const userDiscounts = await Discount.find({ type: 'user', userId: req.body.userId });
    console.log('Applicable discounts fetched:', { global: globalDiscounts.length, user: userDiscounts.length });
    res.json({ success: true, globalDiscounts, userDiscounts });
  } catch (error) {
    console.error('Error fetching applicable discounts:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch applicable discounts: ' + error.message });
  }
});

export default discountRouter;