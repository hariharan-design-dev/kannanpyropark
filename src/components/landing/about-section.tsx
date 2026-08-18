import React from 'react';
import { ArrowRight } from 'lucide-react';

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Content */}
        <div className="space-y-6">
          <span className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-[0.2em]">
            ABOUT KANNAN PYRO PARK
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-black leading-tight">
            Where Tradition Meets Celebration
          </h2>
          <div className="space-y-4 font-noto text-gray-600 leading-relaxed text-sm sm:text-base">
            <p>
              Kannan Pyro Park has been lighting up the skies and bringing joy to families for over three decades. Located in the heart of Sivakasi, the fireworks capital of India, we take immense pride in crafting premium quality crackers that ensure safety without compromising on the spectacle.
            </p>
            <p>
              We believe every celebration deserves to be extraordinary. From intimate family gatherings to grand festivals, our carefully curated selection of fireworks is designed to create unforgettable memories.
            </p>
          </div>
          <button className="flex items-center gap-2 font-poppins text-sm font-semibold text-[#d97706] hover:text-yellow-700 transition-colors pt-4 group">
            Read Our Full Story 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Image/Badge Box */}
        <div className="bg-[#f8f9fa] w-full h-[400px] flex items-center justify-center p-8 rounded-sm">
           {/* Replace this div with an actual <img> tag pointing to your circular logo once you have it */}
           <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center text-center p-4">
             <span className="font-serif font-bold text-gray-400">KANNAN PYRO PARK</span>
             <span className="text-xs text-gray-400 mt-2">SIVAKASI</span>
           </div>
        </div>

      </div>
    </section>
  );
};