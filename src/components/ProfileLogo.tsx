import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileLogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

const ProfileLogo: React.FC<ProfileLogoProps> = ({ 
  className = "", 
  size = 64, 
  alt = "Logo" 
}) => {
  const { accountType } = useAuth();

  const getLogoSource = () => {
    if (!accountType) {
      // 預設顯示 EUF logo
      return "/euf.png";
    }

    switch (accountType.type) {
      case 'entrust':
        return "/hua-nan-logo.png";
      case 'ubot':
        return "/ubot-logo.png";
      case 'masterlink':
        return "/masterlink.png";
      case 'esun':
        return "/esun.png";
      default:
        // 其他類型顯示 EUF logo
        return "/euf.png";
    }
  };

  const getAltText = () => {
    if (!accountType) {
      return "EUF Logo";
    }

    switch (accountType.type) {
      case 'entrust':
        return "華南永昌證券";
      case 'ubot':
        return "Ubot Logo";
      case 'masterlink':
        return "元富證券";
      case 'esun':
        return "玉山銀行";
      default:
        return "EUF Logo";
    }
  };

  return (
    <img
      src={getLogoSource()}
      alt={alt || getAltText()}
      className={`object-contain h-full w-auto ${className}`}
      loading="lazy"
    />
  );
};

export default ProfileLogo;
