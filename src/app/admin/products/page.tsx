'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Plus, Edit2, RefreshCw, X, Image as ImageIcon, Eye, EyeOff, UploadCloud, Loader2, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/admin-header';

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

const MAX_FILE_SIZE = 500 * 1024; 

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
  
  // State for file uploads (Main + Gallery)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  
  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    unit_type: 'piece',
    description: '',
    youtube_url: '',
    instagram_url: '',
    image_url: '', 
    gallery_images: [] as string[],
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
      .select('id, name, category, price, unit_type, description, youtube_url, instagram_url, image_url, gallery_images, is_active, created_at')
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
    setFormData({ 
      name: '', category: '', price: '', unit_type: 'piece', description: '', youtube_url: '', instagram_url: '', 
      image_url: '', gallery_images: [], is_active: true 
    });
    setImageFile(null);
    setImagePreview('');
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      price: product.price ? product.price.toString() : '',
      unit_type: product.unit_type || 'piece',
      description: product.description || '',
      youtube_url: product.youtube_url || '',
      instagram_url: product.instagram_url || '',
      image_url: product.image_url || '',
      gallery_images: product.gallery_images || [],
      is_active: product.is_active
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setGalleryFiles([]);
    setGalleryPreviews([]); 
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > MAX_FILE_SIZE) {
        alert('Image exceeds the 500KB limit. Please compress it using a tool like TinyPNG before uploading.');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: '' }); 
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      filesArray.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (oversizedFiles.length > 0) {
        alert(`These files exceed the 500KB limit and were skipped:\n${oversizedFiles.join('\n')}`);
      }

      if (validFiles.length > 0) {
        setGalleryFiles(prev => [...prev, ...validFiles]);
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter(url => url !== urlToRemove)
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalImageUrl = formData.image_url;
    let finalGalleryUrls = [...formData.gallery_images];

    // Upload Main Image
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const uniqueFileName = `main-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(uniqueFileName, imageFile);

      if (uploadError) {
        alert('Main image upload failed: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(uniqueFileName);
      finalImageUrl = publicUrlData.publicUrl;
    }

    // Upload Gallery Images
    if (galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        const fileExt = file.name.split('.').pop();
        const uniqueFileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(uniqueFileName, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(uniqueFileName);
          finalGalleryUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    if (editingProduct) {
      if (editingProduct.image_url && editingProduct.image_url !== finalImageUrl) {
        if (editingProduct.image_url.includes('supabase.co/storage')) {
          const oldFileName = editingProduct.image_url.split('/').pop();
          if (oldFileName) await supabase.storage.from('product-images').remove([oldFileName]);
        }
      }

      const originalGallery = editingProduct.gallery_images || [];
      const removedImages = originalGallery.filter((oldUrl: string) => !finalGalleryUrls.includes(oldUrl));
      
      if (removedImages.length > 0) {
        const filesToRemove: string[] = [];
        removedImages.forEach((url: string) => {
          if (url.includes('supabase.co/storage')) {
            const fileName = url.split('/').pop();
            if (fileName) filesToRemove.push(fileName);
          }
        });
        if (filesToRemove.length > 0) {
          await supabase.storage.from('product-images').remove(filesToRemove);
        }
      }
    }

    const productPayload = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      unit_type: formData.unit_type,
      description: formData.description,
      youtube_url: formData.youtube_url,
      instagram_url: formData.instagram_url,
      image_url: finalImageUrl,
      gallery_images: finalGalleryUrls,
      is_active: formData.is_active
    };

    let error;
    let savedProduct = null;

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', editingProduct.id);
        
      error = updateError;
      if (!error) savedProduct = { ...editingProduct, ...productPayload };
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert([productPayload])
        .select('id, created_at') // Only fetch the newly generated ID
        .single();
        
      error = insertError;
      if (!error && insertData) savedProduct = { ...productPayload, id: insertData.id, created_at: insertData.created_at };
    }

    setSaving(false);

    if (error) {
      alert('Failed to save product: ' + error.message);
    } else if (savedProduct) {
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? savedProduct : p));
      } else {
        setProducts(prev => [savedProduct, ...prev]);
        if (savedProduct.category && !categories.includes(savedProduct.category)) {
          setCategories(prev => [...prev, savedProduct.category].sort());
        }
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const filesToDelete: string[] = [];
    
    if (productToDelete.image_url?.includes('supabase.co/storage')) {
      const fileName = productToDelete.image_url.split('/').pop();
      if (fileName) filesToDelete.push(fileName);
    }

    if (productToDelete.gallery_images?.length > 0) {
      productToDelete.gallery_images.forEach((url: string) => {
        if (url.includes('supabase.co/storage')) {
          const fileName = url.split('/').pop();
          if (fileName) filesToDelete.push(fileName);
        }
      });
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from('product-images').remove(filesToDelete);
    }

    const { error: dbError } = await supabase.from('products').delete().eq('id', productToDelete.id);

    setDeleting(false);

    if (dbError) {
      alert('Failed to delete product: ' + dbError.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setIsDeleteModalOpen(false);
      setIsModalOpen(false); 
      setProductToDelete(null);
      setEditingProduct(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-sm text-gray-500 mt-1">Add, edit, and manage visibility of your fireworks inventory.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={() => fetchProducts(true)}
              disabled={isRefreshing}
              className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button 
              onClick={() => router.push('/admin/products/import')}
              className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-poppins font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> BULK IMPORT
            </button>
            <button 
              onClick={openAddModal}
              className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-poppins font-bold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
                  
                  {/* Gallery Indicator */}
                  {product.gallery_images?.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> +{product.gallery_images.length}
                    </div>
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
                  <h3 className="font-serif font-bold text-gray-900 leading-tight mb-2 flex-1 line-clamp-1">{product.name}</h3>
                  <div className="font-poppins font-bold text-blue-700 text-lg mb-4">
                    ₹{product.price} <span className="text-xs text-gray-500 font-normal">/ {product.unit_type || 'piece'}</span>
                  </div>
                  
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
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="font-serif text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 font-noto space-y-8">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="font-poppins text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Basic Information</h3>
                
                <div className="space-y-2">
                  <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name *</label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Premium Gold Sparklers 10cm"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="space-y-2">
                    <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Type *</label>
                    <input 
                      type="text"
                      required
                      value={formData.unit_type} 
                      onChange={e => setFormData({...formData, unit_type: e.target.value.toLowerCase()})}
                      placeholder="e.g. piece, box, bundle"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none"
                      list="unit-suggestions"
                    />
                    <datalist id="unit-suggestions">
                      <option value="piece" />
                      <option value="packet" />
                      <option value="box" />
                      <option value="set" />
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the product effects, duration, and details..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black outline-none min-h-[100px] resize-y"
                  />
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-6">
                <h3 className="font-poppins text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Media & Social</h3>
                
                {/* Main Thumbnail */}
                <div className="space-y-2">
                  <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Thumbnail (Max 500KB) *</label>
                  <div className="flex gap-4 items-start">
                    {(imagePreview || formData.image_url) ? (
                      <div className="w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 shrink-0 bg-slate-50 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6 mb-1"/>
                        <span className="text-[9px]">Main Image</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                       <label className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <span className="text-sm font-semibold text-gray-600 flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Select Main Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                      <input 
                        type="url" 
                        value={formData.image_url} 
                        onChange={e => {
                          setFormData({...formData, image_url: e.target.value});
                          setImageFile(null); setImagePreview('');
                        }}
                        placeholder="Or paste main image URL..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 text-black outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Gallery Images */}
                <div className="space-y-2">
                  <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">Gallery Images (Max 500KB each)</label>
                  
                  <div className="flex flex-wrap gap-3 mb-3">
                    {formData.gallery_images.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExistingGalleryImage(url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {galleryPreviews.map((url, idx) => (
                      <div key={`new-${idx}`} className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden border border-gray-200 border-dashed group">
                        <img src={url} alt={`New Gallery ${idx}`} className="w-full h-full object-cover opacity-70" />
                        <button type="button" onClick={() => removeGalleryFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="w-20 h-20 bg-gray-50 border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">
                      <Plus className="w-6 h-6 mb-1"/>
                      <span className="text-[9px] font-semibold text-center leading-tight">Add<br/>Photos</span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryChange} />
                    </label>
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <YoutubeIcon className="w-3.5 h-3.5"/> YouTube Link
                    </label>
                    <input 
                      type="url" 
                      value={formData.youtube_url} onChange={e => setFormData({...formData, youtube_url: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 text-black outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <InstagramIcon className="w-3.5 h-3.5"/> Instagram Link
                    </label>
                    <input 
                      type="url" 
                      value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})}
                      placeholder="https://instagram.com/p/..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 text-black outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Visibility Toggle */}
              <div className="pt-2 border-t border-gray-100">
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
                
                {/* Danger Zone */}
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
                  <div />
                )}

                {/* Standard Actions */}
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

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 border-4 border-red-50">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Delete Product Permanently?</h2>
            <p className="font-noto text-sm text-gray-600 leading-relaxed mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{productToDelete.name}"</span>? This action cannot be undone and all associated images will be permanently removed from the bucket.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <button 
                type="button" 
                onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
                disabled={deleting}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-poppins font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                No, Keep
              </button>
              <button 
                type="button" 
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-poppins font-bold text-sm px-6 py-3 rounded-lg transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin"/> Deleting...</> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}