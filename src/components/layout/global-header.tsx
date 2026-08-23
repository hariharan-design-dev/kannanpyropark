'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, FileText, LogIn, LogOut, Package, Home } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCartStore } from '@/store/cartStore';
import { AuthModal } from '@/components/auth/auth-modal';

export const GlobalHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isHomePage = pathname === '/';
  
  const [session, setSession] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { getTotalItems, toggleCart } = useCartStore();
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
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

  if (isAdminRoute) return null;

  const isAdminUser = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

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
              kannan pyro park
            </span>
          </Link>

          {!isHomePage && (
            <nav className="hidden md:flex items-center gap-8 font-poppins text-sm font-semibold uppercase tracking-wide">
              <Link href="/products" className={`pb-1 border-b-2 transition-colors ${pathname.includes('/products') ? 'border-[#d97706] text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>Products</Link>
              
              {session && !isAdminUser && (
                <Link href="/orders" className={`pb-1 border-b-2 transition-colors ${pathname.includes('/orders') ? 'border-[#d97706] text-[#d97706]' : 'border-transparent text-gray-500 hover:text-black'}`}>My Requests</Link>
              )}
            </nav>
          )}

          <div className="flex items-center gap-5">
            {isAdminUser ? (
              /* --- ADMIN UI --- */
              <div className="flex items-center gap-4">
                <Link 
                  href="/admin/orders" 
                  className="bg-[#d97706] hover:bg-yellow-600 text-white px-5 py-2.5 rounded-md font-poppins text-xs font-bold transition-colors shadow-sm"
                >
                  Return to Dashboard
                </Link>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <button onClick={handleLogout} className={`p-1 transition-colors ${iconClasses}`} title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              /* --- REGULAR CUSTOMER UI --- */
              <>
                {/* --- HOME ICON (Hidden on Homepage) --- */}
                {!isHomePage && (
                  <Link href="/" className={`p-1 transition-colors ${iconClasses}`} title="Back to Home">
                    <Home className="w-5 h-5" />
                  </Link>
                )}

                {/* --- ORDERS ICON --- */}
                {session && !isAdminUser && (
                  <Link 
                    href="/orders" 
                    className={`p-1 transition-colors ${iconClasses} ${!isHomePage ? 'md:hidden' : ''}`} 
                    title="My Orders"
                  >
                    <Package className="w-5 h-5" />
                  </Link>
                )}

                {/* --- CART ICON --- */}
                <button onClick={toggleCart} className={`relative p-1 transition-colors cursor-pointer ${iconClasses}`} title="Cart">
                  <FileText className="w-5 h-5" />
                  {isMounted && getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#d97706] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{getTotalItems()}</span>
                  )}
                </button>

                {session ? (
                  <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-1">
                    <Link href="/profile" className={`p-1 transition-colors ${iconClasses}`} title="Profile"><User className="w-5 h-5" /></Link>
                    <button onClick={handleLogout} className={`p-1 transition-colors ${iconClasses}`} title="Logout"><LogOut className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <button onClick={() => setIsAuthModalOpen(true)} className={`p-1 transition-colors ${iconClasses}`} title="Login"><LogIn className="w-5 h-5" /></button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />
    </>
  );
};