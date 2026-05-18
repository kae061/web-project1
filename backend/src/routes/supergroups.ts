import { Router } from 'express';
import authenticateToken from '../middleware/auth';
import superGroupController from '../controllers/superGroupController';

const router = Router();
router.use(authenticateToken);

router.post('/', superGroupController.createSuperGroup);
router.get('/', superGroupController.getSuperGroups);
router.get('/:sgId', superGroupController.getSuperGroup);
router.post('/:sgId/members', superGroupController.addMember);
router.post('/:sgId/topics', superGroupController.createTopic);
router.get('/:sgId/topics', superGroupController.getTopics);
router.get('/:sgId/topics/:topicId/messages', superGroupController.getTopicMessages);
router.post('/:sgId/topics/:topicId/messages', superGroupController.sendTopicMessage);

export default router;
