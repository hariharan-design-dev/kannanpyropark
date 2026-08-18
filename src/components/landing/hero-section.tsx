import React from 'react';
import Link from 'next/link';

export const HeroSection = () => {
  return (
    <section className="relative w-full h-[700px] lg:h-[850px] overflow-hidden flex items-center justify-center">
      {/* Background Image - Make sure to add hero-krishna.jpg to public/assets/ */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/assests/hero-krishna.jpg')", backgroundColor: '#0f172a' }}
      />
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      <div className="relative z-20 max-w-4xl mx-auto px-4 text-center mt-16">
        <span className="inline-block font-poppins text-xs sm:text-sm font-bold tracking-[0.2em] text-[#d97706] uppercase mb-4">
          Celebrate with Peace
        </span>
        
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight mb-6">
          Celebrate with <br />
          <span className="text-[#d97706]">DIVINE LIGHT</span>
        </h1>
        
        <p className="font-noto text-base sm:text-lg text-gray-200 leading-relaxed font-light max-w-2xl mx-auto mb-10">
          Premium Quality Fireworks from the heart of Sivakasi. Direct factory price & guaranteed safety for all your celebrations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 font-poppins text-sm font-semibold">
          <Link 
            href="#products" 
            className="bg-[#d97706] hover:bg-yellow-600 text-white px-8 py-4 transition-colors rounded-sm tracking-wide"
          >
            EXPLORE PRODUCTS
          </Link>
          <Link 
            href="/pricelist" 
            className="border border-white hover:bg-white hover:text-black text-white px-8 py-4 transition-colors rounded-sm tracking-wide"
          >
            DOWNLOAD PRICELIST
          </Link>
        </div>
      </div>
    </section>
  );
};