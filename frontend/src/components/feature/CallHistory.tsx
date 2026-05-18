import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface CallRecord {
  _id: string;
  callerId: { _id: string; username: string; avatar: string };
  recipientId: { _id: string; username: string; avatar: string };
  type: 'voice' | 'video';
  status: 'ended' | 'missed' | 'rejected';
  duration: number;
  createdAt: string;
}

const CallHistory: React.FC = () => {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:3333/api/calls/history', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const result = await response.json();
        if (result.success) setHistory(result.data);
      } catch (error) {
        console.error('Failed to fetch call history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Call History</h2>
      
      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="text-zinc-500 text-center py-10">No recent calls found.</p>
        ) : (
          history.map((call) => (
            <div 
              key={call._id}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={call.recipientId?.avatar || `https://ui-avatars.com/api/?name=${call.recipientId?.username}`} 
                    className="w-12 h-12 rounded-full object-cover" 
                    alt="avatar" 
                  />
                  <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${call.type === 'video' ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
                    {call.type === 'video' ? (
                      <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                    ) : (
                      <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {call.recipientId?.username || 'Unknown User'}
                  </h3>
                  <div className="flex items-center text-xs text-zinc-500 space-x-2">
                    <span>{format(new Date(call.createdAt), 'MMM d, HH:mm')}</span>
                    <span>•</span>
                    <span className={call.status === 'missed' ? 'text-red-500' : ''}>
                      {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {call.status === 'ended' ? formatDuration(call.duration) : '--'}
                </p>
                <button className="text-blue-500 text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Call Back
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CallHistory;
