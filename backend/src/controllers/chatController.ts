import { Request, Response } from 'express';
import { z } from 'zod';
import Chat from '../models/Chat';
import Message from '../models/Message';

const chatController = {
  /**
   * GET /api/chats
   * Finds all chats where current user is a participant.
   */
  async getChats(req: Request, res: Response): Promise<void> {
    try {
      const chats = await Chat.find({
        participants: req.user!.id,
      })
        .populate('participants', 'username email avatar status lastSeen')
        .populate('lastMessage')
        .sort({ lastMessageTime: -1 });

      res.status(200).json({ success: true, data: chats });
    } catch (error) {
      console.error('[chatController.getChats]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/chats/:chatId
   * Gets one chat by id.
   */
  async getChat(req: Request, res: Response): Promise<void> {
    try {
      const chat = await Chat.findOne({
        _id: req.params.chatId,
        participants: req.user!.id,
      })
        .populate('participants', 'username email avatar status lastSeen')
        .populate('lastMessage');

      if (!chat) {
        res.status(404).json({ success: false, message: 'Chat not found' });
        return;
      }

      res.status(200).json({ success: true, data: chat });
    } catch (error) {
      console.error('[chatController.getChat]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/chats
   * Takes { recipientId } from body, creates chat with 2 participants.
   */
  async createChat(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId } = req.body;

      if (!recipientId) {
        res.status(400).json({ success: false, message: 'Recipient ID is required' });
        return;
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        participants: { $all: [req.user!.id, recipientId] },
      });

      if (chat) {
        res.status(200).json({ success: true, data: chat });
        return;
      }

      chat = new Chat({
        participants: [req.user!.id, recipientId],
      });

      await chat.save();
      await chat.populate('participants', 'username email avatar status lastSeen');

      res.status(201).json({ success: true, data: chat });
    } catch (error) {
      console.error('[chatController.createChat]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/chats/:chatId/messages
   * Gets messages for chatId with pagination.
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      // Verify user is in chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user!.id,
      });

      if (!chat) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const messages = await Message.find({
        chatId,
        deletedFor: { $ne: req.user!.id },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'username avatar')
        .populate({
          path: 'replyTo',
          populate: { path: 'senderId', select: 'username avatar' }
        });

      // Return messages in chronological order for the UI
      const chronologicalMessages = messages.reverse();

      res.status(200).json({ success: true, data: chronologicalMessages });
    } catch (error) {
      console.error('[chatController.getMessages]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

export default chatController;
