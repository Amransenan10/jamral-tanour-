
import React, { useState, useEffect } from 'react';
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
  const pointsValue = user.points / config.pointsToRedeem1SAR;

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_phone', user.phone)
        .order('created_at', { ascending: false })
        .limit(10);

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
    };

    fetchHistory();
  }, [user.id, user.points]);

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
          <p className="text-sm font-black text-white">{config.pointsPerRiyal} نقطة / ريال</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">الاستبدال</p>
          <p className="text-sm font-black text-white">{config.pointsToRedeem1SAR} نقطة = 1 ريال</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
