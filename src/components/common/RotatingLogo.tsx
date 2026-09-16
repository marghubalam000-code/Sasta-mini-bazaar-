import React, { useState } from 'react';

interface RotatingLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  speedSec?: number; // duration of 1 full 360 rotation in seconds, default 2.2s
  showGlow?: boolean;
}

const sizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const innerImgSizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

// Sasta Mini Bazaar Vector Fallback in case of image load delay
const VectorLogo: React.FC<{ sizeClass: string }> = ({ sizeClass }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${sizeClass} drop-shadow-sm`}
  >
    {/* Fresh green leaves emerging from cart */}
    <path d="M25 15C25 15 29 7 37 9C37 9 39 17 31 18C27.5 18.4 25 15 25 15Z" fill="#16A34A" />
    <path d="M33 15C33 15 39 6 47 10C47 10 47 18 39 18C36 18 33 15 33 15Z" fill="#22C55E" />
    <path d="M28 20C28 20 22 14 23 7C23 7 31 7 32 15C32 17 28 20 28 20Z" fill="#15803D" />
    {/* Golden Yellow Shopping Cart Basket */}
    <path
      d="M10 18H16L22 42H50L56 22H20"
      stroke="#F59E0B"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M25 27H52M27 34H47M30 22V40M38 22V40M46 22V40"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Cart Wheels */}
    <circle cx="26" cy="49" r="4" fill="#F59E0B" />
    <circle cx="46" cy="49" r="4" fill="#F59E0B" />
  </svg>
);

export const RotatingLogo: React.FC<RotatingLogoProps> = ({
  size = 'md',
  className = '',
  speedSec = 2.2,
  showGlow = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = sizeMap[size] || sizeMap.md;
  const imgClass = innerImgSizeMap[size] || innerImgSizeMap.md;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Optional ambient warm aura ring */}
      {showGlow && (
        <div 
          className="absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-amber-400/25 via-emerald-500/20 to-amber-300/25 blur-md animate-pulse pointer-events-none"
          aria-hidden="true" 
        />
      )}

      {/* Rotating container with continuous linear spin */}
      <div
        className={`${sizeClass} flex items-center justify-center shrink-0 origin-center`}
        style={{
          animation: `spin ${speedSec}s linear infinite`,
        }}
      >
        {!imgError ? (
          <img
            src="/logo.png"
            alt="Sasta Mini Bazaar Logo"
            className={`${imgClass} object-contain rounded-full select-none pointer-events-none drop-shadow-md`}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <VectorLogo sizeClass={sizeClass} />
        )}
      </div>
    </div>
  );
};
