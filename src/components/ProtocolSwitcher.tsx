import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProtocolConfig, switchToHttps, switchToHttp, shouldUseHttps } from '@/utils/protocol';

interface ProtocolSwitcherProps {
  className?: string;
}

export const ProtocolSwitcher: React.FC<ProtocolSwitcherProps> = ({ className }) => {
  const [protocolConfig, setProtocolConfig] = useState(getProtocolConfig());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 監聽 URL 變化
    const handleUrlChange = () => {
      setProtocolConfig(getProtocolConfig());
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const handleSwitchToHttps = async () => {
    setIsLoading(true);
    try {
      switchToHttps();
    } catch (error) {
      console.error('切換到 HTTPS 失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToHttp = async () => {
    setIsLoading(true);
    try {
      switchToHttp();
    } catch (error) {
      console.error('切換到 HTTP 失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProtocolBadgeVariant = (isHttps: boolean) => {
    return isHttps ? 'default' : 'secondary';
  };

  const getProtocolColor = (isHttps: boolean) => {
    return isHttps ? 'text-green-600' : 'text-orange-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          協議設定
          <Badge variant={getProtocolBadgeVariant(protocolConfig.isHttps)}>
            {protocolConfig.currentProtocol.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          當前使用 {protocolConfig.isHttps ? 'HTTPS' : 'HTTP'} 協議連接 API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getProtocolColor(protocolConfig.isHttps)}`}>
              {protocolConfig.isHttps ? '🔒' : '🔓'}
            </div>
            <p className="text-sm text-muted-foreground">
              {protocolConfig.isHttps ? '安全連接' : '非安全連接'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {protocolConfig.autoDetection ? '🔄' : '⚙️'}
            </div>
            <p className="text-sm text-muted-foreground">
              {protocolConfig.autoDetection ? '自動檢測' : '手動設定'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>強制 HTTPS:</span>
            <Badge variant={protocolConfig.forceHttps ? 'default' : 'outline'}>
              {protocolConfig.forceHttps ? '啟用' : '停用'}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>自動檢測:</span>
            <Badge variant={protocolConfig.autoDetection ? 'default' : 'outline'}>
              {protocolConfig.autoDetection ? '啟用' : '停用'}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {!protocolConfig.isHttps && (
            <Button 
              onClick={handleSwitchToHttps}
              disabled={isLoading}
              className="flex-1"
              variant="default"
            >
              {isLoading ? '切換中...' : '切換到 HTTPS'}
            </Button>
          )}
          {protocolConfig.isHttps && !protocolConfig.forceHttps && (
            <Button 
              onClick={handleSwitchToHttp}
              disabled={isLoading}
              className="flex-1"
              variant="outline"
            >
              {isLoading ? '切換中...' : '切換到 HTTP'}
            </Button>
          )}
        </div>

        {protocolConfig.forceHttps && (
          <p className="text-xs text-muted-foreground text-center">
            已強制使用 HTTPS，無法切換到 HTTP
          </p>
        )}
      </CardContent>
    </Card>
  );
};



