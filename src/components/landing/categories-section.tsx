'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export const CategoriesSection = () => {
  const [categories, setCategories] = useState<{title: string, subtitle: string, image: string, color: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('products').select('*').eq('is_active', true);

      if (data && !error) {
        // Extract unique category names
        const uniqueCatNames = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        
        // Background colors to maintain your original design style
        const colors = ['bg-orange-100', 'bg-yellow-100', 'bg-red-100', 'bg-green-100', 'bg-blue-100', 'bg-purple-100'];

        const dynamicCategories = uniqueCatNames.map((catName, idx) => {
          // Find the first product in this category that has an image
          const productWithImg = data.find(p => p.category === catName && p.image_url);
          return {
            title: String(catName),
            subtitle: 'Explore collection', 
            image: productWithImg ? productWithImg.image_url : '',
            color: colors[idx % colors.length]
          };
        });

        // Limit to 4 or 8 to keep the grid balanced
        setCategories(dynamicCategories.slice(0, 8)); 
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
    <section id="categories" className="py-24 bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
        <span className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest block">
          CATEGORIES
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
          Explore Our Fireworks <br /> Categories
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#d97706]" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-500">More categories coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Link href={`/products?category=${encodeURIComponent(cat.title)}`} key={idx} className="group">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-full transition-transform group-hover:-translate-y-1 group-hover:shadow-md">
                <div className="space-y-4">
                  <div className={`relative w-full h-44 rounded-lg ${cat.color} flex items-center justify-center overflow-hidden`}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-black/20" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-lg text-black group-hover:text-[#d97706] transition-colors">{cat.title}</h3>
                    <p className="font-noto text-xs text-gray-500">{cat.subtitle}</p>
                  </div>
                </div>
                <div className="pt-4 flex items-center gap-1 font-poppins text-xs font-semibold text-[#d97706] group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-16 flex justify-center">
        <Link 
          href="/products" 
          className="border-2 border-[#d97706] text-[#d97706] hover:bg-[#d97706] hover:text-white px-10 py-3.5 rounded-sm font-poppins font-semibold text-sm transition-colors tracking-wide"
        >
          EXPLORE ALL CATEGORIES
        </Link>
      </div>
    </section>
  );
};