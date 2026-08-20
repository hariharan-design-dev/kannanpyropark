'use client';

import React, { useEffect, useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { createClient } from '@/utils/supabase/client';
import { AuthModal } from '../auth/auth-modal';
import { usePathname, useRouter } from 'next/navigation';

// Define the minimum order threshold
const MINIMUM_ORDER_VALUE = 3000;

export const CartDrawer = () => {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  // Auth States
  const [session, setSession] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Profile & Address states
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [needsDetails, setNeedsDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter(); 
  const isAdminRoute = pathname?.startsWith('/admin');

  const isAdminUser = session?.user?.email === 'kannanpyropark@gmail.com';

  // Fix hydration mismatch for localStorage
  useEffect(() => {
    setIsMounted(true);

    // check initial session
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session);
      if(session) fetchUserProfile(session.user.id);
    });

    // Listen for auth changes
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) fetchUserProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const {data} = await supabase.from('profiles').select('*').eq('id', userId).single();
    if(data) {
      if(data.delivery_address) setAddress(data.delivery_address);
      if(data.phone_number) setPhone(data.phone_number);
      if(!data.delivery_address || !data.phone_number) {
        setNeedsDetails(true);
      }
    }
  };

  const handleInitialCheckoutClick = async () => {
    if(!session) {
      setIsAuthModalOpen(true);
      return;
    }

    if(isAdminUser) return null;

    const {data} = await supabase.from('profiles').select('delivery_address, phone_number').eq('id', session.user.id).single();

    if(!data?.delivery_address || !data?.phone_number) {
      setNeedsDetails(true);
      return;
    }

    executePreOrder();
  };

  const handleSaveDetailsAndOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);

    // Save details to profiles table first
    await supabase.from('profiles').update({
      delivery_address: address,
      phone_number: phone,
      updated_at: new Date().toISOString()
    }).eq('id', session.user.id);

    setLoading(false);
    setNeedsDetails(false);
    executePreOrder();
  };

  const executePreOrder = async () => {
    setLoading(true);

    const orderPayload = {
      user_id: session.user.id,
      total_amount: getTotalPrice(),
      status: 'Pending',
      order_items: items, 
    };

    const { error } = await supabase.from('orders').insert([orderPayload]);

    setLoading(false);

    if (error) {
      alert('Error placing order: ' + error.message);
    } else {
      setOrderSuccess(true);
      clearCart(); 
    }
  };

  if (!isMounted || isAdminRoute) return null;

  const currentTotal = getTotalPrice();
  const isBelowMinimum = currentTotal < MINIMUM_ORDER_VALUE;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
          onClick={toggleCart}
        />
      )}

      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#0f172a] text-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#d97706]" />
            <h2 className="font-serif text-xl font-bold">Your Pre-Order List</h2>
          </div>
          <button onClick={toggleCart} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {orderSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              <h3 className="font-serif text-2xl font-bold text-black">Pre-Order Submitted!</h3>
              <p className="font-noto text-sm text-gray-500 max-w-xs mb-4">
                Your pre-order has been registered successfully. The store admin will review and pack your items shortly.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-[250px]">
                <button 
                  onClick={() => {
                    setOrderSuccess(false);
                    toggleCart();
                    router.push('/orders'); 
                  }}
                  className="w-full bg-[#d97706] text-white font-poppins font-semibold text-xs py-3 px-6 rounded-md hover:bg-yellow-600 transition-colors shadow-md cursor-pointer"
                >
                  VIEW MY ORDERS
                </button>
                <button 
                  onClick={() => { setOrderSuccess(false); toggleCart(); }}
                  className="w-full bg-[#0f172a] text-white font-poppins font-semibold text-xs py-3 px-6 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  CONTINUE BROWSING
                </button>
              </div>
            </div>
          ) : needsDetails ? (
            <form onSubmit={handleSaveDetailsAndOrder} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-lg text-black">Delivery Details Required</h3>
              <p className="font-noto text-xs text-gray-500">Please provide your mobile number and address so the store can coordinate your offline payment and delivery.</p>
              
              <div className="space-y-1 pt-2">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#d97706] text-black font-poppins"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase">Delivery Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address with pincode"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#d97706] text-black font-noto h-24 resize-none"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#d97706] text-white font-poppins font-bold text-xs py-3 rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE & SUBMIT PRE-ORDER'}
              </button>
            </form>
          ) : items.length === 0 ? (
            /* --- EMPTY CART STATE --- */
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20 mb-2" />
              <p className="font-poppins text-sm text-center">Your list is currently empty.</p>
              <button 
                onClick={() => {
                  toggleCart();
                  router.push('/products');
                }}
                className="mt-4 bg-[#0f172a] hover:bg-[#d97706] text-white font-poppins font-semibold text-xs py-3 px-8 rounded-md transition-colors shadow-sm cursor-pointer"
              >
                EXPLORE PRODUCTS
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-stone-100 rounded-md flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-400">Image</span>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                      <h3 className="font-serif font-bold text-black text-sm line-clamp-1">{item.title}</h3>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    {/* ADDED: Unit display inside the cart next to price */}
                    <span className="font-poppins font-bold text-[#d97706] text-sm">
                      ₹{item.price} <span className="text-xs text-gray-500 font-normal">/ {item.unit || 'piece'}</span>
                    </span>
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100 px-2 text-gray-600 cursor-pointer">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-poppins text-xs font-bold w-6 text-center text-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 px-2 text-gray-600 cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Action */}
        {!orderSuccess && !needsDetails && items.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4 font-poppins">
              <span className="text-gray-500 text-sm">Estimated Total</span>
              <span className="font-extrabold text-xl text-black">₹{currentTotal}</span>
            </div>

            {/* --- MINIMUM ORDER WARNING BANNER --- */}
            {isBelowMinimum && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="font-noto text-xs text-red-700 leading-tight">
                  Minimum order value is <strong>₹{MINIMUM_ORDER_VALUE}</strong>. Please add items worth <strong>₹{MINIMUM_ORDER_VALUE - currentTotal}</strong> more to proceed.
                </p>
              </div>
            )}

            <button 
              onClick={handleInitialCheckoutClick}
              disabled={loading || isBelowMinimum}
              className={`w-full font-poppins font-bold text-sm py-4 rounded-md transition-colors flex items-center justify-center gap-2 
                ${(loading || isBelowMinimum) 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#d97706] hover:bg-yellow-600 text-white shadow-lg cursor-pointer'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'PROCEED TO PRE-ORDER'}
            </button>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {
          handleInitialCheckoutClick();
        }}
      />
    </>
  );
};