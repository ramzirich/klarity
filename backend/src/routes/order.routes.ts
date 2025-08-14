import express from 'express';
import {   createOrder, deleteOrder, getAllOrders, getOrderById, getUserOrders } from '../controllers/order.controllers';
import { authenticateToken } from '../middleware/auth';
import { verifyAdmin } from '../middleware/verifyadmin';

const router = express.Router();

router.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/') {
      return next(); // skip auth on POST /
    }
    authenticateToken(req, res, next);
  });

// ✅ Client
router.post('/', createOrder);
router.get('/my', getUserOrders);
router.delete('/:id',authenticateToken , deleteOrder);
router.get('/:id',authenticateToken,  getOrderById); // both admin & user

// ✅ Admin
router.get('/', verifyAdmin, getAllOrders);


export default router;