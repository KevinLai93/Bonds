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
  const { accountType, user } = useAuth();

  const getLogoSource = () => {
    // 優先使用 API 回傳的 logo_url
    if (user?.logo_url) {
      return user.logo_url;
    }

    // 如果沒有 API logo_url，使用預設的硬編碼路徑（向後相容）
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
      case 'darwin':
        return "/euf.png"; // 達盈暫時使用 EUF logo，之後可以上傳專屬 logo
      default:
        // 其他類型顯示 EUF logo
        return "/euf.png";
    }
  };

  const getAltText = () => {
    // 如果有 API logo_url，使用用戶名稱作為 alt 文字
    if (user?.logo_url) {
      return `${user.name} Logo`;
    }

    // 使用預設的硬編碼 alt 文字（向後相容）
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
      case 'darwin':
        return "達盈 Logo";
      default:
        return "EUF Logo";
    }
  };

  return (
    <img
      src={getLogoSource()}
      alt={alt || getAltText()}
      className={`object-contain h-full w-auto ${className}`}
      loading="eager" // 改為 eager 確保立即載入
      crossOrigin="anonymous" // 允許跨域載入
      onLoad={(e) => {
        // 確保圖片載入完成
        const img = e.target as HTMLImageElement;
        if (img) {
          img.style.opacity = '1';
        }
      }}
      onError={(e) => {
        // 載入失敗時使用預設圖片
        const img = e.target as HTMLImageElement;
        if (img && img.src !== '/euf.png') {
          img.src = '/euf.png';
        }
      }}
      style={{ opacity: 0, transition: 'opacity 0.2s' }}
    />
  );
};

export default ProfileLogo;
