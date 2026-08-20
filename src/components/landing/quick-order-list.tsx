'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Minus, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCartStore } from '@/store/cartStore';

// HARDCODED CATEGORY ORDER (For future dynamic update, fetch this from a DB table)
const CUSTOM_CATEGORY_ORDER = [
  'One Sound Crackers', // Updated to match DB
  'Bijili',             // Updated to match DB
  'Flower Pots',        // Updated to match DB
  'Ground Chakkars',    // Updated to match DB
  'Peacock Special', 
  'Rockets',            // Updated to match DB
  'Smoke', 
  'Blast and Crash', 
  'Visiling', 
  'Digital wala', 
  'Bomb', 
  'Garland'
];

export const QuickOrderList = () => {
  const [groupedProducts, setGroupedProducts] = useState<Record<string, any[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { items, addItem, updateQuantity, getTotalItems, getTotalPrice, toggleCart } = useCartStore();
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true }); // Removed DB category order, relying on custom sort below

      if (data && !error) {
        // 1. Group products by category
        const grouped = data.reduce((acc: Record<string, any[]>, curr: any) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr);
          return acc;
        }, {});
        
        setGroupedProducts(grouped);

        // 2. Sort the categories based on the custom array
        const sortedCategories = Object.keys(grouped).sort((a, b) => {
          // Use lowercase comparison to prevent case-sensitivity bugs (e.g. "Flower pot" vs "Flower Pot")
          const indexA = CUSTOM_CATEGORY_ORDER.findIndex(c => c.toLowerCase() === a.toLowerCase());
          const indexB = CUSTOM_CATEGORY_ORDER.findIndex(c => c.toLowerCase() === b.toLowerCase());
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both in list, sort by index
          if (indexA !== -1) return -1; // Only A in list, it goes first
          if (indexB !== -1) return 1;  // Only B in list, it goes first
          return a.localeCompare(b);    // Neither in list, sort alphabetically at the end
        });
        console.log(sortedCategories);
        setCategories(sortedCategories);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  const getQty = (productId: string) => {
    const item = items.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  const handleIncrement = (product: any) => {
    const currentQty = getQty(product.id);
    if (currentQty === 0) {
      addItem({
        id: product.id,
        title: product.name,
        price: product.price,
        category: product.category,
        unit: product.unit_type || 'piece',
      });
    } else {
      updateQuantity(product.id, currentQty + 1);
    }
  };

  const handleDecrement = (productId: string) => {
    const currentQty = getQty(productId);
    if (currentQty > 0) {
      updateQuantity(productId, currentQty - 1);
    }
  };

  const handleManualInput = (product: any, value: string) => {
    const num = parseInt(value, 10);
    
    if (isNaN(num) || num <= 0) {
      updateQuantity(product.id, 0);
      return;
    }

    const currentQty = getQty(product.id);
    if (currentQty === 0) {
      addItem({
        id: product.id,
        title: product.name,
        price: product.price,
        category: product.category,
        unit: product.unit_type || 'piece',
      });
    }
    updateQuantity(product.id, num);
  };

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-[#d97706]" />
      </div>
    );
  }

  return (
    <div className="relative pb-36">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="grid grid-cols-[40px_1fr_45px_80px_45px] sm:grid-cols-[60px_1fr_80px_120px_80px] gap-2 sm:gap-4 p-2 sm:p-4 bg-[#0f172a] text-white font-poppins text-[9px] sm:text-xs font-bold uppercase tracking-wider items-center">
            <div className="text-center">Pic</div>
            <div>Product Name</div>
            <div className="text-center">Price</div>
            <div className="text-center">Qty</div>
            <div className="text-right sm:pr-4">Total</div>
          </div>

          {categories.map((category) => (
            <div key={category} id={`category-${category}`}>
              
              <div className="bg-[#d97706] text-white py-2 sm:py-3 px-4 font-serif font-bold text-sm sm:text-lg text-center">
                {category}
              </div>

              <div className="divide-y divide-gray-100">
                {groupedProducts[category].map((product) => {
                  const qty = getQty(product.id);
                  const rowTotal = qty * product.price;

                  return (
                    <div key={product.id} className="grid grid-cols-[40px_1fr_45px_80px_45px] sm:grid-cols-[60px_1fr_80px_120px_80px] gap-2 sm:gap-4 p-2 sm:p-4 items-center hover:bg-amber-50/50 transition-colors">
                      
                      <div className="flex justify-center">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-300" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center overflow-hidden">
                        <h3 className="font-serif font-bold text-gray-900 text-[10px] sm:text-sm leading-tight truncate sm:whitespace-normal sm:line-clamp-2">
                          {product.name}
                        </h3>
                        <span className="font-noto text-[8px] sm:text-xs text-gray-500 mt-0.5">
                          1 {product.unit_type || 'Piece'}
                        </span>
                      </div>

                      <div className="flex justify-center items-center">
                        <span className="font-poppins font-bold text-gray-900 text-[10px] sm:text-base">
                          ₹{product.price}
                        </span>
                      </div>

                      <div className="flex justify-center">
                        <div className="flex items-center border border-[#d97706] rounded sm:rounded-lg overflow-hidden bg-white w-full max-w-[100px] h-6 sm:h-9 shadow-sm">
                          <button 
                            onClick={() => handleDecrement(product.id)}
                            className="w-6 sm:w-8 h-full flex items-center justify-center bg-amber-50 hover:bg-[#d97706] hover:text-white text-[#d97706] transition-colors shrink-0 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                          </button>
                          
                          <input 
                            type="number"
                            min="0"
                            value={qty === 0 ? '' : qty}
                            onChange={(e) => handleManualInput(product, e.target.value)}
                            className="flex-1 w-full text-center font-poppins font-bold text-gray-900 text-[10px] sm:text-sm outline-none appearance-none m-0 p-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            placeholder="0"
                          />

                          <button 
                            onClick={() => handleIncrement(product)}
                            className="w-6 sm:w-8 h-full flex items-center justify-center bg-amber-50 hover:bg-[#d97706] hover:text-white text-[#d97706] transition-colors shrink-0 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end sm:pr-4">
                        <span className="font-poppins font-extrabold text-[10px] sm:text-base text-[#1a1f36] truncate">
                          ₹{rowTotal.toFixed(0)}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#d97706] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.15)] z-40 px-2 sm:px-4 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-poppins text-gray-500 font-bold uppercase">Total Items</span>
              <span className="font-serif font-bold text-base sm:text-xl text-gray-900">{getTotalItems()}</span>
            </div>
            <div className="w-px h-6 sm:h-8 bg-gray-200 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-poppins text-gray-500 font-bold uppercase">Total Amount</span>
              <span className="font-poppins font-extrabold text-base sm:text-xl text-[#d97706]">₹{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <select 
              defaultValue=""
              onChange={(e) => scrollToCategory(e.target.value)}
              className="flex-1 sm:w-48 bg-gray-50 border border-gray-300 text-gray-900 text-[10px] sm:text-sm rounded-lg focus:ring-[#d97706] focus:border-[#d97706] block p-2 sm:p-2.5 outline-none cursor-pointer font-semibold"
            >
              <option value="" disabled>Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button 
              onClick={toggleCart}
              className="flex-1 sm:flex-none bg-[#0f172a] hover:bg-[#d97706] text-white font-poppins font-bold text-[10px] sm:text-sm px-4 sm:px-8 py-2 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" /> NEXT
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};