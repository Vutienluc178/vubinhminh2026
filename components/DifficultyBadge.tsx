import React from 'react';
import { Star } from 'lucide-react';

export const DifficultyBadge: React.FC<{ level: number }> = ({ level }) => {
  return (
    <div className="flex space-x-0.5" title={`Difficulty: ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={`${
            i <= level ? 'fill-yellow-400 text-yellow-500' : 'fill-slate-100 text-slate-300'
          }`}
        />
      ))}
    </div>
  );
};
