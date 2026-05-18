import { Router } from 'express';
import chatController from '../controllers/chatController';
import messageController from '../controllers/messageController';
import authenticateToken from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticateToken);

// Chat routes
router.get('/', chatController.getChats);
router.post('/', chatController.createChat);
router.get('/:chatId', chatController.getChat);
router.get('/:chatId/messages', chatController.getMessages);

// Message routes
router.post('/messages', messageController.sendMessage);
router.put('/messages/:messageId', messageController.editMessage);
router.delete('/messages/:messageId', messageController.deleteMessage);
router.put('/messages/:messageId/delete-for-me', messageController.deleteForMe);
router.put('/:chatId/clear', messageController.clearChat);
router.put('/messages/:messageId/read', messageController.markAsRead);
router.post('/messages/:messageId/reactions', messageController.addReaction);

export default router;
