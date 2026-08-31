'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Minus, ShoppingBag, ShieldCheck, Check, Sparkles, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { SafeImage } from '../ui/safe-image';

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

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // Reset states whenever a new product is opened
  useEffect(() => {
    if (product) {
      setActiveImage(product.image_url || '');
      setQuantity(1);
      setAddedAnimation(false);
    }
  }, [product, isOpen]);

  // Handle Body Scroll Lock & Browser Back Button (Mobile Fix)
  useEffect(() => {
    if (isOpen) {
      // 1. Lock the background scrolling
      document.body.style.overflow = 'hidden';
      
      // 2. Push a dummy state to the browser history
      window.history.pushState({ modal: 'product-modal' }, '');

      // 3. Listen for the back button (popstate)
      const handlePopState = () => {
        onClose(); // Close the modal instead of navigating back!
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  // Wrapper for closing the modal manually (via 'X' or background click)
  const handleCloseModal = () => {
    // If we are currently in our dummy history state, trigger a "back" action programmatically.
    // This removes the dummy state from history and triggers the popstate listener to call onClose().
    if (window.history.state?.modal === 'product-modal') {
      window.history.back();
    } else {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        title: product.name || product.title,
        price: product.price,
        category: product.category,
        unit: product.unit_type || 'piece',
      });
    }

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      handleCloseModal(); // Use the safe close wrapper here too!
    }, 1200);
  };

  const allImages = [product.image_url, ...(product.gallery_images || [])].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleCloseModal}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl bg-[#fafafa] rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={handleCloseModal}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-sm transition-all cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-6 sm:p-10 font-noto">
          
          <div className="flex items-center gap-2 text-xs font-poppins text-gray-500 mb-8">
            <span className="text-[#d97706] font-semibold">{product.category}</span>
            <span>/</span>
            <span className="text-gray-900 font-bold truncate max-w-[200px]">{product.name || product.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            
            {/* LEFT COLUMN: Gallery */}
            <div className="space-y-4">
              <div className="relative w-full aspect-square bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
                {activeImage ? (
                  <SafeImage 
                    src={activeImage} 
                    alt={product.name || product.title} 
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover" 
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <Sparkles className="w-12 h-12 mb-2 opacity-30" />
                    <span className="text-xs">No image available</span>
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-[#0f172adf] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {product.category}
                </span>
              </div>

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
                      <SafeImage 
                        src={imgUrl} 
                        alt={`Thumbnail ${idx}`} 
                        fill
                        sizes="100px"
                        className="object-cover" 
                      />
                    </button>
                  ))}
                </div>
              )}

              {(product.youtube_url || product.instagram_url) && (
                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <p className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-widest">Watch Effects & Demos</p>
                  <div className="flex flex-wrap gap-3">
                    {product.youtube_url && (
                      <a href={product.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-poppins text-xs font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm">
                        <YoutubeIcon className="w-4 h-4" /> Watch on YouTube
                      </a>
                    )}
                    {product.instagram_url && (
                      <a href={product.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-poppins text-xs font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm">
                        <InstagramIcon className="w-4 h-4" /> View on Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Details & Actions */}
            <div className="space-y-6">
              <div>
                <span className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest block mb-1">
                  {product.category}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1a1f36] leading-tight mb-4">
                  {product.name || product.title}
                </h1>
                <div className="font-poppins font-extrabold text-3xl text-black mb-6">
                  ₹{product.price} 
                  <span className="text-sm font-normal text-gray-500 ml-1">/ {product.unit_type || 'piece'}</span>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-poppins text-xs font-bold text-gray-700 uppercase tracking-wider">Available for Pre-Order</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-poppins text-xs font-bold text-gray-400 uppercase tracking-widest">Product Overview</h3>
                <p className="font-noto text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description || 'Premium quality fireworks manufactured under strict safety standards.'}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex items-center justify-between border border-gray-300 rounded-xl bg-gray-50 p-1.5 w-full sm:w-40">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors cursor-pointer">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-poppins text-base font-bold text-black">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={handleAddToCart}
                    disabled={addedAnimation}
                    className={`flex-1 font-poppins font-bold text-sm py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      addedAnimation ? 'bg-green-600 text-white shadow-green-600/30' : 'bg-[#d97706] hover:bg-yellow-600 text-white shadow-[#d97706]/30'
                    }`}
                  >
                    {addedAnimation ? <><Check className="w-5 h-5 animate-bounce" /> Added!</> : <><ShoppingBag className="w-5 h-5" /> Add to List</>}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 space-y-4 shadow-lg">
                <h3 className="font-poppins text-xs font-bold text-[#d97706] uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> How Pre-Ordering Works
                </h3>
                <ol className="space-y-2 text-xs font-noto text-slate-400">
                  <li className="flex gap-2"><span className="text-white font-bold">01.</span> Add desired items to your request list.</li>
                  <li className="flex gap-2"><span className="text-white font-bold">02.</span> Submit your request safely with zero upfront online payment.</li>
                  <li className="flex gap-2"><span className="text-white font-bold">03.</span> A representative will review your list, confirm stock, and coordinate offline delivery.</li>
                </ol>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};