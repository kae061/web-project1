import { Request, Response } from 'express';
import Group from '../models/Group';
import Message from '../models/Message';
import { io } from '../index';

const groupController = {
  /**
   * POST /api/groups
   * Create a new group chat.
   */
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, memberIds } = req.body;
      const userId = req.user!.id;

      if (!name?.trim()) {
        res.status(400).json({ success: false, message: 'Group name is required' });
        return;
      }

      const members = [...new Set([userId, ...(memberIds || [])])];

      const group = new Group({
        name: name.trim(),
        description: description?.trim(),
        creator: userId,
        admins: [userId],
        members,
      });

      await group.save();
      await group.populate('members', 'username email avatar status');
      await group.populate('creator', 'username email avatar');

      // Notify all members via socket
      members.forEach((memberId: string) => {
        io.to(`user:${memberId}`).emit('group:created', group);
      });

      res.status(201).json({ success: true, data: group });
    } catch (error) {
      console.error('[groupController.createGroup]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/groups
   * Get all groups for the current user.
   */
  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await Group.find({ members: req.user!.id })
        .populate('members', 'username email avatar status')
        .populate('admins', 'username email avatar')
        .populate('creator', 'username email avatar')
        .populate('lastMessage')
        .sort({ lastMessageTime: -1 });

      res.status(200).json({ success: true, data: groups });
    } catch (error) {
      console.error('[groupController.getGroups]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/groups/:groupId
   * Get a specific group.
   */
  async getGroup(req: Request, res: Response): Promise<void> {
    try {
      const group = await Group.findOne({
        _id: req.params.groupId,
        members: req.user!.id,
      })
        .populate('members', 'username email avatar status')
        .populate('admins', 'username email avatar')
        .populate('creator', 'username email avatar')
        .populate('lastMessage');

      if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
      }

      res.status(200).json({ success: true, data: group });
    } catch (error) {
      console.error('[groupController.getGroup]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/groups/:groupId/members
   * Add a member to a group (admin only).
   */
  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const { groupId } = req.params;

      const group = await Group.findOne({ _id: groupId, admins: req.user!.id });
      if (!group) {
        res.status(403).json({ success: false, message: 'Not authorized or group not found' });
        return;
      }

      if (group.members.map(m => m.toString()).includes(userId)) {
        res.status(400).json({ success: false, message: 'User is already a member' });
        return;
      }

      group.members.push(userId);
      await group.save();
      await group.populate('members', 'username email avatar status');

      io.to(`group:${groupId}`).emit('group:memberAdded', { groupId, user: userId });

      res.status(200).json({ success: true, data: group });
    } catch (error) {
      console.error('[groupController.addMember]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * DELETE /api/groups/:groupId/members/:userId
   * Remove a member from a group (admin only, or self-leave).
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      const requesterId = req.user!.id;

      const group = await Group.findOne({ _id: groupId, members: requesterId });
      if (!group) {
        res.status(404).json({ success: false, message: 'Group not found' });
        return;
      }

      // Only admins can remove others; anyone can remove themselves
      const isAdmin = group.admins.map(a => a.toString()).includes(requesterId);
      if (!isAdmin && requesterId !== userId) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      group.members = group.members.filter(m => m.toString() !== userId) as any;
      group.admins = group.admins.filter(a => a.toString() !== userId) as any;
      await group.save();

      io.to(`group:${groupId}`).emit('group:memberRemoved', { groupId, userId });

      res.status(200).json({ success: true, message: 'Member removed' });
    } catch (error) {
      console.error('[groupController.removeMember]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/groups/:groupId/messages
   * Get messages for a group.
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const group = await Group.findOne({ _id: groupId, members: req.user!.id });
      if (!group) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const messages = await Message.find({ groupId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('senderId', 'username avatar')
        .populate('replyTo');

      res.status(200).json({ success: true, data: messages.reverse() });
    } catch (error) {
      console.error('[groupController.getMessages]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/groups/:groupId/messages
   * Send a message to a group.
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { content, mediaAttachments } = req.body;
      const userId = req.user!.id;

      const group = await Group.findOne({ _id: groupId, members: userId });
      if (!group) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const message = new Message({
        senderId: userId,
        groupId,
        content: content || '',
        mediaAttachments: mediaAttachments || [],
      });

      await message.save();
      await message.populate('senderId', 'username avatar');

      // Update group lastMessage
      group.lastMessage = message._id as any;
      group.lastMessageTime = new Date();
      await group.save();

      // Broadcast to group room
      io.to(`group:${groupId}`).emit('group:message', message);

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      console.error('[groupController.sendMessage]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

export default groupController;
