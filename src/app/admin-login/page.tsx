'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // If already logged in, redirect to admin dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin/orders');
    });
  }, [router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // For Admin, we use explicit Email/Password, not the dummy phone-email trick
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError('Invalid admin credentials.');
    } else {
      router.push('/admin/orders');
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-noto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="bg-[#1e293b] p-8 text-center relative flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Admin Portal</h1>
          <p className="font-poppins text-xs text-blue-200 mt-2 tracking-widest uppercase">Secure Access Only</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold p-4 rounded-lg mb-6 border border-red-100 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kannanpyro.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors bg-gray-50"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-poppins font-bold text-sm py-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-500/30"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SECURE LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}