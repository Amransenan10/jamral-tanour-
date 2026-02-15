
import React from 'react';

interface QRCodeDisplayProps {
  value: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value }) => {
  // استخدام خدمة api.qrserver.com لإنشاء كود QR حقيقي ومرتبط برقم الجوال
  // لضمان الثبات والأمان وتسهيل المسح للكاشير
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`;

  return (
    <div className="relative p-6 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10 transition-transform hover:scale-105 duration-500">
      <div className="w-48 h-48 bg-white flex items-center justify-center overflow-hidden rounded-2xl relative">
        <img
          src={qrUrl}
          alt="رصيد الولاء - جمر التنور"
          className="w-40 h-40 object-contain"
        />

        {/* Zebra lines for aesthetic security feel */}
        <div className="absolute inset-0 border-2 border-orange-600/20 rounded-2xl pointer-events-none"></div>
      </div>

      {/* Branding inside QR Area */}
      <div className="mt-4 flex flex-col items-center">
        <div className="bg-orange-600 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-orange-900/30">
          JAMR AL-TANOUR
        </div>
      </div>
    </div>
  );
};


export default QRCodeDisplay;
