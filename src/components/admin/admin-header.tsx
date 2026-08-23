'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Users, ShoppingCart, LogOut, ShieldCheck, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export const AdminHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  const navLinks = [
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Customers', path: '/admin/customers', icon: Users },
  ];

  return (
    <header className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Admin Branding */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <span className="font-serif text-xl font-bold tracking-tight">
            Admin Portal
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname.includes(link.path);
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-poppins font-semibold transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className='flex gap-5'>
          <Link 
            href="/admin/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className='hidden sm:inline'>Settings</span>
          </Link>

          {/* Logout Action */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors font-poppins text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation (Bottom strip for small screens) */}
      <div className="md:hidden border-t border-slate-800 bg-[#0f172a] flex justify-around">
        {navLinks.map((link) => {
          const isActive = pathname.includes(link.path);
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.path}
              className={`flex flex-col items-center gap-1 py-3 px-2 w-full text-[10px] font-poppins font-semibold uppercase tracking-wider transition-colors ${
                isActive ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
};