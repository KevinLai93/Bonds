import React from 'react';

interface EUFLogoProps {
  className?: string;
  size?: number;
}

const EUFLogo: React.FC<EUFLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <img
      src="/lovable-uploads/122f525d-67c9-4323-9a97-583b7ffc2362.png"
      alt="EUF Logo"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
};

export default EUFLogo;