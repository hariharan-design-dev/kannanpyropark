'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, FileText, Menu, X, LogIn, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCartStore } from '@/store/cartStore';
import { AuthModal } from '@/components/auth/auth-modal';

export const GlobalHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // NEW: Scroll state for the landing page header
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { getTotalItems, toggleCart } = useCartStore();
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
    
    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    // Scroll Listener
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
  };

  // UPDATED: Fixed position for Home page, transitioning to solid dark when scrolled
  const headerClasses = isHomePage 
    ? `fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#0f172a] shadow-lg' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'} text-white`
    : "sticky top-0 z-50 bg-white border-b border-gray-200 text-black shadow-sm";

  const logoClasses = isHomePage ? "text-white" : "text-black";
  const iconClasses = isHomePage ? "text-white hover:text-[#d97706]" : "text-gray-600 hover:text-black";
  
  return (
    <>
      <header className={headerClasses}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 group">
            <span className={`font-serif text-2xl font-bold tracking-tight transition-colors ${logoClasses}`}>
              kannan pyro parks
            </span>
          </Link>

          {!isHomePage && (
            <nav className="hidden md:flex items-center gap-8 font-poppins text-sm font-semibold uppercase tracking-wide">
              <Link 
                href="/products" 
                className={`pb-1 border-b-2 transition-colors ${pathname.includes('/products') ? 'border-[#d97706] text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
              >
                Products
              </Link>
              <Link 
                href="/orders" 
                className={`pb-1 border-b-2 transition-colors ${pathname.includes('/orders') ? 'border-[#d97706] text-[#d97706]' : 'border-transparent text-gray-500 hover:text-black'}`}
              >
                My Requests
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-5">
            <button onClick={toggleCart} className={`relative p-1 transition-colors cursor-pointer ${iconClasses}`}>
              <FileText className="w-5 h-5" />
              {isMounted && getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#d97706] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {session ? (
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-1">
                <Link href="/profile" className={`p-1 transition-colors ${iconClasses}`} title="Profile">
                  <User className="w-5 h-5" />
                </Link>
                <button onClick={handleLogout} className={`p-1 transition-colors ${iconClasses}`} title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className={`p-1 transition-colors ${iconClasses}`} title="Login">
                <LogIn className="w-5 h-5" />
              </button>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden p-1 ${iconClasses}`}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};