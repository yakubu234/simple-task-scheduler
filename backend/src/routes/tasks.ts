import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getTasks, addTask, editTask, editTaskPriority, removeTask } from '../controllers/taskController';
import { addTaskComment, getTaskComments, removeTaskComment } from '../controllers/commentController';

const router = Router();

router.get('/', authenticateJWT, getTasks);
router.post('/', authenticateJWT, addTask);
router.get('/:id/comments', authenticateJWT, getTaskComments);
router.post('/:id/comments', authenticateJWT, addTaskComment);
router.delete('/:id/comments/:commentId', authenticateJWT, removeTaskComment);
router.put('/:id', authenticateJWT, editTask);
router.patch('/:id/priority', authenticateJWT, editTaskPriority);
router.delete('/:id', authenticateJWT, removeTask);

export default router;
