import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'dnd';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  status, 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-zinc-500',
    away: 'bg-amber-500',
    dnd: 'bg-red-500',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-2xl object-cover border border-primary/20 shadow-lg transition-transform duration-300 hover:scale-105`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg border border-primary/30`}>
          {initials}
        </div>
      )}
      
      {status && (
        <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 ${statusColors[status]} border-[3px] border-card rounded-full shadow-lg ring-1 ring-white/10`} />
      )}
    </div>
  );
};

export default Avatar;
