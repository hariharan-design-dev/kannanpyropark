'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Loader2, Package } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; // <-- Added router

export const FeaturedProductsSection = () => {
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // <-- Initialize router

  useEffect(() => {
    const fetchBestsellers = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (data && !error) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchBestsellers();
  }, []);

  const handleAddToList = (e: React.MouseEvent, prod: any) => {
    e.stopPropagation(); // <-- Prevents card click from triggering navigation
    addItem({
      id: prod.id,
      title: prod.name,
      price: prod.price,
      category: prod.category,
    });
  };

  return (
    <section id="products" className="py-24 bg-white border-t border-gray-100 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
        <span className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest block">
          BESTSELLING
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
          Customer Favorites
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#d97706]" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">No products available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div 
              key={prod.id} 
              onClick={() => router.push(`/products/${prod.id}`)} // <-- Whole card routes to details page
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#d97706] transition-all cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="relative w-full h-48 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden">
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{prod.category}</span>
                  <h3 className="font-serif font-bold text-base text-black line-clamp-1 group-hover:text-[#d97706] transition-colors">{prod.name}</h3>
                </div>
                <div className="pt-2 font-poppins font-extrabold text-base text-black">₹{prod.price}</div>
              </div>
              <div className="pt-4">
                <button 
                  onClick={(e) => handleAddToList(e, prod)}
                  className="w-full bg-[#d97706] hover:bg-yellow-600 text-white font-poppins font-semibold text-xs py-3 rounded-md transition-colors shadow-sm cursor-pointer"
                >
                  Add to List
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};