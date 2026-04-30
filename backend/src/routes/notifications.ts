import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getNotifications, streamNotifications, addNotification, markRead, markAllRead } from '../controllers/notificationController';

const router = Router();

router.get('/', authenticateJWT, getNotifications);
router.get('/stream', authenticateJWT, streamNotifications);
router.post('/', authenticateJWT, addNotification);
router.patch('/read-all', authenticateJWT, markAllRead);
router.patch('/:id/read', authenticateJWT, markRead);

export default router;
