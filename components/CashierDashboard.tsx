
import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { User, Transaction, LoyaltyConfig } from '../types';
import { formatCurrency } from '../constants';
import { supabase } from '../supabaseClient';

interface CashierDashboardProps {
  cashier: User;
  config: LoyaltyConfig;
}

const CashierDashboard: React.FC<CashierDashboardProps> = ({ cashier, config }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [scannedUser, setScannedUser] = useState<User | null>(null);
  const [billAmount, setBillAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const successTimeoutRef = useRef<number | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    setIsScanning(true);
    setCameraError(null);

    // تأخير بسيط لضمان رندر الـ div
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // نجاح المسح
            handleLookup(decodedText);
            stopScanner();
          },
          () => {
            // فشل مسح الفريم (تجاهل)
          }
        );
      } catch (err: any) {
        console.error("Camera Error:", err);
        setCameraError(err.message || "فشل فتح الكاميرا. تأكد من إعطاء الصلاحيات.");
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Stop Error:", err);
      }
    } else {
      setIsScanning(false);
    }
  };

  const handleLookup = async (phone: string) => {
    if (!phone) return;
    setLookupLoading(true);
    setIsScanning(false);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phone)
        .maybeSingle();

      if (data) {
        setScannedUser({
          id: data.phone_number,
          phone: data.phone_number,
          name: data.full_name,
          role: 'CUSTOMER',
          points: data.points_balance || 0
        });

      } else {
        alert("هذا الرقم غير مسجل في نظام ولاء جمر التنور.");
      }
    } catch (err) {
      console.error("Lookup Error:", err);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAction = async (type: 'EARN' | 'REDEEM') => {
    if (!scannedUser || billAmount <= 0) return;
    setProcessing(true);

    const pointsToEarn = billAmount * config.pointsPerRiyal;
    const pointsToRedeem = billAmount * config.pointsToRedeem1SAR;

    if (type === 'REDEEM' && scannedUser.points < pointsToRedeem) {
      alert("عذراً، رصيد العميل غير كافٍ للاستبدال.");
      setProcessing(false);
      return;
    }

    const newPoints = type === 'EARN'
      ? scannedUser.points + pointsToEarn
      : scannedUser.points - pointsToRedeem;

    try {
      // 1. تحديث رصيد العميل
      const { error: updateError } = await supabase
        .from('customers')
        .update({ points_balance: newPoints })
        .eq('phone_number', scannedUser.phone);


      if (updateError) throw updateError;

      // 2. تسجيل العملية
      await supabase.from('transactions').insert([{
        customer_phone: scannedUser.phone,
        bill_amount: billAmount,
        points_earned: type === 'EARN' ? pointsToEarn : 0,
        points_redeemed: type === 'REDEEM' ? pointsToRedeem : 0,
        staff_id: cashier.id
      }]);


      setScannedUser({ ...scannedUser, points: newPoints });
      setSuccessMessage(type === 'EARN' ? `تمت إضافة ${pointsToEarn} نقطة بنجاح!` : `تم تطبيق الخصم: ${formatCurrency(billAmount)}`);

      successTimeoutRef.current = window.setTimeout(() => {
        setScannedUser(null);
        setBillAmount(0);
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error("Action Error:", err);
      alert("فشلت العملية. يرجى التحقق من الاتصال.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-lg font-black flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          بوابة الكاشير الذكية
        </h2>
      </div>

      {!scannedUser ? (
        <div className="space-y-6">
          <div className={`relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center min-h-[400px] ${isScanning ? 'border-orange-500 bg-black' : 'border-zinc-800 border-dashed bg-zinc-900/30'}`}>
            {isScanning ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                <div id="reader" className="w-full h-full"></div>

                {/* Overlay layer */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-0 bg-transparent rounded-2xl ring-[2000px] ring-black/60 shadow-inner"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-orange-500 rounded-3xl z-30">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-orange-500 -ml-1 -mt-1 rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-orange-500 -mr-1 -mt-1 rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-orange-500 -ml-1 -mb-1 rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-orange-500 -mr-1 -mb-1 rounded-br-2xl"></div>
                    <div className="absolute top-0 left-2 right-2 h-[2px] bg-orange-500 animate-scan opacity-80 shadow-[0_0_20px_rgba(234,88,12,1)]"></div>
                  </div>
                </div>

                <p className="absolute bottom-24 z-30 text-white font-bold bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">ضع كود الـ QR داخل الإطار</p>
                <button
                  onClick={stopScanner}
                  className="absolute bottom-8 z-30 bg-black/60 text-white px-8 py-3 rounded-2xl hover:bg-black/80 transition-all font-bold"
                >
                  إلغاء المسح
                </button>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h3m-3 0H9m11-3a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h11a2 2 0 002-2v-5z" /></svg>
                </div>
                {cameraError && (
                  <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-2xl text-red-500 text-sm font-bold">
                    {cameraError}
                  </div>
                )}
                <button onClick={startScanner} className="bg-orange-600 hover:bg-orange-500 text-white font-black px-10 py-4 rounded-2xl shadow-lg transition-all active:scale-95">فتح الكاميرا للمسح</button>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] space-y-4 shadow-xl">
            <p className="text-xs font-bold text-zinc-500 text-center uppercase tracking-widest">أو البحث برقم الجوال</p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="05xxxxxxxx"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-center font-bold text-lg"
              />
              <button
                onClick={() => handleLookup(manualPhone)}
                disabled={lookupLoading}
                className="bg-zinc-800 px-6 rounded-xl font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {lookupLoading ? '...' : 'بحث'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 text-orange-500 font-black text-xl shadow-inner">
                  {scannedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-bold">{scannedUser.name}</h3>
                  <p className="text-zinc-500 text-[10px] font-mono tracking-widest">{scannedUser.phone}</p>
                </div>
              </div>
              <button onClick={() => setScannedUser(null)} className="p-2 text-zinc-600 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
                <p className="text-[10px] text-zinc-500 font-black mb-1">رصيد النقاط</p>
                <p className="text-2xl font-black text-white">{scannedUser.points}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
                <p className="text-[10px] text-zinc-500 font-black mb-1">القيمة الحالية</p>
                <p className="text-2xl font-black text-orange-500">{formatCurrency(scannedUser.points / config.pointsToRedeem1SAR)}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 shadow-2xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">مبلغ الفاتورة (ريال)</label>
              <input
                type="number"
                value={billAmount || ''}
                onChange={(e) => setBillAmount(parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-6 text-4xl font-black text-orange-500 focus:outline-none focus:border-orange-500/50 text-center transition-all shadow-inner"
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleAction('EARN')}
                disabled={processing || billAmount <= 0}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-5 rounded-2xl border border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
              >
                إضافة نقاط ({Math.round(billAmount * config.pointsPerRiyal || 0)})
              </button>
              <button
                onClick={() => handleAction('REDEEM')}
                disabled={processing || billAmount <= 0 || scannedUser.points < (billAmount * config.pointsToRedeem1SAR)}
                className="bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-900/30 transition-all active:scale-95 disabled:opacity-50"
              >
                استبدال وخصم ({Math.round(billAmount * config.pointsToRedeem1SAR || 0)} نقطة)
              </button>
            </div>
          </div>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-orange-500 font-bold animate-pulse">جاري تحديث السحابة...</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-10 inset-x-4 bg-green-600 text-white p-6 rounded-[2rem] shadow-[0_0_50px_rgba(22,163,74,0.4)] text-center font-black animate-in slide-in-from-top-10 z-[100] flex items-center justify-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
