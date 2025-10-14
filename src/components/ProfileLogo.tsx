import React, { useState, useEffect } from 'react';
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
  const [logoKey, setLogoKey] = useState(0);

  // 當用戶或帳號類型改變時，強制重新載入 Logo
  useEffect(() => {
    console.log('ProfileLogo: 用戶或帳號類型改變，重新載入 Logo', {
      userId: user?.id,
      logo_url: user?.logo_url,
      accountType: accountType?.type
    });
    setLogoKey(prev => prev + 1);
  }, [user?.id, user?.logo_url, accountType?.type]);

  const getLogoSource = () => {
    // 優先使用 API 回傳的 logo_url
    if (user?.logo_url) {
      // 添加時間戳防止快取
      const timestamp = new Date().getTime();
      return `${user.logo_url}?t=${timestamp}`;
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
      key={logoKey} // 使用 key 強制重新渲染
      src={getLogoSource()}
      alt={alt || getAltText()}
      className={`object-contain h-full w-auto ${className}`}
      loading="eager" // 改為 eager 確保立即載入
      crossOrigin="anonymous" // 重新啟用，配合 html2canvas 使用
      onLoad={(e) => {
        // 確保圖片載入完成
        const img = e.target as HTMLImageElement;
        console.log('ProfileLogo: 圖片載入成功:', img.src);
        if (img) {
          img.style.opacity = '1';
        }
      }}
      onError={(e) => {
        // 載入失敗時使用預設圖片
        const img = e.target as HTMLImageElement;
        console.error('ProfileLogo: 圖片載入失敗:', img.src);
        if (img && img.src !== '/euf.png') {
          console.log('ProfileLogo: 切換到預設圖片');
          img.src = '/euf.png';
        }
      }}
      style={{ opacity: 0, transition: 'opacity 0.2s' }}
    />
  );
};

export default ProfileLogo;
