import express from 'express';
import { loginUser, registerUser, adminLogin } from '../controllers/userController.js';
import authUser from '../middleware/auth.js';
import { addAddress, updateAddress, deleteAddress, getAddresses } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.post('/add-address', authUser, addAddress);
userRouter.post('/update-address', authUser, updateAddress);
userRouter.post('/delete-address', authUser, deleteAddress);
userRouter.get('/addresses', authUser, getAddresses);

export default userRouter;