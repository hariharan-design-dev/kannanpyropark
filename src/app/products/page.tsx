'use client';

import React, { useEffect, useState } from 'react';
import { Search, PackageOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useCartStore } from '@/store/cartStore';

export default function ExploreProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const supabase = createClient();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchActiveProducts = async () => {
      // Ensure we only fetch products that the admin has set to active
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (data && !error) {
        setProducts(data);
        
        // Dynamically build the category list based on available products
        const uniqueCategories = Array.from(new Set(data.map(p => p.category)));
        setCategories(['All Categories', ...uniqueCategories]);
      }
      setLoading(false);
    };

    fetchActiveProducts();
  }, []);

  const handleAddToList = (prod: any) => {
    addItem({
      id: prod.id,
      title: prod.name, // Mapping 'name' from DB to 'title' in Zustand store
      price: prod.price,
      category: prod.category,
    });
  };

  // Search & Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#fafafa] font-noto pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-[#1a1f36] mb-3">Explore Fireworks</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Browse our complete catalog of premium crackers. Filter by category, search for your favorites, and build your perfect celebration list.
            </p>
          </div>
          <div className="bg-gray-200/60 px-4 py-2 rounded-full text-xs font-bold text-gray-700 h-fit whitespace-nowrap">
            {filteredProducts.length} Products Available
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category:</span>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold min-w-[200px] outline-none cursor-pointer text-black shadow-sm"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-4 h-[340px]">
                 <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                 <div className="w-2/3 h-4 bg-gray-200 rounded mb-2"></div>
                 <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 text-gray-400 font-poppins flex flex-col items-center">
            <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-gray-500 mb-1">No products found</h3>
            <p className="text-sm">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <div key={prod.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  
                  {/* Image Placeholder / Integration */}
                  <div className="relative w-full h-48 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {prod.category}
                    </span>
                    <h3 className="font-serif font-bold text-base text-black line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>
                  </div>
                  
                  <div className="pt-2 font-poppins font-extrabold text-lg text-black">
                    ₹{prod.price}
                  </div>
                </div>

                <div className="pt-5">
                  <button 
                    onClick={() => handleAddToList(prod)}
                    className="w-full bg-[#0f172a] hover:bg-[#d97706] text-white font-poppins font-semibold text-xs py-3.5 rounded-md transition-colors shadow-sm"
                  >
                    ADD TO LIST
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}