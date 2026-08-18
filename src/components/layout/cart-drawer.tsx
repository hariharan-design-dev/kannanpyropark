'use client';

import React, { useEffect, useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const CartDrawer = () => {
  const { items, isOpen, toggleCart, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch for localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
          onClick={toggleCart}
        />
      )}

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#0f172a] text-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#d97706]" />
            <h2 className="font-serif text-xl font-bold">Your Pre-Order List</h2>
          </div>
          <button onClick={toggleCart} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p className="font-poppins text-sm">Your list is currently empty.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                {/* Image Placeholder */}
                <div className="w-20 h-20 bg-stone-100 rounded-md flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-400">Image</span>
                </div>
                
                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</span>
                      <h3 className="font-serif font-bold text-black text-sm line-clamp-1">{item.title}</h3>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-poppins font-bold text-[#d97706] text-sm">₹{item.price}</span>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100 px-2 text-gray-600">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-poppins text-xs font-bold w-6 text-[#000] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 px-2 text-gray-600">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4 font-poppins">
              <span className="text-gray-500 text-sm">Estimated Total</span>
              <span className="font-extrabold text-xl text-black">₹{getTotalPrice()}</span>
            </div>
            <button className="w-full bg-[#d97706] hover:bg-yellow-600 text-white font-poppins font-bold text-sm py-4 rounded-md transition-colors shadow-lg">
              PROCEED TO PRE-ORDER
            </button>
          </div>
        )}
      </div>
    </>
  );
};