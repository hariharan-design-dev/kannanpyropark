import React from 'react';
import { Shield, Truck, Medal, Clock } from 'lucide-react';

export const FeatureStrip = () => {
  const features = [
    { icon: Medal, title: 'Premium Quality', subtitle: 'Direct from Sivakasi' },
    { icon: Truck, title: 'Wholesale Rates', subtitle: 'Best market pricing' },
    { icon: Shield, title: 'Guaranteed Safety', subtitle: 'Certified fireworks' },
    { icon: Clock, title: 'Timely Delivery', subtitle: 'Swift order dispatch' },
  ];

  return (
    <section className="relative z-30 max-w-[95%] lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16">
      <div className="bg-[#0f172a] rounded-xl shadow-2xl p-6 lg:p-8">
        
        {/* Changed to Flexbox for perfect divider alignment */}
        <div className="flex flex-col lg:flex-row justify-between divide-y lg:divide-y-0 lg:divide-x divide-gray-700">
          {features.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div 
                key={idx} 
                className="flex-1 flex items-center justify-start lg:justify-center gap-4 py-5 lg:py-0 lg:px-4 first:pt-0 last:pb-0 lg:first:pl-0 lg:last:pr-0"
              >
                <IconComp className="w-8 h-8 text-[#d97706] shrink-0 stroke-[1.5]" />
                <div>
                  <h4 className="font-poppins font-semibold text-sm text-white">{item.title}</h4>
                  <p className="font-noto text-xs text-gray-400 mt-1">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
};