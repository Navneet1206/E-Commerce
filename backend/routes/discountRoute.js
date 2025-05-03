import express from 'express';
import Discount from '../models/Discount.js';
import User from '../models/userModel.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const discountRouter = express.Router();

// Admin: Create global discount
discountRouter.post('/global', adminAuth, async (req, res) => {
  try {
    const { minPrice, maxPrice, percentage } = req.body;
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(percentage)) {
      return res.status(400).json({ success: false, message: 'All fields must be numbers' });
    }
    if (minPrice < 0 || maxPrice < 0 || percentage < 0 || percentage > 100) {
      return res.status(400).json({ success: false, message: 'Invalid range or percentage' });
    }
    if (minPrice >= maxPrice) {
      return res.status(400).json({ success: false, message: 'minPrice must be less than maxPrice' });
    }
    const discount = new Discount({ type: 'global', minPrice, maxPrice, percentage });
    await discount.save();
    res.json({ success: true, message: 'Global discount created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create user-specific discount
discountRouter.post('/user', adminAuth, async (req, res) => {
  try {
    const { email, minPrice, maxPrice, percentage } = req.body;
    if (!email || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(percentage)) {
      return res.status(400).json({ success: false, message: 'Missing or invalid fields' });
    }
    if (minPrice < 0 || maxPrice < 0 || percentage < 0 || percentage > 100) {
      return res.status(400).json({ success: false, message: 'Invalid range or percentage' });
    }
    if (minPrice >= maxPrice) {
      return res.status(400).json({ success: false, message: 'minPrice must be less than maxPrice' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const discount = new Discount({ type: 'user', userId: user._id, minPrice, maxPrice, percentage });
    await discount.save();
    res.json({ success: true, message: 'User-specific discount created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: List all discounts
discountRouter.get('/', adminAuth, async (req, res) => {
  try {
    const discounts = await Discount.find({}).populate('userId', 'email');
    res.json({ success: true, discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete discount
discountRouter.delete('/:id', adminAuth, async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    res.json({ success: true, message: 'Discount deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// User: Get applicable discounts
discountRouter.get('/applicable', authUser, async (req, res) => {
  try {
    const globalDiscounts = await Discount.find({ type: 'global' });
    const userDiscounts = await Discount.find({ type: 'user', userId: req.body.userId });
    res.json({ success: true, globalDiscounts, userDiscounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default discountRouter;