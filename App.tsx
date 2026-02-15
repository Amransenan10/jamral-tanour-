
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Supabase URL Configured:", !!import.meta.env.VITE_SUPABASE_URL);
    console.log("Supabase Key Configured:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  }, []);

  const [config, setConfig] = useState<LoyaltyConfig>({
    pointsPerRiyal: INITIAL_CONFIG.POINTS_PER_RIYAL,
    pointsToRedeem1SAR: INITIAL_CONFIG.POINTS_TO_REDEEM_1_SAR
  });

  // جلب إعدادات الولاء من Supabase
  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (data && !error) {
        const pointsPerRiyal = data.find(s => s.key === 'points_per_riyal')?.value || INITIAL_CONFIG.POINTS_PER_RIYAL;
        const pointsToRedeem = data.find(s => s.key === 'points_to_redeem_1sar')?.value || INITIAL_CONFIG.POINTS_TO_REDEEM_1_SAR;
        setConfig({ pointsPerRiyal, pointsToRedeem1SAR: pointsToRedeem });
      }
    };
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig: LoyaltyConfig) => {
    setConfig(newConfig);
    // تحديث في Supabase
    await supabase.from('settings').upsert([
      { key: 'points_per_riyal', value: newConfig.pointsPerRiyal },
      { key: 'points_to_redeem_1sar', value: newConfig.pointsToRedeem1SAR }
    ]);
  };

  const handleLogin = (identifier: string, role: UserRole, data: User) => {
    setUser(data);
  };

  const handleLogout = () => {
    setUser(null);
  };

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
