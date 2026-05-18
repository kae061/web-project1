import { Request, Response } from 'express';
import { z } from 'zod';
import Message from '../models/Message';
import Chat from '../models/Chat';
import { io } from '../index';

const messageController = {
  /**
   * POST /api/messages
   * Takes { chatId, content, mediaAttachments } from body, creates Message.
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { chatId, content, mediaAttachments, replyTo } = req.body;

      if (!chatId) {
        res.status(400).json({ success: false, message: 'Chat ID is required' });
        return;
      }

      const message = new Message({
        senderId: req.user!.id,
        chatId,
        content,
        mediaAttachments,
        replyTo,
      });

      await message.save();

      // Update last message in chat
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastMessageTime: message.createdAt,
        $push: { messages: message._id },
      });

      await message.populate('senderId', 'username avatar');
      await message.populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: 'username avatar' }
      });

      // Emit via socket
      io.to(`chat:${chatId}`).emit('message:receive', message);

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      console.error('[messageController.sendMessage]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/messages/:messageId
   * Updates message content.
   */
  async editMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { content } = req.body;

      const message = await Message.findOne({
        _id: messageId,
        senderId: req.user!.id,
      });

      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found or unauthorized' });
        return;
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();

      await message.save();

      // Emit update via socket
      io.to(`chat:${message.chatId}`).emit('message:update', message);

      res.status(200).json({ success: true, data: message });
    } catch (error) {
      console.error('[messageController.editMessage]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * DELETE /api/messages/:messageId
   * Delete for everyone (only if sender)
   */
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      const message = await Message.findById(messageId);
      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      // Check if user is the sender
      if (message.senderId.toString() !== userId.toString()) {
        res.status(403).json({ success: false, message: 'Unauthorized to delete for everyone' });
        return;
      }

      message.isDeleted = true;
      message.content = 'This message was deleted';
      message.mediaAttachments = [];
      await message.save();

      // Emit deletion via socket
      io.to(`chat:${message.chatId}`).emit('message:deleted', { messageId });

      res.status(200).json({ success: true, message: 'Message deleted for everyone' });
    } catch (error) {
      console.error('[messageController.deleteMessage]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/messages/:messageId/delete-for-me
   * Hide message for current user only
   */
  async deleteForMe(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      const message = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { deletedFor: userId } },
        { new: true }
      );

      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      res.status(200).json({ success: true, message: 'Message deleted for you' });
    } catch (error) {
      console.error('[messageController.deleteForMe]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/chats/:chatId/clear
   * Clear all messages in chat for current user
   */
  async clearChat(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.id;

      // Add user to deletedFor for all messages in this chat
      await Message.updateMany(
        { chatId },
        { $addToSet: { deletedFor: userId } }
      );

      res.status(200).json({ success: true, message: 'Chat cleared' });
    } catch (error) {
      console.error('[messageController.clearChat]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/messages/:messageId/read
   * Adds user to readBy array.
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;

      const message = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { readBy: req.user!.id } },
        { new: true }
      );

      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      // Emit read receipt via socket
      io.to(`chat:${message.chatId}`).emit('message:read', {
        messageId,
        userId: req.user!.id,
      });

      res.status(200).json({ success: true, message: 'Message marked as read' });
    } catch (error) {
      console.error('[messageController.markAsRead]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/messages/:messageId/reactions
   * Adds or removes a reaction emoji.
   */
  async addReaction(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user!.id;

      const message = await Message.findById(messageId);
      if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      // Check if reaction with this emoji already exists
      const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

      if (reactionIndex > -1) {
        const userIndex = message.reactions[reactionIndex].users.indexOf(userId as any);
        if (userIndex > -1) {
          // Remove user from reaction
          message.reactions[reactionIndex].users.splice(userIndex, 1);
          // If no users left for this emoji, remove the emoji reaction entirely
          if (message.reactions[reactionIndex].users.length === 0) {
            message.reactions.splice(reactionIndex, 1);
          }
        } else {
          // Add user to existing emoji reaction
          message.reactions[reactionIndex].users.push(userId as any);
        }
      } else {
        // Add new emoji reaction
        message.reactions.push({ emoji, users: [userId as any] });
      }

      await message.save();
      await message.populate('senderId', 'username avatar');

      // Emit reaction update
      io.to(`chat:${message.chatId}`).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });

      res.status(200).json({ success: true, data: message });
    } catch (error) {
      console.error('[messageController.addReaction]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

export default messageController;
