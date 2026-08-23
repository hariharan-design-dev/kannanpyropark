'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);

export const LandingFooter = () => {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  return (
    <footer id="contact" className="bg-[#0f172a] text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & Description */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-white tracking-wide">
              Kannan Pyro Park
            </h3>
            {settings?.footer_about && (
              <p className="font-noto text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                {settings.footer_about}
              </p>
            )}
            {(settings?.footer_facebook || settings?.footer_instagram || settings?.footer_twitter) && (
              <div className="flex space-x-4 pt-2">
                {settings?.footer_facebook && (
                  <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#d97706] transition-colors">
                    <FacebookIcon className="w-5 h-5" />
                  </a>
                )}
                {settings?.footer_instagram && (
                  <a href={settings.footer_instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#d97706] transition-colors">
                    <InstagramIcon className="w-5 h-5" />
                  </a>
                )}
                {settings?.footer_twitter && (
                  <a href={settings.footer_twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#d97706] transition-colors">
                    <TwitterIcon className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-poppins font-semibold text-[#d97706] mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3 font-noto text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="#products" className="hover:text-white transition-colors">Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-semibold text-[#d97706] mb-6 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-3 font-noto text-sm text-gray-400">
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-poppins font-semibold text-[#d97706] mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
            <ul className="space-y-4 font-noto text-sm text-gray-400">
              {settings?.footer_address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
                  <a href='https://maps.app.goo.gl/h7ucLWcc1b4Vnx3t6' target='_blank'>{settings.footer_address}</a>
                </li>
              )}
              {settings?.footer_phones && settings.footer_phones.length > 0 && (
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#d97706] shrink-0" />
                  <span>
                    {settings.footer_phones.map((phone, idx) => (
                      <div key={idx}>
                        <a href={`tel:${phone}`}>{phone}</a>
                      </div>
                    ))}
                  </span>
                </li>
              )}
              {settings?.footer_emails && settings.footer_emails.length > 0 && (
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#d97706] shrink-0" />
                  <span>
                    {settings.footer_emails.map((email, idx) => (
                      <div key={idx}>
                        <a href={`mailto:${email}`}>{email}</a>
                      </div>
                    ))}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-noto text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Kannan Pyro Park. All rights reserved.
          </p>
          <p className="font-noto text-xs text-gray-500">
            Designed for Quality Celebrations.
          </p>
        </div>
      </div>
    </footer>
  );
};