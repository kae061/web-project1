import { Request, Response } from 'express';
import SuperGroup from '../models/SuperGroup';
import Topic from '../models/Topic';
import Message from '../models/Message';
import { io } from '../index';

const superGroupController = {
  /**
   * POST /api/supergroups
   * Create a new supergroup.
   */
  async createSuperGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, isPublic, username, memberIds } = req.body;
      const userId = req.user!.id;

      if (!name?.trim()) {
        res.status(400).json({ success: false, message: 'SuperGroup name is required' });
        return;
      }

      // Check username uniqueness
      if (username) {
        const exists = await SuperGroup.findOne({ username: username.trim() });
        if (exists) {
          res.status(400).json({ success: false, message: 'Username already taken' });
          return;
        }
      }

      const members = [...new Set([userId, ...(memberIds || [])])];

      const sg = new SuperGroup({
        name: name.trim(),
        description: description?.trim(),
        creator: userId,
        admins: [userId],
        members,
        isPublic: isPublic !== false,
        username: username?.trim() || undefined,
      });

      await sg.save();

      // Create a default "General" topic
      const defaultTopic = new Topic({
        superGroupId: sg._id,
        name: 'General',
        description: 'Main discussion',
        icon: '💬',
        createdBy: userId,
      });
      await defaultTopic.save();

      sg.topics.push(defaultTopic._id as any);
      await sg.save();

      await sg.populate('members', 'username email avatar status');
      await sg.populate('creator', 'username email avatar');

      // Notify members
      members.forEach((memberId: string) => {
        io.to(`user:${memberId}`).emit('supergroup:created', sg);
      });

      res.status(201).json({ success: true, data: { superGroup: sg, defaultTopic } });
    } catch (error) {
      console.error('[superGroupController.createSuperGroup]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/supergroups
   * Get all supergroups for the current user.
   */
  async getSuperGroups(req: Request, res: Response): Promise<void> {
    try {
      const sgs = await SuperGroup.find({ members: req.user!.id })
        .populate('members', 'username email avatar status')
        .populate('creator', 'username email avatar')
        .populate('topics')
        .sort({ updatedAt: -1 });

      res.status(200).json({ success: true, data: sgs });
    } catch (error) {
      console.error('[superGroupController.getSuperGroups]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/supergroups/:sgId
   * Get a specific supergroup with its topics.
   */
  async getSuperGroup(req: Request, res: Response): Promise<void> {
    try {
      const sg = await SuperGroup.findOne({
        _id: req.params.sgId,
        members: req.user!.id,
      })
        .populate('members', 'username email avatar status')
        .populate('admins', 'username email avatar')
        .populate('creator', 'username email avatar')
        .populate('topics');

      if (!sg) {
        res.status(404).json({ success: false, message: 'SuperGroup not found' });
        return;
      }

      res.status(200).json({ success: true, data: sg });
    } catch (error) {
      console.error('[superGroupController.getSuperGroup]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/supergroups/:sgId/topics
   * Create a topic in a supergroup.
   */
  async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const { sgId } = req.params;
      const { name, description, icon } = req.body;
      const userId = req.user!.id;

      const sg = await SuperGroup.findOne({ _id: sgId, admins: userId });
      if (!sg) {
        res.status(403).json({ success: false, message: 'Not authorized or supergroup not found' });
        return;
      }

      const topic = new Topic({
        superGroupId: sgId,
        name: name.trim(),
        description: description?.trim(),
        icon: icon || '💬',
        createdBy: userId,
      });

      await topic.save();

      sg.topics.push(topic._id as any);
      await sg.save();

      io.to(`supergroup:${sgId}`).emit('supergroup:topicCreated', topic);

      res.status(201).json({ success: true, data: topic });
    } catch (error) {
      console.error('[superGroupController.createTopic]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/supergroups/:sgId/topics
   * List all topics in a supergroup.
   */
  async getTopics(req: Request, res: Response): Promise<void> {
    try {
      const { sgId } = req.params;

      const sg = await SuperGroup.findOne({ _id: sgId, members: req.user!.id });
      if (!sg) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const topics = await Topic.find({ superGroupId: sgId })
        .populate('createdBy', 'username avatar')
        .populate('lastMessage')
        .sort({ createdAt: 1 });

      res.status(200).json({ success: true, data: topics });
    } catch (error) {
      console.error('[superGroupController.getTopics]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/supergroups/:sgId/topics/:topicId/messages
   * Get messages for a specific topic.
   */
  async getTopicMessages(req: Request, res: Response): Promise<void> {
    try {
      const { sgId, topicId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const sg = await SuperGroup.findOne({ _id: sgId, members: req.user!.id });
      if (!sg) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const messages = await Message.find({ superGroupId: sgId, topicId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('senderId', 'username avatar')
        .populate('replyTo');

      res.status(200).json({ success: true, data: messages.reverse() });
    } catch (error) {
      console.error('[superGroupController.getTopicMessages]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/supergroups/:sgId/topics/:topicId/messages
   * Send a message to a topic.
   */
  async sendTopicMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sgId, topicId } = req.params;
      const { content, mediaAttachments } = req.body;
      const userId = req.user!.id;

      const sg = await SuperGroup.findOne({ _id: sgId, members: userId });
      if (!sg) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const message = new Message({
        senderId: userId,
        superGroupId: sgId,
        topicId,
        content: content || '',
        mediaAttachments: mediaAttachments || [],
      });

      await message.save();
      await message.populate('senderId', 'username avatar');

      // Update topic lastMessage
      await Topic.findByIdAndUpdate(topicId, {
        lastMessage: message._id,
        lastMessageTime: new Date(),
      });

      // Broadcast to supergroup room
      io.to(`supergroup:${sgId}`).emit('supergroup:message', { topicId, message });

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      console.error('[superGroupController.sendTopicMessage]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /api/supergroups/:sgId/members
   * Add a member to a supergroup.
   */
  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const { sgId } = req.params;

      const sg = await SuperGroup.findOne({ _id: sgId, admins: req.user!.id });
      if (!sg) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      if (sg.members.map(m => m.toString()).includes(userId)) {
        res.status(400).json({ success: false, message: 'User is already a member' });
        return;
      }

      sg.members.push(userId);
      await sg.save();

      io.to(`supergroup:${sgId}`).emit('supergroup:memberAdded', { sgId, userId });

      res.status(200).json({ success: true, message: 'Member added' });
    } catch (error) {
      console.error('[superGroupController.addMember]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

export default superGroupController;
