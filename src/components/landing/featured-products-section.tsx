'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const FeaturedProductsSection = () => {

  const addItem = useCartStore((state) => state.addItem);
  const products = [
    { id: '1', category: 'FLOWER POTS', title: 'Flower Pots Big', price: 450 },
    { id: '2', category: 'AERIAL SHOTS', title: 'Sky Shot', price: 850 },
    { id: '3', category: 'ROCKETS', title: 'Rocket Classic', price: 380 },
    { id: '4', category: 'GROUND CHAKKARS', title: 'Ground Chakkar', price: 280 },
  ];

  const handleAddToList = (prod: any) => {
    addItem({
      id: prod.id,
      title: prod.title,
      price: prod.price,
      category: prod.category,
    });
    // Optional: Add a small toast notification here later
  };

  return (
    <section id="products" className="py-24 bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
        <span className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest block">
          BESTSELLERS
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
          Customer Favorites
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((prod) => (
          <div key={prod.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="relative w-full h-48 rounded-lg bg-stone-100 flex items-center justify-center">
                 <span className="text-gray-400 text-sm">Product Image</span>
                <button className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <span className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{prod.category}</span>
                <h3 className="font-serif font-bold text-base text-black">{prod.title}</h3>
              </div>
              <div className="pt-2 font-poppins font-extrabold text-base text-black">₹{prod.price}</div>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => handleAddToList(prod)} // <-- Call the store function
                className="w-full bg-[#d97706] hover:bg-yellow-600 text-white font-poppins font-semibold text-xs py-3 rounded-md transition-colors shadow-sm"
              >
                Add to List
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};