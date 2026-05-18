import { useCallback, useRef } from 'react';

export type CallType = 'voice' | 'video';

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: true, noiseSuppression: true },
  video: { width: { ideal: 640 }, height: { ideal: 480 } },
};

/**
 * useMedia — acquire, stop, and toggle local camera / microphone streams.
 */
export function useMedia() {
  const streamRef = useRef<MediaStream | null>(null);

  const getMediaStream = useCallback(async (type: CallType): Promise<MediaStream> => {
    const constraints = type === 'video' ? VIDEO_CONSTRAINTS : AUDIO_CONSTRAINTS;
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;
    return stream;
  }, []);

  const stopMediaStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const toggleAudio = useCallback((): boolean => {
    if (!streamRef.current) return false;
    const tracks = streamRef.current.getAudioTracks();
    const next = !tracks[0]?.enabled;
    tracks.forEach((t) => (t.enabled = next));
    return !next; // returns true when muted
  }, []);

  const toggleVideo = useCallback((): boolean => {
    if (!streamRef.current) return false;
    const tracks = streamRef.current.getVideoTracks();
    const next = !tracks[0]?.enabled;
    tracks.forEach((t) => (t.enabled = next));
    return !next; // returns true when video off
  }, []);

  return { getMediaStream, stopMediaStream, toggleAudio, toggleVideo, streamRef };
}
