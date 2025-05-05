import express from 'express';
import { listProducts, addProduct, removeProduct, singleProduct, updateProduct, getSubCategories, getColors } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import { adminAndManagerAuth } from '../middleware/roleAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAndManagerAuth, upload.fields([{name:'image1', maxCount:1}, {name:'image2', maxCount:1}, {name:'image3', maxCount:1}, {name:'image4', maxCount:1}]), addProduct);
productRouter.get('/list', adminAndManagerAuth, listProducts);
productRouter.post('/single', adminAndManagerAuth, singleProduct);
productRouter.post('/remove', adminAndManagerAuth, removeProduct);
productRouter.post('/update', adminAndManagerAuth, upload.fields([{name:'image1', maxCount:1}, {name:'image2', maxCount:1}, {name:'image3', maxCount:1}, {name:'image4', maxCount:1}]), updateProduct);
productRouter.get('/subcategories', getSubCategories);
productRouter.get('/colors', getColors);

export default productRouter;