import React from 'react';
import { User } from '../../types';
import Avatar from '../design/Avatar';
import Button from '../design/Button';
import { FiMessageSquare, FiVideo } from 'react-icons/fi';

interface ProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Side Panel (Slide-over) */}
      <aside className={`
        fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 
        bg-white border-l border-gray-100 shadow-2xl 
        transform transition-transform duration-500 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-white">
          {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-50">
            <h2 className="text-xl font-bold text-[#000000]">Contact Info</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-primary transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-10 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Avatar name={user.username} src={user.avatar} size="xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full" />
            </div>
            
            <h2 className="text-2xl font-bold text-[#000000] tracking-tight mb-1">{user.username}</h2>
            <p className="text-sm text-[#666666] font-medium mb-8">Junior Developer</p>

            <div className="grid grid-cols-2 gap-3 mb-10">
              <Button 
                className="!py-3.5 !text-sm !bg-indigo-50 !text-[#000000] border border-indigo-100 shadow-sm hover:!bg-indigo-100 transition-colors"
                icon={<FiMessageSquare className="text-primary" />}
              >
                Chat
              </Button>
              <Button 
                className="!py-3.5 !text-sm !bg-indigo-50 !text-[#000000] border border-indigo-100 shadow-sm hover:!bg-indigo-100 transition-colors"
                icon={<FiVideo className="text-primary" />}
              >
                Video Call
              </Button>
            </div>

            <div className="space-y-4 text-left">
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-all group">
                <span className="text-sm font-bold text-[#333333] group-hover:text-primary">View Friends</span>
                <svg className="h-4 w-4 text-[#666666] group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-all group">
                <span className="text-sm font-bold text-[#333333] group-hover:text-primary">Add to Favorites</span>
                <svg className="h-4 w-4 text-[#666666] group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-10 pb-10">
            <h3 className="text-sm font-bold text-[#333333] uppercase tracking-widest mb-6">Shared Media</h3>
            <div className="grid grid-cols-3 gap-3">
              {['PDF', 'Video', 'MP3', 'Image', 'DOC', 'ZIP'].map((type, i) => (
                <div key={i} className="aspect-square bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors group">
                  <span className="text-[10px] font-bold text-primary group-hover:scale-110 transition-transform">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ProfileModal;
