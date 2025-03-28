import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

const DesktopRestriction = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Check both width and user agent to ensure mobile devices
      const isMobileWidth = window.innerWidth <= 768;
      const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileWidth && isMobileDevice);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white p-8 z-[9999]">
      <div className="max-w-md text-center">
        <div className="bg-white/10 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center backdrop-blur-lg">
          <Smartphone className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Mobile Only Experience</h1>
        
        <p className="text-lg mb-6">
          Hireyth is exclusively designed for mobile devices. Please access this site on your smartphone.
        </p>
        
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-xl font-semibold mb-2">Access on Mobile</h2>
          <p className="text-base opacity-80">
            Scan the QR code below with your mobile device to access Hireyth.
          </p>
          
          <div className="mt-4 bg-white p-3 rounded-lg inline-block">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://hireyth.com" 
              alt="QR Code to Access Hireyth" 
              className="w-36 h-36"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopRestriction; 