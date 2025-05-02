import express from 'express';
import { loginUser, registerUser, adminLogin, sendOtp, sendResetCode, resetPassword, mergeCart } from '../controllers/userController.js';
import authUser from '../middleware/auth.js';
import { addAddress, updateAddress, deleteAddress, getAddresses } from '../controllers/userController.js';

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

export default userRouter;