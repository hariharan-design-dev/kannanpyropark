'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Minus, ShoppingBag, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCartStore } from '@/store/cartStore';

// Custom SVG Icons for Social Links
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path>
  </svg>
);

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap Next.js 15 dynamic params safely using React.use()
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Gallery active image state
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Quantity stepper state
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const supabase = createClient();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProductDetails = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (data && !error) {
        setProduct(data);
        // Set the primary image as the default active view
        setActiveImage(data.image_url || '');
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [productId, supabase]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Add item with the selected quantity stepper amount and unit type
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        title: product.name,
        price: product.price,
        category: product.category,
        unit: product.unit_type || 'piece', // <-- ADDED: Passes unit to cart store
      });
    }

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d97706]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-serif text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">The item you are looking for might have been removed or is unavailable.</p>
        <Link href="/products" className="bg-[#0f172a] text-white font-poppins text-xs font-semibold py-3 px-6 rounded-md hover:bg-[#d97706] transition-colors">
          Back to Store
        </Link>
      </div>
    );
  }

  // Combine primary image and all gallery images into one array for the thumbnail switcher
  const allImages = [
    product.image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#fafafa] font-noto pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-poppins text-gray-500 mb-8">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-black transition-colors">Products</Link>
          <span>/</span>
          <span className="text-[#d97706] font-semibold">{product.category}</span>
          <span>/</span>
          <span className="text-gray-900 font-bold truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: Immersive Image Gallery */}
          <div className="space-y-4">
            {/* Main Active Image View */}
            <div className="relative w-full aspect-square bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
              {activeImage ? (
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                  <Sparkles className="w-12 h-12 mb-2 opacity-30" />
                  <span className="text-xs">No image available</span>
                </div>
              )}
              <span className="absolute top-4 left-4 bg-[#0f172a] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                {product.category}
              </span>
            </div>

            {/* Thumbnail Row (Primary + Gallery) */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative aspect-square bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImage === imgUrl ? 'border-[#d97706] shadow-md ring-2 ring-[#d97706]/20' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Social Media Action Buttons */}
            {(product.youtube_url || product.instagram_url) && (
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <p className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-widest">Watch Effects & Demos</p>
                <div className="flex flex-wrap gap-3">
                  {product.youtube_url && (
                    <a 
                      href={product.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-poppins text-xs font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm"
                    >
                      <YoutubeIcon className="w-4 h-4" /> Watch on YouTube
                    </a>
                  )}
                  {product.instagram_url && (
                    <a 
                      href={product.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-poppins text-xs font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm"
                    >
                      <InstagramIcon className="w-4 h-4" /> View on Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Details & Purchase Actions */}
          <div className="space-y-6">
            <div>
              <span className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest block mb-1">
                {product.category}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1a1f36] leading-tight mb-4">
                {product.name}
              </h1>
              
              {/* ADDED: Unit display next to price */}
              <div className="font-poppins font-extrabold text-3xl text-black mb-6">
                ₹{product.price} 
                <span className="text-sm font-normal text-gray-500 ml-1">/ {product.unit_type || 'piece'}</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-poppins text-xs font-bold text-gray-700 uppercase tracking-wider">Available for Pre-Order</span>
              </div>
            </div>

            {/* Description Block */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-poppins text-xs font-bold text-gray-400 uppercase tracking-widest">Product Overview</h3>
              <p className="font-noto text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description has been provided for this product yet. Rest assured, this is a premium quality item manufactured under strict safety standards.'}
              </p>
            </div>

            {/* Quantity Stepper & Add to List Action */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Stepper */}
                <div className="flex items-center justify-between border border-gray-300 rounded-xl bg-gray-50 p-1.5 w-full sm:w-40">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-poppins text-base font-bold text-black">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to List Button */}
                <button 
                  onClick={handleAddToCart}
                  disabled={addedAnimation}
                  className={`flex-1 font-poppins font-bold text-sm py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    addedAnimation 
                      ? 'bg-green-600 text-white shadow-green-600/30' 
                      : 'bg-[#d97706] hover:bg-yellow-600 text-white shadow-[#d97706]/30'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-5 h-5 animate-bounce" /> Added to Pre-Order List!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" /> Add to Pre-Order List
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link href="/" className="font-poppins text-xs font-semibold text-gray-500 hover:text-black transition-colors underline">
                  Continue Browsing Catalog
                </Link>
              </div>
            </div>

            {/* How Requesting Works Box */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> How Pre-Ordering Works
              </h3>
              <ol className="space-y-2 text-xs font-noto text-slate-400">
                <li className="flex gap-2">
                  <span className="text-white font-bold">01.</span> Add desired items and quantities to your request list.
                </li>
                <li className="flex gap-2">
                  <span className="text-white font-bold">02.</span> Submit your request safely with zero upfront online payment.
                </li>
                <li className="flex gap-2">
                  <span className="text-white font-bold">03.</span> A Kannan representative will review your list, confirm stock, and coordinate offline delivery.
                </li>
              </ol>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}