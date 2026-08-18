'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, ShoppingBag, Menu, X, LogIn } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export const LandingHeader = ({ cartCount = 0 }: { cartCount?: number }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/60 via-black/40 to-transparent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-amber-500 transition-colors">
            Kannan Pyro Park
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
          <Link href="/" className="text-amber-400 font-semibold transition-colors">Home</Link>
          <Link href="#categories" className="hover:text-amber-400 transition-colors">Categories</Link>
          <Link href="#products" className="hover:text-amber-400 transition-colors">Products</Link>
          <Link href="#contact" className="hover:text-amber-400 transition-colors">Contact Us</Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 text-white">
          <Link href="/cart" className="relative hover:text-amber-400 transition-colors p-1.5">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {session ? (
            <Link href="/profile" className="hover:text-amber-400 transition-colors p-1.5 flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="hidden sm:block text-sm">Profile</span>
            </Link>
          ) : (
            <Link href="/login" className="hover:text-amber-400 transition-colors p-1.5 flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:block text-sm">Login</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-1.5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-white/10 px-6 py-5 flex flex-col gap-4 text-sm font-medium">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-amber-400">Home</Link>
          <Link href="#categories" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-amber-400">Categories</Link>
          <Link href="#products" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-amber-400">Products</Link>
          <Link href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-amber-400">Contact Us</Link>
        </div>
      )}
    </header>
  );
};