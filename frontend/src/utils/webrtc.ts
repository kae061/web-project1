/**
 * RTCManager — manages a single WebRTC peer connection.
 * Handles offer/answer creation, ICE candidates, and track events.
 */

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface RTCManagerCallbacks {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onTrack: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export class RTCManager {
  private pc: RTCPeerConnection | null = null;
  private remoteStream: MediaStream;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private callbacks: RTCManagerCallbacks;

  constructor(callbacks: RTCManagerCallbacks) {
    this.callbacks = callbacks;
    this.remoteStream = new MediaStream();
    this.pc = new RTCPeerConnection(ICE_CONFIG);

    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.callbacks.onIceCandidate(e.candidate);
    };

    this.pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => this.remoteStream.addTrack(t));
      this.callbacks.onTrack(this.remoteStream);
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) this.callbacks.onConnectionStateChange(this.pc.connectionState);
    };
  }

  /** Add local media tracks to the connection */
  addLocalStream(stream: MediaStream): void {
    if (!this.pc) return;
    stream.getTracks().forEach((track) => this.pc!.addTrack(track, stream));
  }

  /** Caller: create and set local SDP offer */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /** Callee: set remote offer, then create and set local SDP answer */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    // flush queued candidates
    await this.flushPendingCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /** Caller: set the remote SDP answer */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushPendingCandidates();
  }

  /** Add an ICE candidate (queues if remote desc not yet set) */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  getRemoteStream(): MediaStream {
    return this.remoteStream;
  }

  /** Tear down the peer connection and release resources */
  close(): void {
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
    this.pendingCandidates = [];
  }

  /* ── private ── */

  private async flushPendingCandidates(): Promise<void> {
    if (!this.pc) return;
    for (const c of this.pendingCandidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.warn('[RTCManager] failed to add queued candidate', err);
      }
    }
    this.pendingCandidates = [];
  }
}
