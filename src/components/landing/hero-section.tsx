'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/store/settingsStore';

export const HeroSection = () => {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  return (
    <section className="relative w-full h-[700px] lg:h-[850px] overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: settings?.hero_bg_url ? `url('${settings.hero_bg_url}')` : 'none', 
          backgroundColor: '#0f172a' 
        }}
      />
      <div 
        className="block md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: settings?.hero_bg_url ? `url('${settings.hero_bg_url}')` : 'none', 
          backgroundColor: '#0f172a' 
        }}
      />
      
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      <div className="relative z-20 max-w-4xl mx-auto px-4 text-center -mt-15">
        
        {settings?.hero_subtitle && (
          <span 
            className="inline-block font-poppins text-xs sm:text-sm font-bold tracking-[0.2em] uppercase mb-4"
            style={{ color: settings.hero_subtitle_color }}
          >
            {settings.hero_subtitle}
          </span>
        )}
        
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
          {settings?.hero_title_main && (
            <span style={{ color: settings.hero_title_main_color }}>
              {settings.hero_title_main} <br />
            </span>
          )}
          {settings?.hero_title_highlight && (
            <span style={{ color: settings.hero_title_highlight_color }}>
              {settings.hero_title_highlight}
            </span>
          )}
        </h1>
        
        {settings?.hero_description && (
          <p 
            className="font-noto text-base sm:text-lg leading-relaxed font-light max-w-2xl mx-auto mb-10"
            style={{ color: settings.hero_description_color }}
          >
            {settings.hero_description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 font-poppins text-sm font-semibold">
          {/* <Link 
            href="/products" 
            className="bg-[#d97706] hover:bg-yellow-600 text-white px-8 py-4 transition-colors rounded-sm tracking-wide"
          >
            EXPLORE PRODUCTS
          </Link> */}
        </div>
      </div>
    </section>
  );
};