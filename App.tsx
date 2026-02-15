
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
    earning_rate: INITIAL_CONFIG.POINTS_PER_RIYAL,
    redemption_rate: INITIAL_CONFIG.POINTS_TO_REDEEM_1_SAR
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
          const earning_rate = data.find(s => s.key === 'earning_rate')?.value ?? INITIAL_CONFIG.POINTS_PER_RIYAL;
          const redemption_rate = data.find(s => s.key === 'redemption_rate')?.value ?? INITIAL_CONFIG.POINTS_TO_REDEEM_1_SAR;
          setConfig({ earning_rate, redemption_rate });
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
        { key: 'earning_rate', value: newConfig.earning_rate },
        { key: 'redemption_rate', value: newConfig.redemption_rate }
      ]);
    } catch (err: any) {
      alert("فشل تحديث الإعدادات: " + err.message);
    }
  };

  const handleLogin = (identifier: string, role: UserRole, data: User) => {
    console.log("App: handleLogin called with data:", data);
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
    console.log("App: No user found, rendering Login component");
    return <Login onLogin={handleLogin} loading={loading} />;
  }

  console.log("App: User found, rendering Dashboard with role:", user.role);
  return (
    <Layout user={user} onLogout={handleLogout}>
      {user.role === 'CUSTOMER' && <CustomerDashboard user={user} config={config} />}
      {user.role === 'CASHIER' && <CashierDashboard cashier={user} config={config} />}
      {user.role === 'ADMIN' && <AdminDashboard admin={user} config={config} onUpdateConfig={updateConfig} />}
    </Layout>

  );
};


export default App;
