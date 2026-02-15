
import React, { useState, useEffect } from 'react';
import { User, LoyaltyConfig } from '../types';
import { formatCurrency } from '../constants';
import { supabase } from '../supabaseClient';

interface AdminDashboardProps {
  admin: User;
  config: LoyaltyConfig;
  onUpdateConfig: (newConfig: LoyaltyConfig) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, config, onUpdateConfig }) => {
  const [editingConfig, setEditingConfig] = useState(config);
  const [stats, setStats] = useState({ totalPoints: 0, totalCustomers: 0, weeklyActivity: [0, 0, 0, 0, 0, 0, 0] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        // 1. حساب إجمالي عدد العملاء (Count)
        const { count: customerCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        // 2. حساب إجمالي النقاط الموزعة (Sum)
        const { data: pointsData } = await supabase
          .from('customers')
          .select('points_balance');
        
        const totalPoints = pointsData?.reduce((acc, curr) => acc + (curr.points_balance || 0), 0) || 0;

        // 3. جلب نشاط آخر 7 أيام (Weekly Activity)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: txData } = await supabase
          .from('transactions')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString());

        // توزيع العمليات على أيام الأسبوع
        const activity = [0, 0, 0, 0, 0, 0, 0];
        txData?.forEach(tx => {
          const day = new Date(tx.created_at).getDay();
          // ترتيب الأيام لتبدأ من الأحد (0) إلى السبت (6)
          activity[day]++;
        });

        // تطبيع البيانات للرسم (أعلى يوم هو 100%)
        const max = Math.max(...activity, 1);
        const normalizedActivity = activity.map(count => (count / max) * 100);

        setStats({
          totalCustomers: customerCount || 0,
          totalPoints: totalPoints,
          weeklyActivity: normalizedActivity
        });
      } catch (err) {
        console.error("Stats Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLiveStats();
  }, []);

  const handleSave = async () => {
    await onUpdateConfig(editingConfig);
    alert("تم تحديث الإعدادات السحابية بنجاح لمطعم جمر التنور.");
  };

  const days = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-600/10 rounded-full blur-2xl group-hover:bg-orange-600/20 transition-all"></div>
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest relative z-10">إجمالي النقاط الموزعة</p>
          <p className="text-3xl font-black text-orange-500 relative z-10">
            {loading ? '...' : stats.totalPoints.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
          <p className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest relative z-10">إجمالي عدد العملاء</p>
          <p className="text-3xl font-black text-white relative z-10">
            {loading ? '...' : stats.totalCustomers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart: Weekly Activity */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8 text-center">نشاط العمليات خلال الأسبوع</h3>
        <div className="h-40 flex items-end justify-between gap-3 px-2">
          {stats.weeklyActivity.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
              <div className="w-full bg-zinc-800/50 rounded-xl relative h-full overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-600 to-orange-400 rounded-xl transition-all duration-1000 ease-out group-hover:from-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.3)]" 
                  style={{ height: `${h}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-zinc-600 font-bold group-hover:text-zinc-400 transition-colors">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loyalty Configuration */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
        <h3 className="text-lg font-black text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          </div>
          إعدادات قيمة النقاط
        </h3>
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">نقاط الربح (لكل 1 ريال دفع)</label>
            <input 
              type="number" value={editingConfig.pointsPerRiyal}
              onChange={(e) => setEditingConfig({...editingConfig, pointsPerRiyal: parseInt(e.target.value)})}
              className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 font-black text-2xl text-orange-500 focus:outline-none focus:border-orange-500/50 shadow-inner"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">نقاط الاستبدال (مقابل 1 ريال خصم)</label>
            <input 
              type="number" value={editingConfig.pointsToRedeem1SAR}
              onChange={(e) => setEditingConfig({...editingConfig, pointsToRedeem1SAR: parseInt(e.target.value)})}
              className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 font-black text-2xl text-orange-500 focus:outline-none focus:border-orange-500/50 shadow-inner"
            />
          </div>
        </div>
        <button 
          onClick={handleSave} 
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-orange-900/30 transition-all active:scale-95"
        >
          حفظ التغييرات السحابية
        </button>
      </div>

      <div className="bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800/50">
        <p className="text-xs text-zinc-500 leading-relaxed text-center italic">تنبيه: التعديلات في قيم النقاط تنطبق فوراً على كافة واجهات الكاشير والعملاء.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
