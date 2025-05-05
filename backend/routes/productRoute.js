import express from 'express';
import { listProducts, addProduct, removeProduct, singleProduct, updateProduct, getSubCategories, getColors } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import { adminAndManagerAuth } from '../middleware/roleAuth.js';

const productRouter = express.Router();

// Middleware to log the user's role for debugging
const debugRole = (req, res, next) => {
  console.log('User role:', req.body.role || req.user?.role || 'Role not found');
  next();
};

productRouter.post('/add', adminAndManagerAuth, debugRole, upload.fields([{name:'image1', maxCount:1}, {name:'image2', maxCount:1}, {name:'image3', maxCount:1}, {name:'image4', maxCount:1}]), addProduct);
productRouter.get('/list', adminAndManagerAuth, debugRole, listProducts);
productRouter.post('/single', adminAndManagerAuth, debugRole, singleProduct);
productRouter.post('/remove', adminAndManagerAuth, debugRole, removeProduct);
productRouter.post('/update', adminAndManagerAuth, debugRole, upload.fields([{name:'image1', maxCount:1}, {name:'image2', maxCount:1}, {name:'image3', maxCount:1}, {name:'image4', maxCount:1}]), updateProduct);
productRouter.get('/subcategories', getSubCategories); // Open to all; add auth if sensitive
productRouter.get('/colors', getColors); // Open to all; add auth if sensitive

export default productRouter;