
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (identifier: string, role: UserRole, data: User) => void;
  loading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, loading: externalLoading }) => {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalLoading(true);

    try {
      if (role === 'CUSTOMER') {
        // 1. البحث عن العميل برقم الجوال
        const { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('phone_number', phone)
          .maybeSingle();


        if (customer) {
          // عميل موجود - تسجيل دخول مباشر
          onLogin(phone, 'CUSTOMER', {
            id: customer.phone_number,
            phone: customer.phone_number,
            name: customer.full_name,
            role: 'CUSTOMER',
            points: customer.points_balance || 0
          });

        } else if (!isNewCustomer) {
          // عميل غير موجود - نطلب الاسم لأول مرة
          setIsNewCustomer(true);
        } else {
          // 2. تسجيل عميل جديد (Insert)
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
            // توجيه تلقائي بعد التسجيل (Redirect)
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
        // منطق الموظفين الحقيقي
        const { data: staffMember, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle();

        if (staffError) throw staffError;

        if (staffMember) {
          onLogin(username, staffMember.role.toUpperCase() as UserRole, {
            id: staffMember.id,
            phone: '000',
            name: staffMember.role === 'admin' ? 'المدير العام' : 'موظف جمر التنور',
            role: staffMember.role.toUpperCase() as UserRole,
            points: 0
          });
        } else {
          alert("خطأ في اسم المستخدم أو كلمة المرور");
        }
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      alert(`حدث خطأ في الاتصال: ${err.message || 'يرجى التحقق من مفاتيح Supabase أو وجود الجداول'}`);
    } finally {

      setInternalLoading(false);
    }
  };

  const isLoading = internalLoading || externalLoading;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full h-64 bg-orange-600/10 blur-[100px] rounded-full"></div>

      <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.4)] mb-8 animate-pulse">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99a7.99 0 01-4.812 10.27L15 19l2.657-2.343z" />
        </svg>
      </div>

      <h1 className="text-3xl font-black mb-2 tracking-tighter">جمر التنور</h1>
      <p className="text-zinc-500 mb-8 text-sm">نظام الولاء السحابي المتكامل</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 relative z-10">
        <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 flex gap-1">
          {(['CUSTOMER', 'CASHIER', 'ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setIsNewCustomer(false); }}
              className={`flex-1 py-3 text-[11px] font-black rounded-xl transition-all duration-300 ${role === r ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {r === 'CUSTOMER' ? 'عميل' : r === 'CASHIER' ? 'كاشير' : 'مدير'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {role === 'CUSTOMER' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">رقم الجوال</label>
                <input
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all text-lg font-bold tracking-[0.2em]"
                  required
                />
              </div>
              {isNewCustomer && (
                <div className="space-y-1.5 animate-in zoom-in-95 duration-300">
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-1">مرحباً بك! ما هو اسمك؟</label>
                  <input
                    type="text"
                    placeholder="الاسم الثلاثي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-orange-500/30 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all text-lg font-bold"
                    required
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">اسم المستخدم</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">كلمة المرور</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition-all font-bold"
                  required
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            isNewCustomer ? 'إتمام التسجيل والبدء' : 'دخول النظام'
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
