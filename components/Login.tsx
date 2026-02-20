
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User as UserIcon, Lock, CheckCircle2, AlertCircle, ChevronRight, Store } from 'lucide-react';

interface LoginProps {
  onLogin: (identifier: string, role: UserRole, data: User) => void;
  loading: boolean;
  forcedRole?: UserRole;
}

const Login: React.FC<LoginProps> = ({ onLogin, loading: externalLoading, forcedRole }) => {
  const [role, setRole] = useState<UserRole>(forcedRole || 'CUSTOMER');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    // Check for remembered user
    const savedRole = localStorage.getItem('remembered_role') as UserRole;
    const savedUser = localStorage.getItem('remembered_username');
    if (savedRole && savedUser && !forcedRole) {
      // Just pre-fill, don't auto-login for security unless it's a token-based system
      setRole(savedRole);
      if (savedRole === 'CUSTOMER') setPhone(savedUser);
      else setUsername(savedUser);
      setRememberMe(true);
    }
  }, [forcedRole]);

  const validatePhone = (value: string) => {
    const phoneRegex = /^(05|5)\d{8}$/;
    if (!value) {
      setPhoneError('');
      return false;
    }
    if (!/^\d+$/.test(value)) {
      setPhoneError('يرجى إدخال أرقام فقط');
      return false;
    }
    if (!phoneRegex.test(value)) {
      setPhoneError('يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 أو 5');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const isPhoneValid = role === 'CUSTOMER' ? /^(05|5)\d{8}$/.test(phone) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalLoading(true);

    try {
      if (role === 'CUSTOMER') {
        const { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('phone_number', phone)
          .maybeSingle();

        if (error) throw error;

        if (customer) {
          if (rememberMe) {
            localStorage.setItem('remembered_role', 'CUSTOMER');
            localStorage.setItem('remembered_username', phone);
          } else {
            localStorage.clear();
          }

          onLogin(phone, 'CUSTOMER', {
            id: customer.phone_number,
            phone: customer.phone_number,
            name: customer.full_name || 'عميل جمر التنور',
            role: 'CUSTOMER',
            points: customer.points_balance || 0
          });
        } else if (!isNewCustomer) {
          setIsNewCustomer(true);
        } else {
          const { data: newCust, error: insError } = await supabase
            .from('customers')
            .insert([{
              phone_number: phone,
              full_name: name,
              points_balance: 0
            }])
            .select()
            .single();

          if (insError) throw insError;

          if (newCust) {
            onLogin(phone, 'CUSTOMER', {
              id: newCust.phone_number,
              phone: newCust.phone_number,
              name: newCust.full_name,
              role: 'CUSTOMER',
              points: 0
            });
          }
        }
      } else {
        const { data: staffMember, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle();

        if (staffError) throw staffError;

        if (staffMember) {
          if (rememberMe) {
            localStorage.setItem('remembered_role', staffMember.role.toUpperCase());
            localStorage.setItem('remembered_username', username);
          } else {
            localStorage.clear();
          }

          const uiRole = staffMember.role.toUpperCase() as UserRole;
          onLogin(username, uiRole, {
            id: staffMember.id,
            phone: '---',
            name: staffMember.role === 'admin' ? 'المدير العام' : 'موظف جمر التنور',
            role: uiRole,
            points: 0
          });
        } else {
          alert("خطأ في اسم المستخدم أو كلمة المرور");
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      alert(`حدث خطأ: ${err.message || 'فشل الاتصال الخارجي'}`);
    } finally {
      setInternalLoading(false);
    }
  };

  const isLoading = internalLoading || externalLoading;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-['Cairo'] overflow-hidden relative" dir="rtl">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-600/20 to-transparent"></div>

          <div className="flex flex-col items-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-32 h-32 mb-6"
            >
              <div className="absolute inset-0 bg-orange-600/20 blur-[30px] rounded-full"></div>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain relative z-10" />
            </motion.div>
            <h1 className="text-3xl font-black text-white text-center">جمر التنور</h1>
            <p className="text-zinc-500 text-sm mt-2 font-bold tracking-wide">نظام الولاء والمكافآت</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!forcedRole && (
              <div className="bg-black/50 p-1.5 rounded-2xl border border-zinc-800/50 flex gap-1">
                {(['CUSTOMER', 'CASHIER', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setIsNewCustomer(false); }}
                    className={`flex-1 py-3 text-[11px] font-black rounded-xl transition-all duration-300 ${role === r
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/20'
                      }`}
                  >
                    {r === 'CUSTOMER' ? 'عميل' : r === 'CASHIER' ? 'كاشير' : 'المدير'}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {role === 'CUSTOMER' ? (
                  <motion.div
                    key="customer-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="relative group">
                        <Phone className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                          type="tel"
                          placeholder="رقم الجوال (05...)"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            validatePhone(e.target.value);
                          }}
                          className={`w-full bg-black/40 border ${phoneError ? 'border-red-500/50' : 'border-zinc-800 group-focus-within:border-orange-500/50'} rounded-2xl py-5 pr-14 pl-5 focus:outline-none transition-all text-lg font-black tracking-widest text-white`}
                          required
                        />
                      </div>
                      {phoneError && (
                        <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold px-4 animate-bounce">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {phoneError}
                        </div>
                      )}
                    </div>

                    {isNewCustomer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 pt-2"
                      >
                        <div className="relative group">
                          <UserIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                          <input
                            type="text"
                            placeholder="الاسم الكامل"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-orange-600/5 border border-orange-600/30 rounded-2xl py-5 pr-14 pl-5 focus:outline-none focus:border-orange-500 transition-all text-lg font-black text-white"
                            required
                          />
                        </div>
                        <p className="text-[10px] text-orange-500/70 font-bold px-4">مرحباً بك! هذه أول زيارة لك، نرجو كتابة اسمك.</p>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="staff-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="relative group">
                      <UserIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="اسم المستخدم"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 focus:border-orange-500/50 rounded-2xl py-5 pr-14 pl-5 focus:outline-none transition-all font-black text-white"
                        required
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="password"
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 focus:border-orange-500/50 rounded-2xl py-5 pr-14 pl-5 focus:outline-none transition-all font-black text-white"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer hidden"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-zinc-800 rounded-md peer-checked:bg-orange-600 peer-checked:border-orange-600 transition-all flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                </div>
                <span className="text-xs text-zinc-500 font-bold group-hover:text-zinc-300 transition-colors">تذكر بياناتي</span>
              </label>
              {role === 'ADMIN' && (
                <span className="text-[10px] text-orange-500/50 font-black uppercase tracking-tighter border border-orange-500/20 px-2 py-0.5 rounded-md">Admin Access</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPhoneValid}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-orange-900/40 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isNewCustomer ? 'إتمام التسجيل والبدء' : 'دخول النظام'}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
          Powered by Jamr AlTanour Loyalty v2.0
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
