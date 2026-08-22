'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(false); // Default to Signup as first show
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Convert phone to a dummy email and use phone as password behind the scenes
    const dummyEmail = `${phone}@kannanpyropark.com`;
    const backendPassword = phone; // Using phone number as password

    if (isLogin) {
      // LOGIN FLOW
      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: backendPassword,
      });

      if (error) {
        setError('Invalid mobile number. Please check or sign up.');
      } else {
        onSuccess();
        onClose();
      }
    } else {
      // SIGN UP FLOW
      const { error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: backendPassword,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
          }
        }
      });

      if (error) {
        setError(error.message);
      } else {
        onSuccess();
        onClose();
      }
    }
    setPhone('');
    setFullName('');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0f172a] p-6 text-center relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-serif text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="font-noto text-xs text-gray-400 mt-2">
            {isLogin ? 'Login with your mobile number' : 'Sign up to build your cracker list'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-md mb-4 text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
              <div className="space-y-1">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-[#d97706] transition-colors font-poppins text-sm text-black"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-poppins text-xs font-bold text-gray-500 uppercase">Mobile Number</label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-[#d97706] transition-colors">
                <span className="bg-gray-50 px-3 py-3 text-gray-500 font-poppins text-sm border-r border-gray-300">+91</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10 digit number"
                  className="w-full px-3 py-3 outline-none font-poppins text-sm text-black"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || phone.length < 10}
              className="w-full bg-[#d97706] hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-poppins font-bold text-sm py-3.5 rounded-md transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'LOGIN' : 'CREATE ACCOUNT')}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm font-poppins text-gray-500 hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-bold text-[#d97706] underline decoration-transparent hover:decoration-[#d97706] underline-offset-4 transition-all">
                {isLogin ? 'Sign up here' : 'Login here'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};