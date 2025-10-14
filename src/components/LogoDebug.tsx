import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LogoDebug: React.FC = () => {
  const { user, accountType } = useAuth();

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">Logo 調試資訊</h3>
      <div className="text-sm space-y-1">
        <div><strong>用戶 ID:</strong> {user?.id}</div>
        <div><strong>用戶名稱:</strong> {user?.username}</div>
        <div><strong>帳號類型:</strong> {accountType?.type}</div>
        <div><strong>API Logo URL:</strong> {user?.logo_url || '無'}</div>
        <div><strong>localStorage 用戶資料:</strong></div>
        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
          {JSON.stringify(JSON.parse(localStorage.getItem('bonds_user') || '{}'), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default LogoDebug;
