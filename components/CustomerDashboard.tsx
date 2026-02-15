
import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction, LoyaltyConfig } from '../types';
import { formatCurrency } from '../constants';
import QRCodeDisplay from './QRCodeDisplay';
import TransactionHistory from './TransactionHistory';
import { supabase } from '../supabaseClient';

interface CustomerDashboardProps {
  user: User;
  config: LoyaltyConfig;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, config }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPointsRef = useRef(user.points);

  const pointsValue = config.redemption_rate > 0 ? user.points / config.redemption_rate : 0;

  useEffect(() => {
    const fetchHistory = async () => {
      console.log("CustomerDashboard: Starting to fetch transactions for:", user.phone);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('customer_phone', user.phone)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log("CustomerDashboard: Transactions fetch result:", data, "Error:", error);
        if (data) {
          setTransactions(data.map(t => ({
            id: t.id,
            customerPhone: t.customer_phone,
            billAmount: t.bill_amount,
            pointsEarned: t.points_earned,
            pointsRedeemed: t.points_redeemed,
            type: t.points_earned > 0 ? 'EARN' : 'REDEEM',
            createdAt: t.created_at,
            staffId: t.staff_id
          })));
        }
      } catch (err) {
        console.error("CustomerDashboard: Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // نظام الإشعارات عند تغير النقاط
    if (user.points !== lastPointsRef.current) {
      const diff = user.points - lastPointsRef.current;
      if (diff > 0) {
        setToast({ message: `تم إضافة ${diff} نقطة لرصيدك بنجاح! 🎊`, type: 'success' });
      } else if (diff < 0) {
        setToast({ message: `تم استبدال ${Math.abs(diff)} نقطة، رصيدك الحالي هو ${user.points} 🎁`, type: 'info' });
      }
      lastPointsRef.current = user.points;

      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [user.id, user.points]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">جاري تحميل بياناتك...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black p-10 rounded-[3rem] border border-zinc-800 shadow-2xl">
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-zinc-500 font-black text-xs uppercase tracking-widest mb-2">رصيد نقاطك</p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black text-white">{user.points}</span>
            <span className="text-orange-500 font-black">نقطة</span>
          </div>
          <div className="mt-8 w-full bg-zinc-800/30 rounded-2xl p-5 border border-zinc-700/50 backdrop-blur-md">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">القيمة المتاحة للخصم</p>
            <p className="text-3xl font-black text-orange-500">{formatCurrency(pointsValue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-[3rem] p-10 border border-zinc-800 flex flex-col items-center gap-6">
        <div className="text-center">
          <h3 className="text-sm font-black text-white mb-1">هويتك الرقمية</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">امسح الكود عند الدفع</p>
        </div>
        <QRCodeDisplay value={user.phone} />
      </div>

      <TransactionHistory transactions={transactions} />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">الربح</p>
          <p className="text-sm font-black text-white">{config.earning_rate} نقطة / ريال</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">الاستبدال</p>
          <p className="text-sm font-black text-white">{config.redemption_rate} نقطة = 1 ريال</p>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-10 inset-x-4 p-6 rounded-[2rem] shadow-2xl text-center font-black animate-in slide-in-from-top-10 z-[100] flex items-center justify-center gap-3 border ${toast.type === 'success' ? 'bg-green-600 border-green-400' : 'bg-orange-600 border-orange-400'
          }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
