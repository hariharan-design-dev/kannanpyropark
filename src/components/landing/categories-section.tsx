import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const CategoriesSection = () => {
  const categories = [
    { title: 'Flower Pots', subtitle: 'Long duration fountains', color: 'bg-orange-100' },
    { title: 'Sparklers', subtitle: 'Crackling bright wires', color: 'bg-yellow-100' },
    { title: 'Rockets', subtitle: 'High altitude display', color: 'bg-red-100' },
    { title: 'Ground Chakkars', subtitle: 'Continuous spinning', color: 'bg-green-100' },
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => (
          <Link href="/products" key={idx} className="group">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-full transition-transform group-hover:-translate-y-1 group-hover:shadow-md">
              <div className="space-y-4">
                <div className={`relative w-full h-44 rounded-lg ${cat.color} flex items-center justify-center`}>
                  <span className="text-gray-500 font-bold">Image</span>
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

      {/* NEW: Explore More Button */}
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