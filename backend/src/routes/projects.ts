import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getProjects, addProject, editProject, removeProject, getProjectActivity, streamProjectActivity, getMembers, inviteMember, editMemberRole, deleteMember } from '../controllers/projectController';

const router = Router();

router.get('/', authenticateJWT, getProjects);
router.post('/', authenticateJWT, addProject);
router.get('/:id/members', authenticateJWT, getMembers);
router.post('/:id/members', authenticateJWT, inviteMember);
router.patch('/:id/members/:memberId', authenticateJWT, editMemberRole);
router.delete('/:id/members/:memberId', authenticateJWT, deleteMember);
router.get('/:id/activity', authenticateJWT, getProjectActivity);
router.get('/:id/activity/stream', authenticateJWT, streamProjectActivity);
router.put('/:id', authenticateJWT, editProject);
router.delete('/:id', authenticateJWT, removeProject);

export default router;
