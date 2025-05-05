import express from 'express';
import { loginUser, registerUser, adminLogin, sendOtp, sendResetCode, resetPassword, mergeCart, addAddress, updateAddress, deleteAddress, getAddresses, addToWishlist, removeFromWishlist, getWishlist, getAllWishlists, getWishlistedProducts, addMultipleToWishlist, createSubAdmin, listSubAdmins } from '../controllers/userController.js';
import authUser from '../middleware/auth.js';
import { adminAndManagerAuth, adminOnlyAuth } from '../middleware/roleAuth.js';
import { getRecommendations } from '../controllers/recommendation.js';

const userRouter = express.Router();

userRouter.post('/send-otp', sendOtp);
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.post('/add-address', authUser, addAddress);
userRouter.post('/update-address', authUser, updateAddress);
userRouter.post('/delete-address', authUser, deleteAddress);
userRouter.get('/addresses', authUser, getAddresses);
userRouter.post('/forget-password', sendResetCode);
userRouter.post('/reset-password', resetPassword);
userRouter.post('/merge-cart', authUser, mergeCart);
userRouter.post('/wishlist/add', authUser, addToWishlist);
userRouter.post('/wishlist/remove', authUser, removeFromWishlist);
userRouter.get('/wishlist', authUser, getWishlist);
userRouter.get('/admin/wishlists', authUser, getAllWishlists);
userRouter.get('/wishlists/products', adminAndManagerAuth, getWishlistedProducts); // Updated to admin and manager
userRouter.post('/wishlist/add-multiple', authUser, addMultipleToWishlist);
userRouter.get('/recommendations', authUser, async (req, res) => {
    try {
      const recommendations = await getRecommendations(req.body.userId);
      res.json({ success: true, recommendations });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
});
userRouter.post('/create-subadmin', adminOnlyAuth, createSubAdmin); // Updated to admin only
userRouter.get('/list-subadmins', adminOnlyAuth, listSubAdmins); // Updated to admin only

export default userRouter;