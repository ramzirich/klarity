import express from 'express';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import orderRoutes from './routes/order.routes';

import dotenv from 'dotenv';
import cors from 'cors';
import { authenticateToken } from './middleware/auth';
import { verifyAdmin } from './middleware/verifyadmin';
import { upload } from './utils/uploadutils';
import { uploadImage } from './controllers/image.controllers';
import path from 'path';




dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.post('/api/upload',authenticateToken, verifyAdmin, upload.single('image'), uploadImage);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', orderRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

export default app;
