// components/Badge.jsx
import React from 'react';
import { ImageIcon, Video } from 'lucide-react';

const Badge = ({ type, name, active, className = '' }) => {
  const icons = {
    streamer: {
      '10k': '💰', '50k': '💎', '100k': '⭐', '500k': '🌟', '1jt': '👑'
    },
    donor: {
      '1x': '❤️', '5x': '💖', '10k': '💝', '50k': '💎', '100k': '⭐', '1jt': '👑'
    }
  };
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all ${className}`}>
      <span>{icons[type]?.[name] || '🏆'}</span>
      <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>
        {name.toUpperCase()}
      </span>
    </div>
  );
};

export default Badge;