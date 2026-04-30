import { Router } from 'express';
import { signup, login, profile, updateProfile } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateJWT, profile);
router.put('/profile', authenticateJWT, updateProfile);

export default router;
