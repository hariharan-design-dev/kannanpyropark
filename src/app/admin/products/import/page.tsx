'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, ArrowRight, Settings, CheckCircle2, Loader2, Edit3, ChevronDown, ChevronUp, Link as LinkIcon, Info, Trash2, Database } from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { createClient } from '@/utils/supabase/client';

const DATABASE_FIELDS = [
  { key: 'name', label: 'Product Name', required: true },
  { key: 'category', label: 'Category', required: true },
  { key: 'price', label: 'Price (Rate)', required: true },
  { key: 'unit_type', label: 'Unit Type (Per)', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'youtube_url', label: 'YouTube Link', required: false },
  { key: 'instagram_url', label: 'Instagram Link', required: false },
];

const VALID_UNITS = ['piece', 'packet', 'box', 'set'];

export default function BulkImportPage() {
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'UPDATE' | 'SKIP'>('ALL');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, failed: 0 });

  // --- STEP 1: FILE UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      const cleanData = rawData.filter(row => row.length > 0);
      
      if (cleanData.length > 0) {
        const headers = cleanData[0].map(String);
        
        const dataObjects = cleanData.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? row[index] : null;
          });
          return obj;
        });

        setExcelHeaders(headers);
        setExcelData(dataObjects);
        
        const autoMap: Record<string, string> = {};
        headers.forEach(h => {
          const lowerH = h.toLowerCase();
          if (lowerH.includes('name') || lowerH.includes('product')) autoMap['name'] = h;
          if (lowerH.includes('rate') || lowerH.includes('price') || lowerH.includes('amt')) autoMap['price'] = h;
          if (lowerH.includes('per') || lowerH.includes('unit')) autoMap['unit_type'] = h;
          if (lowerH.includes('category')) autoMap['category'] = h;
        });
        setMappings(autoMap);
        setStep(2); 
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // --- STEP 2: GENERATE PREVIEW ---
  const proceedToPreview = async () => {
    const missing = DATABASE_FIELDS.filter(f => f.required && !mappings[f.key]);
    if (missing.length > 0) {
      alert(`Please map the required fields: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setStep(3);
    setIsLoadingPreview(true);

    const formattedUploads = excelData.map((row, index) => {
      let unit = String(row[mappings['unit_type']] || '').trim().toLowerCase();
      if (unit.includes('pkt') || unit.includes('pack')) unit = 'packet';
      if (unit.includes('pcs') || unit.includes('pc')) unit = 'piece';
      
      return {
        _tempId: index,
        name: String(row[mappings['name']] || '').trim(),
        category: String(row[mappings['category']] || '').trim(),
        price: parseFloat(row[mappings['price']]) || 0,
        unit_type: unit || 'piece',
        description: mappings['description'] ? String(row[mappings['description']] || '') : undefined,
        youtube_url: mappings['youtube_url'] ? String(row[mappings['youtube_url']] || '') : undefined,
        instagram_url: mappings['instagram_url'] ? String(row[mappings['instagram_url']] || '') : undefined,
        is_active: false,
        isExpanded: false
      };
    }).filter(item => item.name && item.category); 

    const { data: existingProducts } = await supabase.from('products').select('*');
    const existingMap = new Map();
    existingProducts?.forEach(p => {
      existingMap.set(`${p.name.toLowerCase()}_${p.category.toLowerCase()}`, p);
    });

    const preview = formattedUploads.map(item => {
      const key = `${item.name.toLowerCase()}_${item.category.toLowerCase()}`;
      const existing = existingMap.get(key);

      if (!existing) {
        return { 
          ...item, 
          description: item.description || '',
          youtube_url: item.youtube_url || '',
          instagram_url: item.instagram_url || '',
          status: 'NEW' 
        };
      }

      // Attach existing ID to allow Supabase to UPDATE the row instead of duplicating
      const merged: any = {
        ...item,
        id: existing.id, 
        description: item.description !== undefined ? item.description : (existing.description || ''),
        youtube_url: item.youtube_url !== undefined ? item.youtube_url : (existing.youtube_url || ''),
        instagram_url: item.instagram_url !== undefined ? item.instagram_url : (existing.instagram_url || ''),
        unit_type: item.unit_type || existing.unit_type || 'piece',
        originalDbData: existing
      };

      const isDifferent =
        existing.name !== merged.name || // Catches case sensitivity changes
        existing.category !== merged.category || 
        Number(existing.price) !== Number(merged.price) ||
        String(existing.unit_type || '').toLowerCase() !== String(merged.unit_type || '').toLowerCase() ||
        String(existing.description || '').trim() !== String(merged.description || '').trim() ||
        String(existing.youtube_url || '').trim() !== String(merged.youtube_url || '').trim() ||
        String(existing.instagram_url || '').trim() !== String(merged.instagram_url || '').trim();

      merged.status = isDifferent ? 'UPDATE' : 'SKIP';
      return merged;
    });

    setPreviewItems(preview);
    setIsLoadingPreview(false);
  };

  // --- STEP 3: SMART INLINE EDITING ---
  const handleCellEdit = (index: number, field: string, value: any) => {
    const updated = [...previewItems];
    const item = updated[index];
    item[field] = value;

    if (item.originalDbData) {
      const orig = item.originalDbData;
      
      const nameLower = String(item.name).trim().toLowerCase();
      const catLower = String(item.category).trim().toLowerCase();
      const origNameLower = String(orig.name).trim().toLowerCase();
      const origCatLower = String(orig.category).trim().toLowerCase();

      // If the actual word changed (not just case), it's a completely NEW product
      const isKeyChangedFundamentally = nameLower !== origNameLower || catLower !== origCatLower;
      
      if (isKeyChangedFundamentally) {
        item.status = 'NEW';
        delete item.id; // Remove ID so Supabase creates a new row
      } else {
        item.id = orig.id; // Keep ID so Supabase UPDATES the existing row
        
        const isDataChanged =
          orig.name !== item.name || // Catches case changes (e.g. sparkler vs Sparkler)
          orig.category !== item.category ||
          Number(orig.price) !== Number(item.price) ||
          String(orig.unit_type || 'piece').toLowerCase() !== String(item.unit_type || 'piece').toLowerCase() ||
          String(orig.description || '').trim() !== String(item.description || '').trim() ||
          String(orig.youtube_url || '').trim() !== String(item.youtube_url || '').trim() ||
          String(orig.instagram_url || '').trim() !== String(item.instagram_url || '').trim();
        
        item.status = isDataChanged ? 'UPDATE' : 'SKIP';
      }
    } else {
      item.status = 'NEW';
    }

    setPreviewItems(updated);
  };

  const toggleExpand = (index: number) => {
    const updated = [...previewItems];
    updated[index].isExpanded = !updated[index].isExpanded;
    setPreviewItems(updated);
  };

  const handleRemoveItem = (tempId: number) => {
    setPreviewItems(prev => prev.filter(item => item._tempId !== tempId));
  };

  // --- STEP 4: BATCH UPLOAD WITH PROGRESS ---
  const executeBulkUpload = async () => {
    const itemsToUpload = previewItems
      .filter(i => i.status !== 'SKIP')
      .map(({ status, originalDbData, isExpanded, _tempId, ...dbData }) => dbData);

    if (itemsToUpload.length === 0) {
      alert("No new items or updates to upload.");
      return;
    }

    setStep(4);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: itemsToUpload.length, failed: 0 });

    const BATCH_SIZE = 50;
    let failedCount = 0;

    for (let i = 0; i < itemsToUpload.length; i += BATCH_SIZE) {
      const batch = itemsToUpload.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('products').upsert(batch, { onConflict: 'name,category' });
      
      if (error) {
        console.error("Batch error:", error);
        failedCount += batch.length;
      }

      setUploadProgress(prev => ({ 
        ...prev, 
        current: Math.min(prev.current + batch.length, prev.total),
        failed: failedCount 
      }));
    }

    setIsUploading(false);
  };

  const displayedItems = filter === 'ALL' ? previewItems : previewItems.filter(i => i.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20">
      <AdminHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Smart Bulk Import</h1>
            <p className="text-sm text-gray-500 mt-1">Upload, map, edit, and safely sync thousands of products.</p>
          </div>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`w-3 h-3 rounded-full ${step >= s ? 'bg-[#d97706]' : 'bg-gray-300'}`} />
            ))}
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200 text-center animate-in fade-in zoom-in-95 duration-300 mt-4">
            <UploadCloud className="w-16 h-16 text-[#d97706] mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-gray-800 mb-2">Upload Excel File</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              Select your structured .xlsx or .csv price list. We will automatically extract the raw data grid.
            </p>
            <label className="bg-[#0f172a] hover:bg-black text-white px-8 py-3 rounded-lg font-bold cursor-pointer transition-colors shadow-sm inline-block">
              Browse Files
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-right-4 duration-300 mt-4">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <Settings className="w-6 h-6 text-[#d97706]" />
              <h3 className="font-serif text-xl text-gray-800 font-bold">Map Your Columns</h3>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm p-4 rounded-lg mb-8 flex gap-3">
              <Info className="w-5 h-5 shrink-0" />
              <p>We found <strong>{excelHeaders.length} columns</strong>. Match them below. Unmapped fields will be ignored, preserving any existing data in the database.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {DATABASE_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <span className="font-poppins text-sm font-bold text-gray-800">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <select 
                    value={mappings[field.key] || ''}
                    onChange={(e) => setMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex-1 border border-gray-300 text-gray-800 rounded-md px-3 py-2 text-sm outline-none focus:border-[#d97706] bg-white cursor-pointer w-full"
                  >
                    <option value="">-- Ignore --</option>
                    {excelHeaders.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
              <button onClick={() => setStep(1)} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                Back
              </button>
              <button onClick={proceedToPreview} className="bg-[#d97706] hover:bg-yellow-600 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
                Generate Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & INLINE EDITING */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-right-4 duration-300 mt-4">
            
            {/* Header & Filters */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-white rounded-t-2xl">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold flex items-center gap-2 text-black"><Edit3 className="w-5 h-5 text-[#d97706]"/> Command Center</h3>
                  <p className="text-xs text-gray-500 mt-1">Review, tweak values, delete rows, or expand to add media links manually.</p>
                  
                  {/* Mapped Columns Summary */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Database className="w-3 h-3"/> Mapped:</span>
                    {Object.entries(mappings).map(([dbKey, xlHead]) => (
                      <span key={dbKey} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                        {DATABASE_FIELDS.find(f => f.key === dbKey)?.label}: <span className="text-blue-600">{xlHead}</span>
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto hide-scrollbar">
                  {[
                    { id: 'ALL', label: 'All', count: previewItems.length },
                    { id: 'NEW', label: 'New', count: previewItems.filter(i => i.status === 'NEW').length },
                    { id: 'UPDATE', label: 'Updates', count: previewItems.filter(i => i.status === 'UPDATE').length },
                    { id: 'SKIP', label: 'Skipped', count: previewItems.filter(i => i.status === 'SKIP').length }
                  ].map(f => (
                    <button 
                      key={f.id}
                      onClick={() => setFilter(f.id as any)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${filter === f.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Body (Natural Scroll) */}
            {isLoadingPreview ? (
              <div className="py-32 flex flex-col items-center justify-center bg-gray-50/50">
                <Loader2 className="w-8 h-8 animate-spin text-[#d97706] mb-4" />
                <p className="text-sm font-bold text-gray-500">Cross-referencing database...</p>
              </div>
            ) : (
              <div className="bg-gray-50/50 p-4 sm:p-6 space-y-4">
                {displayedItems.length === 0 && (
                  <div className="text-center py-20 text-gray-500 font-bold">No products match this filter.</div>
                )}
                
                {displayedItems.map((item) => {
                  const globalIdx = previewItems.findIndex(p => p._tempId === item._tempId);
                  const isInvalidUnit = !VALID_UNITS.includes(item.unit_type);
                  
                  const isNameChanged = item.originalDbData && item.originalDbData.name !== item.name;
                  const isCategoryChanged = item.originalDbData && item.originalDbData.category !== item.category;
                  const isPriceChanged = item.originalDbData && Number(item.originalDbData.price) !== Number(item.price);
                  const isUnitChanged = item.originalDbData && String(item.originalDbData.unit_type).toLowerCase() !== String(item.unit_type).toLowerCase();
                  const isDescChanged = item.originalDbData && String(item.originalDbData.description || '').trim() !== String(item.description || '').trim();
                  const isYtChanged = item.originalDbData && String(item.originalDbData.youtube_url || '').trim() !== String(item.youtube_url || '').trim();
                  const isIgChanged = item.originalDbData && String(item.originalDbData.instagram_url || '').trim() !== String(item.instagram_url || '').trim();

                  return (
                    <div key={item._tempId} className={`bg-white border rounded-xl shadow-sm transition-all overflow-hidden ${item.status === 'NEW' ? 'border-green-200' : item.status === 'UPDATE' ? 'border-yellow-300' : 'border-gray-200 opacity-80 hover:opacity-100'}`}>
                      
                      <div className="p-4 flex flex-col gap-4">
                        
                        <div className="flex justify-between items-center">
                           <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase shrink-0 ${item.status === 'NEW' ? 'bg-green-100 text-green-700' : item.status === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.status}
                          </span>
                          <button 
                            onClick={() => handleRemoveItem(item._tempId)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer"
                            title="Remove from import"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mt-2">
                          <div className="sm:col-span-3 space-y-1 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
                            <input 
                              value={item.category} 
                              onChange={(e) => handleCellEdit(globalIdx, 'category', e.target.value)}
                              className={`w-full bg-gray-50 border rounded-md px-3 py-2 text-xs font-bold transition-colors outline-none focus:border-[#d97706] ${isCategoryChanged ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-200 text-gray-700'}`}
                            />
                            {isCategoryChanged && <span className="absolute -top-1 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: {item.originalDbData.category}</span>}
                          </div>

                          <div className="sm:col-span-4 space-y-1 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Product Name</label>
                            <input 
                              value={item.name} 
                              onChange={(e) => handleCellEdit(globalIdx, 'name', e.target.value)}
                              className={`w-full bg-gray-50 border rounded-md px-3 py-2 text-sm font-serif font-bold transition-colors outline-none focus:border-[#d97706] ${isNameChanged ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-200 text-gray-900'}`}
                            />
                            {isNameChanged && <span className="absolute -top-1 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: {item.originalDbData.name}</span>}
                          </div>

                          <div className="sm:col-span-2 space-y-1 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Price</label>
                            <span className="absolute left-3 top-7 text-gray-400 text-xs font-bold">₹</span>
                            <input 
                              type="number"
                              value={item.price} 
                              onChange={(e) => handleCellEdit(globalIdx, 'price', parseFloat(e.target.value) || 0)}
                              className={`w-full pl-6 bg-gray-50 border rounded-md pr-2 py-2 text-sm font-bold outline-none transition-colors focus:border-[#d97706] ${isPriceChanged ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-200 text-blue-700'}`}
                            />
                            {isPriceChanged && <span className="absolute -top-1 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: ₹{item.originalDbData.price}</span>}
                          </div>

                          <div className="sm:col-span-3 space-y-1 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Unit Type</label>
                            <input 
                              value={item.unit_type} 
                              onChange={(e) => handleCellEdit(globalIdx, 'unit_type', e.target.value.toLowerCase())}
                              className={`w-full bg-gray-50 border rounded-md px-3 py-2 text-sm outline-none transition-colors focus:border-[#d97706] ${isInvalidUnit ? 'text-red-600 font-bold border-red-400 bg-red-50' : isUnitChanged ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-gray-200 text-gray-700'}`}
                            />
                            {isUnitChanged && <span className="absolute -top-1 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: {item.originalDbData.unit_type}</span>}
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-100 pt-3">
                          <button 
                            onClick={() => toggleExpand(globalIdx)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                          >
                            Customize Media & Details {item.isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                          </button>
                        </div>
                      </div>

                      {item.isExpanded && (
                        <div className="p-4 bg-slate-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 relative">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                            {isDescChanged && <span className="absolute top-0 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: {item.originalDbData.description || 'Empty'}</span>}
                            <textarea 
                              value={item.description || ''} 
                              onChange={(e) => handleCellEdit(globalIdx, 'description', e.target.value)}
                              placeholder="Add details manually..."
                              className={`w-full border rounded-md px-3 py-2 text-xs outline-none focus:border-[#d97706] h-20 resize-none text-gray-800 ${isDescChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'}`}
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-1 relative">
                              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3"/> YouTube Link</label>
                              {isYtChanged && <span className="absolute top-0 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: {item.originalDbData.youtube_url || 'Empty'}</span>}
                              <input 
                                value={item.youtube_url || ''} 
                                onChange={(e) => handleCellEdit(globalIdx, 'youtube_url', e.target.value)}
                                placeholder="Paste link..."
                                className={`w-full border rounded-md px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#d97706] ${isYtChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'}`}
                              />
                            </div>
                            <div className="space-y-1 relative">
                              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Instagram Link</label>
                              {isIgChanged && <span className="absolute top-0 right-0 text-[9px] text-yellow-600 font-bold bg-yellow-50 px-1 rounded">Was: {item.originalDbData.instagram_url || 'Empty'}</span>}
                              <input 
                                value={item.instagram_url || ''} 
                                onChange={(e) => handleCellEdit(globalIdx, 'instagram_url', e.target.value)}
                                placeholder="Paste link..."
                                className={`w-full border rounded-md px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#d97706] ${isIgChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer Actions - Now scrolling naturally at the bottom */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-2xl mt-4">
              <p className="text-xs text-gray-500 font-noto">
                <span className="font-bold text-[#d97706]">Ready?</span> Only "New" and "Update" rows will be pushed to the database.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => setStep(2)} className="flex-1 sm:flex-none px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  Back
                </button>
                <button 
                  onClick={executeBulkUpload} 
                  disabled={previewItems.filter(i => i.status !== 'SKIP').length === 0 || isUploading}
                  className="flex-1 sm:flex-none bg-[#0f172a] hover:bg-black text-white px-8 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin"/> Uploading...</> : 'Save & Import Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LIVE UPLOAD PROGRESS */}
        {step === 4 && (
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-200 text-center max-w-lg mx-auto mt-10 animate-in zoom-in-95 duration-300">
            {isUploading ? (
              <>
                <Loader2 className="w-16 h-16 text-[#d97706] animate-spin mx-auto mb-6" />
                <h3 className="font-serif text-2xl font-bold mb-2">Syncing to Database...</h3>
                <p className="text-gray-500 text-sm mb-6">Please do not close this window.</p>
                
                <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden border border-gray-200">
                  <div 
                    className="bg-[#d97706] h-4 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="font-poppins font-bold text-sm text-gray-700">
                  {uploadProgress.current} / {uploadProgress.total} Products
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />
                <h3 className="font-serif text-3xl font-bold text-gray-900 mb-2">Import Complete!</h3>
                <p className="text-gray-600 text-sm mb-8">
                  Successfully pushed <strong>{uploadProgress.current - uploadProgress.failed}</strong> products to the store.
                  {uploadProgress.failed > 0 && <span className="text-red-500 font-bold block mt-2">Failed to import {uploadProgress.failed} items.</span>}
                </p>
                <button 
                  onClick={() => window.location.href = '/admin/products'}
                  className="bg-[#0f172a] hover:bg-black text-white px-8 py-3 rounded-lg font-bold w-full transition-colors cursor-pointer shadow-md"
                >
                  Return to Product Catalog
                </button>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}