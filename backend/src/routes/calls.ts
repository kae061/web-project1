import { Router } from 'express';
import callController from '../controllers/callController';
import authenticateToken from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/initiate', callController.initiateCall);
router.put('/:callId/accept', callController.acceptCall);
router.put('/:callId/reject', callController.rejectCall);
router.put('/:callId/end', callController.endCall);
router.get('/history', callController.getCallHistory);

export default router;
