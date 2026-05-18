import React from 'react';
import { format } from 'date-fns';
import { Message, User } from '../../types';
import Avatar from '../design/Avatar';
import { FiTrash2, FiSmile, FiCornerUpRight, FiCopy, FiEdit3, FiPlay, FiPause, FiMic } from 'react-icons/fi';

const BACKEND_URL = 'http://localhost:3333';

const getFileUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${BACKEND_URL}${url}`;
  return url;
};

// ── Inline Audio Player ──────────────────────────────────────────────────────
const AudioPlayer: React.FC<{ url: string; duration?: number; isSender: boolean }> = ({ url, duration, isSender }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [totalDuration, setTotalDuration] = React.useState(duration || 0);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg px-[12px] py-[10px] min-w-[260px] ${isSender ? 'bg-blue-500' : 'bg-gray-200'}`}>
      <audio ref={audioRef} src={getFileUrl(url)} preload="metadata" />
      
      {/* Microphone Icon */}
      <div className={`flex-shrink-0 ${isSender ? 'text-white' : 'text-gray-600'}`}>
        <FiMic size={20} />
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`flex-shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all ${isSender ? 'bg-white text-blue-500 hover:bg-white/90' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
      >
        {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} className="ml-0.5" />}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center">
        <div
          className={`w-full h-[3px] rounded-full cursor-pointer overflow-hidden ${isSender ? 'bg-white/30' : 'bg-gray-300'}`}
          onClick={handleSeek}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ${isSender ? 'bg-white' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Time */}
      <div className={`flex items-center space-x-1 text-[12px] font-medium flex-shrink-0 ${isSender ? 'text-white/90' : 'text-gray-500'}`}>
        <span>{fmt(currentTime)}</span>
        <span className="opacity-50">/</span>
        <span>{fmt(totalDuration)}</span>
      </div>
    </div>
  );
};

interface ChatBubbleProps {
  message: Message;
  isSender: boolean;
  showAvatar?: boolean;
  onDelete?: (id: string, mode: 'me' | 'everyone') => void;
  onEdit?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  currentUserId: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isSender, 
  showAvatar, 
  onDelete, 
  onEdit, 
  onForward, 
  onReact,
  onReply,
  currentUserId
}) => {
  const sender = typeof message.senderId === 'string' ? null : message.senderId;
  const replyTo = typeof message.replyTo === 'object' ? (message.replyTo as Message) : null;
  const replySender = replyTo && typeof replyTo.senderId === 'object' ? (replyTo.senderId as User) : null;
  
  const timestamp = new Date(message.createdAt);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`flex w-full mb-1 animate-fade-in ${isSender ? 'justify-end' : 'justify-start'}`}>
      {!isSender && (
        <div className="w-10 mr-2 flex-shrink-0">
          {showAvatar && (
            <Avatar
              name={sender?.username || 'U'}
              src={sender?.avatar}
              size="sm"
              className="mt-1"
            />
          )}
        </div>
      )}

      <div className={`group relative max-w-[65%] flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-2.5 shadow-sm transition-all relative
          ${isSender
            ? 'bg-primary rounded-2xl rounded-tr-sm'
            : 'bg-gray-100 rounded-2xl rounded-tl-sm'}
          ${message.isDeleted ? 'opacity-50 italic' : ''}
        `}>
          {message.isDeleted ? (
            <p className="text-sm text-gray-500">This message was deleted</p>
          ) : message.deletedFor?.includes(currentUserId) ? (
            <p className="text-sm text-gray-500">You deleted this message</p>
          ) : (
            <>
              {replyTo && (
                <div className="mb-2 p-2 bg-black/5 rounded border-l-4 border-primary/50 text-xs">
                  <p className="font-bold text-primary mb-1">{replySender?.username || 'User'}</p>
                  <p className="line-clamp-1 opacity-70">{replyTo.content || (replyTo.mediaAttachments?.length ? 'Media' : 'Message')}</p>
                </div>
              )}
              {message.content && (
                <p 
                  className="text-base leading-relaxed mb-2"
                  style={{ color: '#000000', fontWeight: 'bold' }}
                >
                  {message.content}
                </p>
              )}

              {message.mediaAttachments && message.mediaAttachments.map((att, i) => (
                <div key={i} className="mt-1 rounded-xl overflow-hidden">
                  {att.type === 'image' && (
                    <img src={getFileUrl(att.url)} alt="attachment" className="max-w-full rounded-lg shadow-sm" />
                  )}
                  {att.type === 'audio' && (
                    <AudioPlayer url={getFileUrl(att.url)} duration={att.duration} isSender={isSender} />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Reactions & Add Reaction Button */}
        <div className={`flex flex-wrap items-center gap-1 mt-1 relative ${!message.reactions?.length ? 'min-h-[24px]' : ''}`}>
          {message.reactions?.map((r, i) => (
            <div key={i} className="flex items-center bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm text-[10px] cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onReact?.(message._id, r.emoji)}
            >
              <span className="mr-1">{r.emoji}</span>
              <span className="font-bold text-primary">{r.users.length}</span>
            </div>
          ))}
          
          <div className={`relative ${showEmojiPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center justify-center w-6 h-6 bg-white border border-gray-100 rounded-full shadow-sm text-[12px] hover:bg-gray-50 transition-colors"
              title="Add Reaction"
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className={`absolute ${isSender ? 'right-0' : 'left-0'} bottom-full mb-1 flex items-center space-x-1 p-1 bg-white border border-gray-100 rounded-full shadow-lg z-20 animate-in fade-in slide-in-from-bottom-1`}>
                {emojis.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => {
                      onReact?.(message._id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform p-1 text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-[#666666] font-bold uppercase">
            {format(timestamp, 'HH:mm')}
          </span>
          {isSender && (
            <div className="ml-1.5 flex text-primary">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
              <svg className="h-3 w-3 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className={`
          absolute top-1 flex items-center space-x-1 p-1 bg-white border border-gray-100 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10
          ${isSender ? '-left-[150px]' : '-right-[150px]'}
        `}>
          <button onClick={() => onReply?.(message)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors" title="Reply">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button onClick={() => onForward?.(message)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors" title="Forward">
            <FiCornerUpRight size={14} />
          </button>
          <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors" title="Copy">
            <FiCopy size={14} />
          </button>
          {isSender && (
            <>
              <button onClick={() => onEdit?.(message)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors" title="Edit">
                <FiEdit3 size={14} />
              </button>
              <button onClick={() => onDelete?.(message._id, 'everyone')} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete for everyone">
                <FiTrash2 size={14} className="text-red-600" />
              </button>
            </>
          )}
          <button onClick={() => onDelete?.(message._id, 'me')} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete for me">
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {isSender && (
        <div className="w-8 ml-2 flex-shrink-0 flex items-end">
          {showAvatar && (
            <Avatar
              name={sender?.username || 'U'}
              src={sender?.avatar}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
