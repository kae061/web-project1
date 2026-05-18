import React from 'react';
import { User, Chat } from '../../types';
import Avatar from '../design/Avatar';
import Button from '../design/Button';

interface ProfileCardProps {
  user: User | null;
  chat: Chat | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, chat }) => {
  if (!user) return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center text-gray-400 border-l border-gray-200 bg-sidebar">
      <svg className="h-12 w-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <p className="text-sm font-medium">Select a user to view their profile details</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto custom-scrollbar">
      <div className="p-10 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <Avatar name={user.username} src={user.avatar} size="xl" />
          </div>
        </div>

        <h2 className="text-xl font-medium text-[#000000] tracking-tight">{user.username}</h2>
        <p className="text-sm text-[#666666] mb-8">Junior Developer</p>

        <div className="flex justify-center space-x-12 mb-10">
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#666666]">Chat</span>
          </div>

          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[#666666]">Video Call</span>
          </div>
        </div>

        <div className="space-y-4 text-left">
          <button className="w-full flex items-center space-x-3 py-2 text-[#666666] hover:text-[#000000] transition-all group bg-transparent border-none">
            <svg className="h-5 w-5 text-[#999999] group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium">View Friends</span>
          </button>

          <button className="w-full flex items-center space-x-3 py-2 text-[#666666] hover:text-[#000000] transition-all group bg-transparent border-none">
            <svg className="h-5 w-5 text-[#999999] group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">Add to Favorites</span>
          </button>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="px-10 pb-10">
        <h3 className="text-sm font-bold text-foreground mb-4">Attachments</h3>
        <div className="flex space-x-3">
          {['PDF', 'Video', 'MP3', 'Image'].map((type, i) => (
            <div key={i} className="flex-1 aspect-square bg-indigo-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-indigo-200 transition-colors">
              <span className="text-[10px] font-bold text-primary">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
