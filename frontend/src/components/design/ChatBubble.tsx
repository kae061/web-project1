import React, { useState } from 'react';
import { Message } from '../../types';
import { format } from 'date-fns';
import AudioPlayer from '../design/AudioPlayer';
import ImageCarousel from '../design/ImageCarousel';

interface ChatBubbleProps {
  message: Message;
  isSender: boolean;
  onDelete?: (messageId: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isSender, onDelete }) => {
  const [showCarousel, setShowCarousel] = useState(false);
  const isRead = message.readBy.length > 0;
  const timestamp = new Date(message.createdAt);

  const images = message.mediaAttachments?.filter(m => m.type === 'image') || [];
  const videos = message.mediaAttachments?.filter(m => m.type === 'video') || [];
  const audios = message.mediaAttachments?.filter(m => m.type === 'audio') || [];
  const files = message.mediaAttachments?.filter(m => m.type === 'file') || [];

  return (
    <div className={`flex w-full mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {showCarousel && images.length > 0 && (
        <ImageCarousel images={images} onClose={() => setShowCarousel(false)} />
      )}

      <div className={`group relative max-w-[75%] md:max-w-[65%] px-5 py-3 rounded-[24px] transition-all duration-300 ${
        isSender 
          ? 'bg-blue-600 text-white rounded-br-none shadow-[0_0_20px_rgba(59,130,246,0.25)] border border-blue-400/20' 
          : 'glass-morphism text-zinc-100 rounded-bl-none'
      }`}>
        {/* Media Attachments */}
        <div className="space-y-3 mb-2">
          {images.length > 0 && (
            <div 
              className={`grid gap-1.5 cursor-pointer overflow-hidden rounded-2xl ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
              onClick={() => setShowCarousel(true)}
            >
              {images.map((img, i) => (
                <img key={i} src={img.url} className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500" alt="attachment" />
              ))}
            </div>
          )}


          {videos.map((vid, i) => (
            <video key={i} src={vid.url} controls className="w-full rounded-xl max-h-60 bg-black" />
          ))}

          {audios.map((aud, i) => (
            <AudioPlayer key={i} src={aud.url} />
          ))}

          {files.map((file, i) => (
            <a 
              key={i} 
              href={file.url} 
              target="_blank" 
              rel="noreferrer"
              className={`flex items-center p-3 rounded-xl border ${
                isSender ? 'bg-blue-700/50 border-blue-400/30' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-700'
              }`}
            >
              <svg className="h-8 w-8 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="flex-1 truncate">
                <p className="text-sm font-bold truncate">File Attachment</p>
                <p className="text-xs opacity-60">Click to download</p>
              </div>
            </a>
          ))}
        </div>

        {message.content && (
          <div className="text-[15px] leading-relaxed break-words mb-1">
            {message.content}
          </div>
        )}

        <div className={`flex items-center justify-end mt-1 space-x-1 text-[10px] ${
          isSender ? 'text-blue-100' : 'text-zinc-400'
        }`}>
          <span>{format(timestamp, 'HH:mm')}</span>
          {isSender && (
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {isRead && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 -ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
