import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const DuetRightLogo: React.FC<SvgIconProps & { size?: number; showText?: boolean }> = ({ 
  size = 40, 
  showText = false,
  ...props 
}) => {
  const viewBox = showText ? "0 0 800 200" : "0 0 200 200";
  const width = showText ? size * 4 : size;
  
  return (
    <SvgIcon
      {...props}
      viewBox={viewBox}
      sx={{
        width: width,
        height: size,
        filter: 'drop-shadow(0 2px 4px rgba(44, 43, 46, 0.2))',
        ...props.sx,
      }}
    >
      <defs>
        {/* Soft shadow filter to match the authentic logo */}
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="0" result="offset"/>
          <feFlood floodColor="#808080" floodOpacity="0.5"/>
          <feComposite in2="offset" operator="in"/>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      
      {/* Authentic DuetRight Logo - Exact Match */}
      <g filter="url(#softShadow)">
        {/* Icon only or with text based on showText prop */}
        <g transform={showText ? "translate(50, 100) scale(0.7)" : "translate(100, 100) scale(0.9)"}>
          
          {/* Hammer - diagonal from top-left to bottom-right */}
          <g fill="#000000">
            {/* Hammer handle */}
            <rect x="-70" y="-4" width="140" height="8" rx="4" transform="rotate(45)"/>
            
            {/* Hammer head at top-left */}
            <g transform="rotate(45) translate(-65, 0)">
              {/* Main hammer head body */}
              <rect x="-8" y="-12" width="16" height="20" rx="2"/>
              {/* Striking face (right side) */}
              <rect x="8" y="-8" width="6" height="12" rx="1"/>
              {/* Claw (left side - curved prongs) */}
              <path d="M-8 -8 Q-16 -12 -20 -6 Q-18 -2 -12 -4 M-8 -4 Q-16 0 -20 -6 Q-18 -10 -12 -8 M-8 4 Q-16 8 -20 2 Q-18 -2 -12 0 M-8 8 Q-16 12 -20 6 Q-18 2 -12 4"/>
            </g>
          </g>
          
          {/* Wrench - diagonal from bottom-left to top-right, crossing hammer */}
          <g fill="#000000">
            {/* Wrench handle */}
            <rect x="-70" y="-4" width="140" height="8" rx="4" transform="rotate(-45)"/>
            
            {/* Wrench head at top-right */}
            <g transform="rotate(-45) translate(-65, 0)">
              {/* Wrench body */}
              <rect x="-8" y="-10" width="16" height="16" rx="2"/>
              {/* Adjustable jaw opening */}
              <path d="M8 -6 L14 -6 Q16 -4 16 0 Q16 4 14 6 L8 6 L8 2 L12 2 Q13 1 13 0 Q13 -1 12 -2 L8 -2 Z"/>
            </g>
            
            {/* Small hole at bottom-left for hanging */}
            <g transform="rotate(-45) translate(55, 0)">
              <circle cx="0" cy="0" r="4" fill="none" stroke="#000000" strokeWidth="2"/>
            </g>
          </g>
        </g>
        
        {/* DuetRight Text (only if showText is true) */}
        {showText && (
          <text 
            x="220" 
            y="120" 
            fontSize="72" 
            fontFamily="Arial, sans-serif" 
            fontWeight="bold"
            fill="currentColor"
            letterSpacing="1"
          >
            DuetRight
          </text>
        )}
      </g>
    </SvgIcon>
  );
};

export default DuetRightLogo;