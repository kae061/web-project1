import React, { useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../services/chatService';
import { uploadService } from '../../services/uploadService';
import { MediaAttachment } from '../../types';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

const BACKEND_URL = 'http://localhost:3333';

const getFileUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${BACKEND_URL}${url}`;
  return url;
};

interface MessageInputProps {
  isLoading?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ isLoading }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { currentChat, addMessage, editingMessage, setEditingMessage, updateMessage, replyingTo, setReplyingTo } = useChatStore();
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  React.useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      inputRef.current?.focus();
    } else {
      setContent('');
    }
  }, [editingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isLoading || isSending || !currentChat) return;

    setIsSending(true);
    setError(null);
    try {
      if (editingMessage) {
        const updated = await chatService.editMessage(editingMessage._id, content);
        updateMessage(updated);
        setEditingMessage(null);
      } else {
        await chatService.sendMessage(currentChat._id, content, attachments, replyingTo?._id);
        setReplyingTo(null);
        // We rely on the socket event to add the message to the store
        // this prevents duplicates if the socket event arrives quickly
      }

      setContent('');
      setAttachments([]);
      // Focus the input again after sending to allow continuous typing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat) return;

    setIsUploading(true);
    setError(null);
    try {
      let type: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const result = await uploadService.uploadFile(file, type);
      
      const newAttachment: MediaAttachment = {
        type,
        url: result.url,
        fileName: file.name,
        fileSize: file.size,
        duration: result.duration
      };

      setAttachments(prev => [...prev, newAttachment]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        setIsUploading(true);
        try {
          console.log('[VoiceDebug] Audio data captured, size:', audioBlob.size);
          const result = await uploadService.uploadFile(file, 'audio');
          console.log('[VoiceDebug] Upload success:', result.url);
          
          const newAttachment: MediaAttachment = {
            type: 'audio',
            url: result.url,
            fileName: file.name,
            fileSize: file.size,
            duration: result.duration
          };
          
          // Auto-send voice message
          if (currentChat) {
            console.log('[VoiceDebug] Sending message to chat:', currentChat._id);
            await chatService.sendMessage(currentChat._id, '', [newAttachment]);
            console.log('[VoiceDebug] Voice message sent successfully');
            // Rely on socket to add the message
          }
        } catch (err: any) {
          console.error('[VoiceDebug] Error in voice message flow:', err);
          setError(err.message || 'Failed to send voice message');
        } finally {
          setIsUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError('Microphone access denied');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-8 pb-8 pt-4 bg-white relative z-30">
      {error && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm animate-fade-in">
          {error}
        </div>
      )}
      
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-4 z-50 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
          <div className="relative">
            <EmojiPicker 
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              theme={Theme.LIGHT}
            />
          </div>
        </div>
      )}
      
      {editingMessage && (
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl animate-fade-in">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-[#333333]">Editing Message</span>
          </div>
          <button onClick={() => setEditingMessage(null)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {replyingTo && (
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl animate-fade-in">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg flex-shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-bold text-primary">Replying to {typeof replyingTo.senderId === 'object' ? replyingTo.senderId.username : 'User'}</span>
              <span className="text-xs text-gray-500 truncate">{replyingTo.content || 'Media'}</span>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
          {attachments.map((att, i) => (
            <div key={i} className="group relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
              {att.type === 'image' ? (
                <img src={getFileUrl(att.url)} alt="upload" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg mb-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-bold text-gray-500 truncate w-full text-center px-1">
                    {att.fileName || 'File'}
                  </span>
                </div>
              )}
              <button 
                onClick={() => removeAttachment(i)}
                className="absolute top-0.5 right-0.5 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {isUploading && (
            <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 border-dashed flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
      />

      <form onSubmit={handleSubmit} className="relative flex items-center space-x-4">
        <div className="relative flex-1 flex items-center bg-gray-100 rounded-full px-4 py-3">
          <button 
            type="button" 
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-primary'}`}
          >
            {isRecording ? (
              <div className="flex items-center space-x-2 px-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs font-bold font-mono text-red-500">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          {!isRecording ? (
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder={attachments.length > 0 ? "Add a caption..." : "Write Something"}
              disabled={isLoading || isSending}
              className="flex-1 bg-transparent border-none text-[#000000] placeholder:text-[#999999] text-sm outline-none px-3"
            />
          ) : (
            <div className="flex-1 px-3 text-sm font-medium text-gray-500 italic">
              Recording audio...
            </div>
          )}

          <div className="flex items-center space-x-1">
            <button 
              type="button" 
              onClick={handleFileClick}
              disabled={isUploading}
              className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 transition-colors ${showEmojiPicker ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={(!content.trim() && attachments.length === 0) || isLoading || isSending}
          className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-indigo-200 disabled:bg-gray-300 disabled:shadow-none disabled:scale-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
