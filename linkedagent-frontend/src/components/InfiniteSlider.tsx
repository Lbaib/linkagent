import React from 'react';

export const InfiniteSlider: React.FC<{ children: React.ReactNode, speed?: number, gap?: number }> = ({ children, speed = 40, gap = 40 }) => {
  return (
    <div className="relative overflow-hidden w-full flex select-none" style={{ gap: gap }}>
      <div className="flex shrink-0 min-w-full animate-marquee" style={{ gap: gap, animationDuration: `${speed}s` }}>
        {children}
      </div>
      <div className="flex shrink-0 min-w-full animate-marquee" style={{ gap: gap, animationDuration: `${speed}s` }}>
        {children}
      </div>
    </div>
  );
};
