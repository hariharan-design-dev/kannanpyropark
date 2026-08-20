import React from 'react';
import { HeroSection } from '@/components/landing/hero-section';
import { FeatureStrip } from '@/components/landing/feature-strip';
import { AboutSection } from '@/components/landing/about-section';
import { CategoriesSection } from '@/components/landing/categories-section';
import { FeaturedProductsSection } from '@/components/landing/featured-products-section';
import { LandingFooter } from '@/components/landing/landing-footer'; // <-- Add Import
import { QuickOrderList } from '@/components/landing/quick-order-list';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-black overflow-x-hidden font-noto">
      <HeroSection />
      {/* <FeatureStrip /> */}
      {/* <AboutSection /> */} {/* Temporarily removed*/}
      {/* <CategoriesSection />
      <FeaturedProductsSection /> */}
      <QuickOrderList />
      <LandingFooter />
    </main>
  );
}