import express from 'express';
import { addProduct, deleteProduct, fetchProductById, fetchProducts, updateProduct } from '../controllers/products.controllers';
import { authenticateToken } from '../middleware/auth';
import { verifyAdmin } from '../middleware/verifyadmin';

const router = express.Router();

// Not a protected route
router.get('/:id', fetchProductById);
router.get('/', fetchProducts);
router.post('/', authenticateToken, verifyAdmin, addProduct);
// router.post('/upload', upload.single('image'), uploadImage);
router.put('/:id', authenticateToken, verifyAdmin, updateProduct);
router.delete('/:id', authenticateToken, verifyAdmin, deleteProduct);

export default router;
