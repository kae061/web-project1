import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../design/Avatar';

interface ProfileEditProps {
  onClose: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ onClose }) => {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState(user?.status || 'offline');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. If there's a new file, upload it first
      let finalAvatarUrl = user?.avatar;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadRes = await fetch('http://localhost:3333/api/users/me/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('kaeapp_token')}`,
          },
          body: formData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          finalAvatarUrl = uploadResult.data.avatar;
        } else {
          throw new Error(uploadResult.message || 'Avatar upload failed');
        }
      }

      // 2. Save profile info
      const response = await fetch('http://localhost:3333/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kaeapp_token')}`,
        },
        body: JSON.stringify({ username, bio, status, avatar: finalAvatarUrl }),
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.data);
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.click()}>
                <Avatar 
                  src={previewUrl || user?.avatar} 
                  name={user?.username || ''} 
                  size="xl" 
                  className="w-32 h-32 border-4 border-zinc-800"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <input 
                id="avatar-input"
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <button type="button" onClick={() => document.getElementById('avatar-input')?.click()} className="mt-3 text-sm font-medium text-blue-500 hover:text-blue-400">
                {selectedFile ? 'Change Selection' : 'Upload New Photo'}
              </button>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                placeholder="Your username"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none h-24"
                placeholder="Tell us about yourself..."
                maxLength={200}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="away">Away</option>
                <option value="dnd">Do Not Disturb</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm">
                Profile updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={`w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
