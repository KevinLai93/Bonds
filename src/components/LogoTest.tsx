import React from 'react';
import ProfileLogo from './ProfileLogo';

const LogoTest: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold">Logo 測試</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">當前 Profile Type 的 Logo：</h3>
        <div className="border p-4 rounded-lg">
          <ProfileLogo size={100} />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">不同 Type 的 Logo 預覽：</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="border p-4 rounded-lg text-center">
            <h4 className="font-medium mb-2">entrust</h4>
            <div className="h-16 flex items-center justify-center">
              <img 
                src="/hua-nan-logo.png" 
                alt="華南永昌證券" 
                className="object-contain h-full w-auto"
              />
            </div>
          </div>
          
          <div className="border p-4 rounded-lg text-center">
            <h4 className="font-medium mb-2">ubot</h4>
            <div className="h-16 flex items-center justify-center">
              <img 
                src="/ubot-logo.png" 
                alt="Ubot Logo" 
                className="object-contain h-full w-auto"
              />
            </div>
          </div>
          
          <div className="border p-4 rounded-lg text-center">
            <h4 className="font-medium mb-2">其他 (EUF)</h4>
            <div className="h-16 flex items-center justify-center">
              <img 
                src="/euf.png" 
                alt="EUF Logo" 
                className="object-contain h-full w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoTest;
