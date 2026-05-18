import { Request, Response } from 'express';
import Call from '../models/Call';

const callController = {
  /**
   * POST /api/calls/initiate
   * Creates a new call record with 'initiated' status.
   */
  async initiateCall(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, type, groupId } = req.body;

      const call = new Call({
        callerId: req.user!.id,
        recipientId,
        groupId,
        type,
        status: 'initiated',
        participants: [{ userId: req.user!.id, joinedAt: new Date() }],
      });

      await call.save();
      res.status(201).json({ success: true, data: call });
    } catch (error) {
      console.error('[callController.initiateCall]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/calls/:callId/accept
   * Updates call status to 'ongoing' and sets startTime.
   */
  async acceptCall(req: Request, res: Response): Promise<void> {
    try {
      const { callId } = req.params;

      const call = await Call.findByIdAndUpdate(
        callId,
        { 
          status: 'ongoing', 
          startTime: new Date(),
          $push: { participants: { userId: req.user!.id, joinedAt: new Date() } }
        },
        { new: true }
      );

      if (!call) {
        res.status(404).json({ success: false, message: 'Call not found' });
        return;
      }

      res.status(200).json({ success: true, data: call });
    } catch (error) {
      console.error('[callController.acceptCall]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/calls/:callId/reject
   * Updates call status to 'rejected'.
   */
  async rejectCall(req: Request, res: Response): Promise<void> {
    try {
      const { callId } = req.params;

      const call = await Call.findByIdAndUpdate(
        callId,
        { status: 'rejected' },
        { new: true }
      );

      if (!call) {
        res.status(404).json({ success: false, message: 'Call not found' });
        return;
      }

      res.status(200).json({ success: true, message: 'Call rejected' });
    } catch (error) {
      console.error('[callController.rejectCall]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/calls/:callId/end
   * Ends call, calculates duration.
   */
  async endCall(req: Request, res: Response): Promise<void> {
    try {
      const { callId } = req.params;
      const endTime = new Date();

      const call = await Call.findById(callId);
      if (!call) {
        res.status(404).json({ success: false, message: 'Call not found' });
        return;
      }

      if (call.startTime) {
        call.duration = Math.floor((endTime.getTime() - call.startTime.getTime()) / 1000);
      }
      
      call.status = 'ended';
      call.endTime = endTime;
      
      // Update participants' leftAt for the user ending the call
      const participant = call.participants.find(p => p.userId.toString() === req.user!.id);
      if (participant) participant.leftAt = endTime;

      await call.save();
      res.status(200).json({ success: true, data: call });
    } catch (error) {
      console.error('[callController.endCall]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /api/calls/history
   * Returns call history for the current user.
   */
  async getCallHistory(req: Request, res: Response): Promise<void> {
    try {
      const calls = await Call.find({
        $or: [{ callerId: req.user!.id }, { recipientId: req.user!.id }],
      })
      .populate('callerId', 'username avatar')
      .populate('recipientId', 'username avatar')
      .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: calls });
    } catch (error) {
      console.error('[callController.getCallHistory]', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

export default callController;
