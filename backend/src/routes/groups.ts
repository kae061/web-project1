import { Router } from 'express';
import authenticateToken from '../middleware/auth';
import groupController from '../controllers/groupController';

const router = Router();
router.use(authenticateToken);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:groupId', groupController.getGroup);
router.get('/:groupId/messages', groupController.getMessages);
router.post('/:groupId/messages', groupController.sendMessage);
router.post('/:groupId/members', groupController.addMember);
router.delete('/:groupId/members/:userId', groupController.removeMember);

export default router;
