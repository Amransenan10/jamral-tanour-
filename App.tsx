
import React, { useState, useEffect } from 'react';
import { User, UserRole, LoyaltyConfig } from './types';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import CashierDashboard from './components/CashierDashboard';
import AdminDashboard from './components/AdminDashboard';
import Layout from './components/Layout';
import { supabase } from './supabaseClient';
import { LOYALTY_CONFIG as INITIAL_CONFIG } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<LoyaltyConfig>({
    pointsPerRiyal: INITIAL_CONFIG.POINTS_PER_RIYAL,
    pointsToRedeem1SAR: INITIAL_CONFIG.POINTS_TO_REDEEM_1_SAR
  });


  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*');

        if (error) {
          console.warn("Settings table might be missing:", error.message);
        }

        if (data) {
          const pointsPerRiyal = data.find(s => s.key === 'points_per_riyal')?.value || INITIAL_CONFIG.POINTS_PER_RIYAL;
          const pointsToRedeem = data.find(s => s.key === 'points_to_redeem_1sar')?.value || INITIAL_CONFIG.POINTS_TO_REDEEM_1_SAR;
          setConfig({ pointsPerRiyal, pointsToRedeem1SAR: pointsToRedeem });
        }
      } catch (err: any) {
        console.error("Initialization Error:", err);
      }
    };
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig: LoyaltyConfig) => {
    try {
      setConfig(newConfig);
      await supabase.from('settings').upsert([
        { key: 'points_per_riyal', value: newConfig.pointsPerRiyal },
        { key: 'points_to_redeem_1sar', value: newConfig.pointsToRedeem1SAR }
      ]);
    } catch (err: any) {
      alert("فشل تحديث الإعدادات: " + err.message);
    }
  };

  const handleLogin = (identifier: string, role: UserRole, data: User) => {
    setUser(data);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black text-orange-500">حدث خطأ في النظام</h1>
          <p className="text-zinc-400">{initError}</p>
          <button onClick={() => window.location.reload()} className="bg-orange-600 px-6 py-2 rounded-xl">إعادة التحميل</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} loading={loading} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {user.role === 'CUSTOMER' && <CustomerDashboard user={user} config={config} />}
      {user.role === 'CASHIER' && <CashierDashboard cashier={user} config={config} />}
      {user.role === 'ADMIN' && <AdminDashboard admin={user} config={config} onUpdateConfig={updateConfig} />}
    </Layout>

  );
};


export default App;
