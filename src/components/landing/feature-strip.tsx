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
    <section className="relative z-30 max-w-[90%] lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      <div className="bg-[#0f172a] rounded-xl shadow-2xl p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-700">
          {features.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className={`flex items-center gap-4 ${idx !== 0 ? 'pt-4 sm:pt-0 sm:pl-6' : ''}`}>
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