
import React from 'react';

interface QRCodeDisplayProps {
  value: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value }) => {
  // هنا نستخدم مكتبة خارجية لإنشاء QR، في هذا المثال سنصنع تمثيلاً بصرياً جمالياً
  // باستخدام SVG نظراً لأنها SPA كاملة الميزات.
  return (
    <div className="relative p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.05)]">
      <div className="w-48 h-48 bg-white flex items-center justify-center overflow-hidden">
        {/* Mock QR for visual purpose */}
        <svg viewBox="0 0 100 100" className="w-full h-full text-black">
          <rect x="10" y="10" width="20" height="20" fill="currentColor" />
          <rect x="70" y="10" width="20" height="20" fill="currentColor" />
          <rect x="10" y="70" width="20" height="20" fill="currentColor" />
          <rect x="40" y="40" width="20" height="20" fill="currentColor" />
          <rect x="35" y="10" width="5" height="5" fill="currentColor" />
          <rect x="50" y="20" width="10" height="10" fill="currentColor" />
          <rect x="70" y="40" width="15" height="15" fill="currentColor" />
          <rect x="40" y="70" width="10" height="20" fill="currentColor" />
          <rect x="80" y="80" width="10" height="10" fill="currentColor" />
          <rect x="15" y="15" width="10" height="10" fill="white" />
          <rect x="75" y="15" width="10" height="10" fill="white" />
          <rect x="15" y="75" width="10" height="10" fill="white" />
        </svg>
      </div>
      {/* Branding inside QR */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-orange-600 p-1.5 rounded-lg border-4 border-white shadow-xl">
           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99a7.99a 10.27L15 19l2.657-2.343z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
