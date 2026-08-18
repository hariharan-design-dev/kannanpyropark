'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Plus, Edit2, RefreshCw, X, Image as ImageIcon, Eye, EyeOff, UploadCloud, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  // State for file uploads
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    image_url: '', 
    is_active: true
  });

  // Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin-login');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setProducts(data);
      const uniqueCategories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      setCategories(['All Categories', ...uniqueCategories]);
    }
    
    setLoading(false);
    setIsRefreshing(false);
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !currentStatus } : p));
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', productId);
    if (error) {
      alert('Failed to update status: ' + error.message);
      fetchProducts(true);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: '', price: '', image_url: '', is_active: true });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      image_url: product.image_url || '',
      is_active: product.is_active
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: '' }); 
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalImageUrl = formData.image_url;

    // Bucket Upload Logic
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(uniqueFileName, imageFile);

      console.log(uploadData);

      if (uploadError) {
        alert('Image upload failed: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(uniqueFileName);

    console.log(publicUrlData);
        
      finalImageUrl = publicUrlData.publicUrl;
    }

    if(editingProduct && editingProduct.image_url && editingProduct.image_url != finalImageUrl) {
        if(editingProduct.image_url.includes('supabase.co/storage')) {
            const oldFileName = editingProduct.image_url.split('/').pop();
            if(oldFileName) {
                await supabase.storage.from('product-images').remove([oldFileName]);
            }
        }
    }

    const productPayload = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      image_url: finalImageUrl,
      is_active: formData.is_active
    };

    let error, data;

    // --- IMPROVED SAVE LOGIC ---
    // We use .select() to get the saved row back immediately
    if (editingProduct) {
      // Update
      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', editingProduct.id)
        .select();
      error = updateError;
      data = updateData;
    } else {
      // Insert
      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert([productPayload])
        .select();
      error = insertError;
      data = insertData;
    }

    setSaving(false);

    if (error) {
      alert('Failed to save product: ' + error.message);
    } else if (data && data.length > 0) {
      // --- INSTANT UI UPDATE ---
      const savedProduct = data[0];
      
      if (editingProduct) {
        // Replace the old product in the local state
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? savedProduct : p));
      } else {
        // Add the new product to the front of the local list
        setProducts(prev => [savedProduct, ...prev]);
        
        // Ensure new categories are added to the filter dropdown
        if (savedProduct.category && !categories.includes(savedProduct.category)) {
          setCategories(prev => [...prev, savedProduct.category].sort());
        }
      }

      // --- INSTANT MODAL CLOSE ---
      setIsModalOpen(false);
    } else {
      // Fallback if PostgREST didn't return data (rare latency issue)
      fetchProducts(true);
      setIsModalOpen(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin-login');
      return;
    }

    // 1. CLEANUP STORAGE BUCKET
    // If the product has an image hosted in OUR Supabase bucket...
    if (productToDelete.image_url && productToDelete.image_url.includes('supabase.co/storage')) {
      // Extract the filename from the end of the URL
      const fileName = productToDelete.image_url.split('/').pop();
      if (fileName) {
        // PERMANENTLY DELETE THE OLD FILE
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove([fileName]);
        
        if (storageError) {
          console.error('Storage cleanup failed during delete:', storageError.message);
          // We continue anyway; database deletion is the priority.
        }
      }
    }

    // 2. DELETE FROM DATABASE
    const { error: dbError } = await supabase
      .from('products')
      .delete()
      .eq('id', productToDelete.id);

    setDeleting(false);

    if (dbError) {
      alert('Failed to delete product from database: ' + dbError.message);
    } else {
      // 3. INSTANT UI UPDATE
      // Remove the product from the local list
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      
      // Close all modals
      setIsDeleteModalOpen(false);
      setIsModalOpen(false); // Close the Edit modal if it was open
      
      // Clear deletion targets
      setProductToDelete(null);
      setEditingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-sm text-gray-500 mt-1">Add, edit, and manage visibility of your fireworks inventory.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => fetchProducts(true)}
              disabled={isRefreshing}
              className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button 
              onClick={openAddModal}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-poppins font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADD PRODUCT
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-black"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-black font-semibold cursor-pointer"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-gray-700">No Products Found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting filters or add a new product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${product.is_active ? 'border-gray-200 hover:shadow-md' : 'border-gray-200 opacity-60'}`}>
                
                <div className="relative h-48 bg-slate-100 flex items-center justify-center border-b border-gray-100 group">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md
                      ${product.is_active ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}
                    >
                      {product.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <span className="font-poppins text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{product.category}</span>
                  <h3 className="font-serif font-bold text-gray-900 leading-tight mb-2 flex-1">{product.name}</h3>
                  <div className="font-poppins font-bold text-blue-700 text-lg mb-4">₹{product.price}</div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleToggleActive(product.id, product.is_active)}
                      className={`flex-1 py-2 rounded-md font-poppins text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer
                        ${product.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                      {product.is_active ? <><EyeOff className="w-3.5 h-3.5"/> Disable</> : <><Eye className="w-3.5 h-3.5"/> Enable</>}
                    </button>
                    <button 
                      onClick={() => openEditModal(product)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-md font-poppins text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5"/> Edit
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- ADD/EDIT PRODUCT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="font-serif text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 font-noto space-y-6">
              
              <div className="space-y-2">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name *</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Premium Gold Sparklers 10cm"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Category *</label>
                  <input 
                    type="text" required
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g. Sparklers"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categories.filter(c => c !== 'All Categories').map((c, i) => <option key={i} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹) *</label>
                  <input 
                    type="number" required min="0" step="0.01"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none"
                  />
                </div>
              </div>

              {/* Dual Image Input Section */}
              <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Product Image</label>
                
                {/* Visual Preview */}
                {(imagePreview || formData.image_url) && (
                  <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden border border-gray-200 mb-3 relative">
                    <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="space-y-3">
                  {/* Upload Local File */}
                  <label className="flex items-center justify-center w-full bg-white border border-dashed border-gray-300 rounded-lg px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                      <span className="text-sm font-semibold text-gray-600">Upload from Device</span>
                      <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">OR</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  {/* Paste Web URL */}
                  <input 
                    type="url" 
                    value={formData.image_url} 
                    onChange={e => {
                      setFormData({...formData, image_url: e.target.value});
                      setImageFile(null); // Clear local file if they paste a URL
                      setImagePreview('');
                    }}
                    placeholder="Paste a web URL..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div>
                    <p className="font-poppins font-bold text-sm text-gray-900">Show to Customers</p>
                    <p className="font-noto text-xs text-gray-500">If disabled, it will be hidden from the storefront.</p>
                  </div>
                </label>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* --- NEW: Danger Zone (Visible only during edit) --- */}
                {editingProduct ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      setProductToDelete(editingProduct);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-700 font-poppins font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4"/> DELETE PRODUCT
                  </button>
                ) : (
                  <div /> /* Empty spacer for layout alignment during Add */
                )}

                {/* Standard Actions (Aligned Right) */}
                <div className="flex gap-3 justify-end w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</>
                      ) : (
                        editingProduct ? 'Save Changes' : 'Create Product'
                      )}
                    </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- NEW: DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 border-4 border-red-50">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Delete Product Permanently?</h2>
            
            <p className="font-noto text-sm text-gray-600 leading-relaxed mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{productToDelete.name}"</span>? This action cannot be undone and the stored image will be permanently removed from the bucket.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <button 
                type="button" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                disabled={deleting}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-poppins font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                No, Keep Product
              </button>
              <button 
                type="button" 
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-poppins font-bold text-sm px-6 py-3 rounded-lg transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin"/> Deleting...</>
                ) : (
                    'Yes, Delete permanently'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}