import express from 'express';
import { register, login, refresh, refreshAccessToken, loginEmailOnly } from '../controllers/auth.controllers';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/email-login', loginEmailOnly);


router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route' });
  });

export default router;
