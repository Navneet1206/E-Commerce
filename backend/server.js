import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import discountRouter from './routes/discountRoute.js';
import returnRefundRouter from './routes/returnRefundRoute.js';
import './models/couponUsageModel.js';
import { computeRecommendationData } from './controllers/recommendation.js';

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());
app.use(cors());

// API endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/discount', discountRouter);
app.use('/api/return-refund', returnRefundRouter);
app.get('/', (req, res) => {
    res.send("API working");
});

// Start the server and compute recommendation data
app.listen(port, async () => {
    console.log('Server started on port: ' + port);
    try {
        await computeRecommendationData();
    } catch (error) {
        console.error('Error computing recommendation data:', error);
    }
});