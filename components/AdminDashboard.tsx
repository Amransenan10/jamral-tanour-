
import React, { useState, useEffect, useMemo } from 'react';
import { User, LoyaltyConfig, Customer, Product } from '../types';
import { formatCurrency } from '../constants';
import { supabase } from '../supabaseClient';
import ProductModal from './ProductModal';
import {
  Users,
  Coins,
  UserMinus,
  TrendingUp,
  Calendar,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Upload,
  Settings,
  ArrowRight,
  Utensils,
  ChevronDown,
  ChevronUp,
  History,
  Bell
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDashboardProps {
  admin: User;
  config: LoyaltyConfig;
  onUpdateConfig: (newConfig: LoyaltyConfig) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, config, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'menu' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    customerGrowth: 0,
    totalPoints: 0,
    todayVisits: 0,
    idleCustomers: 0,
    weeklyRegistrations: [] as { date: string, count: number }[]
  });

  useEffect(() => {
    fetchInitialData();

    // Set up Real-time listeners
    const customerSubscription = supabase
      .channel('admin-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchInitialData();
      })
      .subscribe();

    const transactionsSubscription = supabase
      .channel('admin-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchInitialData();
      })
      .subscribe();

    const productsSubscription = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(customerSubscription);
      supabase.removeChannel(transactionsSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, []);

  const fetchInitialData = async () => {
    // We don't want to show the full-page loader on every refresh, only the first time
    if (customers.length === 0) setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchCustomers(),
      fetchProducts()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString();
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();

      // 1. Total Customers & Growth
      const { data: allCustomers } = await supabase.from('customers').select('created_at, points_balance');
      const totalCustomers = allCustomers?.length || 0;
      const totalPoints = allCustomers?.reduce((sum, c) => sum + (c.points_balance || 0), 0) || 0;

      const newThisWeek = allCustomers?.filter(c => new Date(c.created_at) >= new Date(sevenDaysAgo)).length || 0;
      const growth = totalCustomers > 0 ? (newThisWeek / totalCustomers) * 100 : 0;

      // 2. Today's Visits
      const { count: todayVisits } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // 3. Idle Customers
      const { data: lastTxs } = await supabase
        .from('transactions')
        .select('customer_phone, created_at')
        .order('created_at', { ascending: false });

      const lastTxMap = new Map();
      lastTxs?.forEach(tx => {
        if (!lastTxMap.has(tx.customer_phone)) {
          lastTxMap.set(tx.customer_phone, tx.created_at);
        }
      });

      let idleCount = 0;
      allCustomers?.forEach(customer => {
        const lastTxDate = lastTxMap.get(customer.phone_number) || customer.created_at;
        if (new Date(lastTxDate) < new Date(fifteenDaysAgo)) {
          idleCount++;
        }
      });

      // 4. Weekly Registration Chart
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = allCustomers?.filter(c => c.created_at.startsWith(dateStr)).length || 0;
        weeklyData.push({
          date: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
          count
        });
      }

      setStats({
        totalCustomers,
        customerGrowth: Math.round(growth),
        totalPoints,
        todayVisits: todayVisits || 0,
        idleCustomers: idleCount,
        weeklyRegistrations: weeklyData
      });

    } catch (err) {
      console.error("Fetch Stats Error:", err);
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone_number.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleSaveConfig = async () => {
    await onUpdateConfig(config);
    alert("تم تحديث الإعدادات السحابية بنجاح لمطعم جمر التنور.");
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف من المنيو؟')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-4 lg:p-8 font-['Cairo'] pb-24 lg:pb-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">لوحة التحكم</h1>
          <p className="text-zinc-500 text-sm font-bold opacity-80">أهلاً بك مجدداً في نظام جمر التنور</p>
        </div>

        <div className="flex bg-zinc-900/40 p-1.5 rounded-3xl border border-zinc-800/50 backdrop-blur-3xl shadow-2xl">
          {(['overview', 'customers', 'menu', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === tab
                  ? 'bg-orange-600 text-white shadow-2xl shadow-orange-900/50 scale-[1.02]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
            >
              {tab === 'overview' ? 'الإحصائيات' : tab === 'customers' ? 'العملاء' : tab === 'menu' ? 'المنيو' : 'الإعدادات'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-10"
          >
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard
                title="إجمالي العملاء"
                value={stats.totalCustomers.toLocaleString()}
                icon={<Users className="w-7 h-7" />}
                trend={`+${stats.customerGrowth}%`}
                color="blue"
              />
              <StatCard
                title="إجمالي النقاط"
                value={stats.totalPoints.toLocaleString()}
                icon={<Coins className="w-7 h-7" />}
                color="orange"
              />
              <StatCard
                title="زيارات اليوم"
                value={stats.todayVisits.toLocaleString()}
                icon={<Calendar className="w-7 h-7" />}
                color="emerald"
              />
              <StatCard
                title="عملاء خاملون"
                value={stats.idleCustomers.toLocaleString()}
                icon={<UserMinus className="w-7 h-7" />}
                color="rose"
                badge="15 يوم+"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Chart */}
              <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[40%] h-1 bg-gradient-to-l from-orange-600/50 to-transparent"></div>
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black flex items-center gap-4 text-white">
                    <div className="p-2.5 bg-orange-600/10 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    نمو قاعدة العملاء
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-black tracking-[0.2em] uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">نشاط 7 أيام</span>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.weeklyRegistrations}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="5 5" stroke="#18181b" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#3f3f46"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        reversed={true}
                        tick={{ fontWeight: '800', textTransform: 'uppercase' }}
                      />
                      <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: '800' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid #27272a', borderRadius: '24px', padding: '20px', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)' }}
                        itemStyle={{ color: '#ea580c', fontWeight: '900', fontSize: '14px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#ea580c"
                        strokeWidth={5}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Config */}
              <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px] rounded-full"></div>
                <h3 className="text-xl font-black flex items-center gap-4 text-white">
                  <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                    <Settings className="w-6 h-6 text-zinc-500" />
                  </div>
                  الإعدادات الرئيسية
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] group hover:border-orange-500/30 transition-all duration-500 hover:bg-zinc-900/50 shadow-inner">
                    <label className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3 block opacity-70">كسب النقاط (1 ريال)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={config.earning_rate}
                        onChange={(e) => onUpdateConfig({ ...config, earning_rate: parseFloat(e.target.value) })}
                        className="bg-transparent text-3xl font-black w-full outline-none text-orange-500 tracking-tight"
                      />
                      <span className="text-[10px] text-zinc-700 font-black whitespace-nowrap uppercase tracking-tighter">نقطة مرسلة</span>
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] group hover:border-orange-500/30 transition-all duration-500 hover:bg-zinc-900/50 shadow-inner">
                    <label className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3 block opacity-70">الاستبدال (1 ريال)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={config.redemption_rate}
                        onChange={(e) => onUpdateConfig({ ...config, redemption_rate: parseFloat(e.target.value) })}
                        className="bg-transparent text-3xl font-black w-full outline-none text-orange-500 tracking-tight"
                      />
                      <span className="text-[10px] text-zinc-700 font-black whitespace-nowrap uppercase tracking-tighter">نقطة مخصومة</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-[2.5rem] font-black text-sm shadow-[0_25px_50px_-12px_rgba(234,88,12,0.4)] transition-all active:scale-[0.98] group"
                  >
                    حفظ ورفع الإعدادات
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'customers' && (
          <motion.div
            key="customers"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between gap-6 flex-wrap bg-[#0c0c0c]/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-zinc-800/50 shadow-2xl">
              <div className="relative flex-1 min-w-[350px]">
                <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-orange-600/5 rounded-xl border border-orange-600/10">
                  <Search className="text-orange-500 w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="ابحث عن عميل برقم الجوال أو الاسم الكامل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-zinc-800/80 rounded-[1.5rem] py-5 pr-16 pl-6 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all font-bold placeholder:text-zinc-700 text-white"
                />
              </div>
              <div className="flex gap-3">
                <button className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all shadow-xl">
                  <History className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/30">
                      <th className="px-10 py-7 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">ملف العميل</th>
                      <th className="px-10 py-7 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">بيانات الاتصال</th>
                      <th className="px-10 py-7 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">رصيد الولاء</th>
                      <th className="px-10 py-7 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">الوضع الحالي</th>
                      <th className="px-10 py-7 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-center">إجراءات إدارية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.phone_number} className="hover:bg-orange-600/[0.02] transition-all group cursor-default">
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center text-zinc-500 font-black text-xl border border-zinc-800 group-hover:border-orange-500/30 transition-all shadow-xl">
                              {customer.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-black text-white group-hover:text-orange-500 transition-colors text-xl leading-tight mb-1">{customer.full_name || 'عميل غير سجل'}</p>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">منضم: {new Date(customer.created_at).toLocaleDateString('ar-SA')}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="font-mono text-zinc-400 font-black text-base group-hover:text-white transition-colors tracking-tighter">{customer.phone_number}</span>
                            <span className="text-[9px] text-zinc-700 font-bold uppercase">Saudi Arabia</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-600/5 rounded-xl border border-orange-600/10">
                              <Coins className="w-5 h-5 text-orange-500" />
                            </div>
                            <span className="text-white font-black text-2xl group-hover:text-orange-500 transition-colors">{customer.points_balance || 0}</span>
                            <span className="text-[9px] text-zinc-700 font-black uppercase">pts</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${customer.points_balance > 1000
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-900/10'
                              : customer.points_balance > 0
                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                            }`}>
                            {customer.points_balance > 1000 ? 'عميل ماسي' : customer.points_balance > 0 ? 'نشط' : 'جديد'}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-center justify-center gap-4">
                            <button title="إدارة النقاط" className="w-12 h-12 rounded-2xl bg-[#151515] text-zinc-500 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all border border-zinc-800 shadow-xl active:scale-95 group/btn">
                              <Edit className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                            </button>
                            <button title="سجل العمليات" className="w-12 h-12 rounded-2xl bg-[#151515] text-zinc-500 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all border border-zinc-800 shadow-xl active:scale-95">
                              <History className="w-5 h-5" />
                            </button>
                            <button title="إرسال تنبيه" className="w-12 h-12 rounded-2xl bg-[#151515] text-rose-500/30 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all border border-zinc-800 shadow-xl active:scale-95">
                              <Bell className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredCustomers.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center justify-center border-t border-zinc-900">
                  <div className="w-20 h-20 bg-zinc-900/50 rounded-[2rem] flex items-center justify-center mb-6 text-zinc-800">
                    <Search className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-zinc-500">لم نجد أي عميل بهذا الاسم أو الرقم...</h4>
                  <p className="text-zinc-700 text-sm mt-2 font-bold">تأكد من كتابة الرقم بشكل صحيح</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <h3 className="text-3xl font-black flex items-center gap-5 text-white">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-orange-800 rounded-[1.8rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(234,88,12,0.4)]">
                  <Utensils className="w-7 h-7 text-white" />
                </div>
                قائمة الطعام الرقمية
              </h3>
              <button
                onClick={handleAddProduct}
                className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-5 rounded-[2.5rem] font-black flex items-center gap-3 transition-all shadow-[0_20px_50px_-12px_rgba(234,88,12,0.5)] active:scale-[0.97] group"
              >
                <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
                صنف جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {products.map((product) => (
                <div key={product.id} className="bg-[#0c0c0c] border border-zinc-800/80 rounded-[3rem] overflow-hidden group shadow-2xl hover:border-orange-500/50 transition-all duration-700 hover:-translate-y-2">
                  <div className="h-64 bg-zinc-900 relative overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[1.5s] ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800/20">
                        <Utensils className="w-24 h-24" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    <div className="absolute top-6 left-6 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <button onClick={() => handleEditProduct(product)} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-2xl text-white flex items-center justify-center hover:bg-orange-600 transition-all border border-white/10 shadow-2xl">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-2xl text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all border border-white/5 shadow-2xl">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {product.category && (
                      <div className="absolute top-6 right-6">
                        <span className="bg-orange-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-2xl border border-orange-400/20">{product.category}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-2xl text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{product.name}</h4>
                      <div className="flex flex-col items-end">
                        <span className="text-orange-500 font-black text-xl">{product.price}</span>
                        <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-[-4px]">Sar</span>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-sm mb-8 line-clamp-2 leading-relaxed font-bold opacity-80">{product.description || 'وصف الصنف غير متاح حالياً لهذا المنتج المميز من جمر التنور.'}</p>
                    <div className="flex items-center justify-between border-t border-zinc-900 pt-6">
                      <div className="flex items-center gap-3">
                        <History className="w-4 h-4 text-zinc-800" />
                        <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest leading-none">{product.calories || '---'} Cal</span>
                      </div>
                      <div className="flex items-center -space-x-3 rtl:space-x-reverse opacity-40 group-hover:opacity-100 transition-opacity">
                        {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-zinc-800"></div>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-32 bg-[#0c0c0c] rounded-[4rem] border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center text-zinc-800">
                  <Utensils className="w-20 h-20 mb-6 opacity-5" />
                  <p className="font-black text-2xl uppercase tracking-widest opacity-30">المنيو فارغ حالياً</p>
                  <button onClick={handleAddProduct} className="text-orange-600 text-xs font-black uppercase tracking-[0.3em] mt-4 hover:tracking-[0.5em] transition-all">إضافة أول صنف الآن</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProductModalOpen && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setIsProductModalOpen(false)}
            onSave={() => {
              fetchProducts();
              setIsProductModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const StatCard = ({ title, value, icon, trend, color, badge }: { title: string, value: string, icon: React.ReactNode, trend?: string, color: string, badge?: string }) => {
  const colorMap: any = {
    blue: 'from-blue-600/30 to-blue-600/5 text-blue-500 border-blue-500/20 shadow-blue-900/10',
    orange: 'from-orange-600/30 to-orange-600/5 text-orange-500 border-orange-500/20 shadow-orange-900/10',
    emerald: 'from-emerald-600/30 to-emerald-600/5 text-emerald-500 border-emerald-500/20 shadow-emerald-900/10',
    rose: 'from-rose-600/30 to-rose-600/5 text-rose-500 border-rose-500/20 shadow-rose-900/10',
  };

  return (
    <div className={`bg-[#0c0c0c] border border-zinc-800/80 p-10 rounded-[3rem] relative overflow-hidden group shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-700 hover:-translate-y-2 hover:border-zinc-700/50`}>
      <div className={`absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br ${colorMap[color]} rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-all duration-700`}></div>

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className={`w-16 h-16 rounded-[1.8rem] bg-black flex items-center justify-center border border-zinc-800/50 text-zinc-600 group-hover:text-orange-500 group-hover:border-orange-500/30 group-hover:scale-110 transition-all duration-700 shadow-2xl`}>
          {icon}
        </div>
        {badge && (
          <span className="bg-zinc-900/80 backdrop-blur-md text-[10px] font-black px-5 py-2 rounded-full text-zinc-500 border border-zinc-800/80 shadow-inner tracking-widest uppercase">{badge}</span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 group-hover:text-zinc-400 transition-colors">{title}</p>
        <div className="flex items-baseline gap-4">
          <h3 className="text-5xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-right duration-700">{value}</h3>
          {trend && (
            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1.5 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10 shadow-lg shadow-emerald-900/5">
              <TrendingUp className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
