
import React from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../constants';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        سجل العمليات الأخير
      </h3>

      {transactions.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-600 text-xs">لا توجد عمليات مسجلة بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center transition-all hover:border-zinc-700">
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'EARN' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {tx.type === 'EARN' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {tx.type === 'EARN' ? 'إضافة نقاط' : 'استبدال مكافأة'}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {new Date(tx.createdAt).toLocaleDateString('ar-SA')} - {new Date(tx.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${tx.type === 'EARN' ? 'text-green-500' : 'text-orange-500'}`}>
                  {tx.type === 'EARN' ? `+${tx.pointsEarned}` : `-${tx.pointsRedeemed}`}
                </p>
                <p className="text-[10px] text-zinc-600">{formatCurrency(tx.billAmount)}</p>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
