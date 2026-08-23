'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/admin-header';
import { Save, Image as ImageIcon, Plus, Trash2, Loader2, Layout, LayoutPanelTop, Settings, RotateCcw, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero'); // 'hero', 'footer', 'operations'
  
  // Draft & Unsaved State
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const skipAutoSave = useRef(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    hero_bg_url: '',
    hero_subtitle: '', hero_subtitle_color: '#d97706',
    hero_title_main: '', hero_title_main_color: '#ffffff',
    hero_title_highlight: '', hero_title_highlight_color: '#d97706',
    hero_description: '', hero_description_color: '#e5e7eb',
    footer_about: '',
    footer_address: '',
    min_order_value: 2000
  });

  // Dynamic Array States
  const [phones, setPhones] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);

  useEffect(() => {
    fetchSettings();
  }, []);

  // 1. Auto-save draft to localStorage whenever form, phones, or emails change
  useEffect(() => {
    if (!initialDataLoaded) return;

    if(skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }

    const draftData = { form, phones, emails };
    localStorage.setItem('admin_settings_draft', JSON.stringify(draftData));
    setHasUnsavedChanges(true);
  }, [form, phones, emails, initialDataLoaded]);

  // 2. Warn before closing or reloading if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin-login');
      return;
    }

    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();

    // Check for saved local draft
    const savedDraft = localStorage.getItem('admin_settings_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        skipAutoSave.current = true;
        setForm(parsed.form);
        setPhones(parsed.phones || ['']);
        setEmails(parsed.emails || ['']);
        if (parsed.form?.hero_bg_url) setImagePreview(parsed.form.hero_bg_url);
        setInitialDataLoaded(true);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Failed to parse draft:", err);
      }
    }

    if (data && !error) {
      skipAutoSave.current = true;
      setForm({
        hero_bg_url: data.hero_bg_url || '',
        hero_subtitle: data.hero_subtitle || '', hero_subtitle_color: data.hero_subtitle_color || '#d97706',
        hero_title_main: data.hero_title_main || '', hero_title_main_color: data.hero_title_main_color || '#ffffff',
        hero_title_highlight: data.hero_title_highlight || '', hero_title_highlight_color: data.hero_title_highlight_color || '#d97706',
        hero_description: data.hero_description || '', hero_description_color: data.hero_description_color || '#e5e7eb',
        footer_about: data.footer_about || '',
        footer_address: data.footer_address || '',
        min_order_value: data.min_order_value || 2000
      });
      
      if (data.hero_bg_url) setImagePreview(data.hero_bg_url);
      if (data.footer_phones && data.footer_phones.length > 0) setPhones(data.footer_phones);
      if (data.footer_emails && data.footer_emails.length > 0) setEmails(data.footer_emails);
    }

    setInitialDataLoaded(true);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = form.hero_bg_url;

      // Upload new image if chosen
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `hero-bg-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images') // Replace with your actual bucket name
          .upload(fileName, imageFile);

        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        finalImageUrl = publicUrlData.publicUrl;
      }

      const cleanPhones = phones.filter(p => p.trim() !== '');
      const cleanEmails = emails.filter(e => e.trim() !== '');

      const { error } = await supabase
        .from('site_settings')
        .update({
          ...form,
          hero_bg_url: finalImageUrl,
          footer_phones: cleanPhones,
          footer_emails: cleanEmails
        })
        .eq('id', 1);

      if (error) throw new Error(error.message);

      localStorage.removeItem('admin_settings_draft');
      setHasUnsavedChanges(false);
      alert("Settings saved successfully!");
      
    } catch (error: any) {
      console.error(error);
      alert("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDynamicChange = (setter: any, array: string[], index: number, value: string) => {
    const newArr = [...array];
    newArr[index] = value;
    setter(newArr);
  };
  const addDynamicField = (setter: any, array: string[]) => setter([...array, '']);
  const removeDynamicField = (setter: any, array: string[], index: number) => setter(array.filter((_, i) => i !== index));

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    setUpdatingPassword(true);
    
    // Supabase allows authenticated users to update their own passwords directly
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    setUpdatingPassword(false);
    
    if (error) {
      alert("Failed to update password: " + error.message);
    } else {
      alert("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20">
      <AdminHeader />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-black">
        
        {/* Responsive Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Master Settings</h1>
              {hasUnsavedChanges && (
                <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Unsaved Draft
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage hero banner text, background, minimum order limits, and footer contacts.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {hasUnsavedChanges && (
              <button
                onClick={() => {
                  if (confirm("Discard all unsaved edits and reset to database values?")) {
                    localStorage.removeItem('admin_settings_draft');
                    setHasUnsavedChanges(false);
                    fetchSettings();
                  }
                }}
                className="flex-1 md:flex-none justify-center px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Discard
              </button>
            )}
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Scrollable Tabs Bar on Mobile */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-gray-200 mb-6 gap-2 sm:gap-4 pb-0.5">
          <button 
            onClick={() => setActiveTab('hero')} 
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'hero' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutPanelTop className="w-4 h-4" /> Hero Section
          </button>
          <button 
            onClick={() => setActiveTab('footer')} 
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'footer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layout className="w-4 h-4" /> Footer Details
          </button>
          <button 
            onClick={() => setActiveTab('operations')} 
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'operations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" /> Store Operations
          </button>
          <button 
            onClick={() => setActiveTab('security')} 
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>
        </div>

        {/* ================= HERO TAB ================= */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            
            {/* Background Image Upload */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-serif font-bold text-base sm:text-lg mb-3 text-gray-900">Hero Background Image</h3>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-start">
                <div className="w-full sm:w-1/2">
                  <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-blue-600">Click to upload new banner</p>
                    <p className="text-[11px] text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                  </label>
                </div>
                {imagePreview && (
                  <div className="w-full sm:w-1/2 h-36 sm:h-44 rounded-lg border border-gray-200 overflow-hidden relative bg-black">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                        Current Background Preview
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Typography & Color Customization */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 sm:space-y-5">
              <h3 className="font-serif font-bold text-base sm:text-lg mb-1 text-gray-900">Hero Typography & Colors</h3>
              
              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Subtitle Text</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={form.hero_subtitle} 
                    onChange={(e) => setForm({...form, hero_subtitle: e.target.value})} 
                    className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm font-poppins outline-none focus:border-blue-500" 
                    placeholder="e.g. Celebrate with Peace" 
                  />
                  <div className="flex flex-col items-center">
                    <input 
                      type="color" 
                      value={form.hero_subtitle_color} 
                      onChange={(e) => setForm({...form, hero_subtitle_color: e.target.value})} 
                      className="h-9 w-10 sm:w-12 rounded cursor-pointer border border-gray-200" 
                      title="Choose text color"
                    />
                  </div>
                </div>
              </div>

              {/* Main Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Main Title (Line 1)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={form.hero_title_main} 
                    onChange={(e) => setForm({...form, hero_title_main: e.target.value})} 
                    className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm font-serif outline-none focus:border-blue-500" 
                    placeholder="e.g. Celebrate with" 
                  />
                  <input 
                    type="color" 
                    value={form.hero_title_main_color} 
                    onChange={(e) => setForm({...form, hero_title_main_color: e.target.value})} 
                    className="h-9 w-10 sm:w-12 rounded cursor-pointer border border-gray-200" 
                    title="Choose text color"
                  />
                </div>
              </div>

              {/* Highlight Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Highlight Title (Line 2)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={form.hero_title_highlight} 
                    onChange={(e) => setForm({...form, hero_title_highlight: e.target.value})} 
                    className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm font-serif outline-none focus:border-blue-500" 
                    placeholder="e.g. DIVINE LIGHT" 
                  />
                  <input 
                    type="color" 
                    value={form.hero_title_highlight_color} 
                    onChange={(e) => setForm({...form, hero_title_highlight_color: e.target.value})} 
                    className="h-9 w-10 sm:w-12 rounded cursor-pointer border border-gray-200" 
                    title="Choose text color"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Description Paragraph</label>
                <div className="flex items-start gap-2">
                  <textarea 
                    rows={2} 
                    value={form.hero_description} 
                    onChange={(e) => setForm({...form, hero_description: e.target.value})} 
                    className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm outline-none focus:border-blue-500 resize-none" 
                    placeholder="Premium Quality Fireworks from Sivakasi..." 
                  />
                  <input 
                    type="color" 
                    value={form.hero_description_color} 
                    onChange={(e) => setForm({...form, hero_description_color: e.target.value})} 
                    className="h-9 w-10 sm:w-12 rounded cursor-pointer border border-gray-200 mt-1" 
                    title="Choose text color"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= FOOTER TAB ================= */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900">Brand Info & Address</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">About Text</label>
                <textarea 
                  rows={2} 
                  value={form.footer_about} 
                  onChange={(e) => setForm({...form, footer_about: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm outline-none focus:border-blue-500 resize-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Physical Address</label>
                <textarea 
                  rows={2} 
                  value={form.footer_address} 
                  onChange={(e) => setForm({...form, footer_address: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm outline-none focus:border-blue-500 resize-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Phone Numbers */}
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-gray-900">Phone Numbers</h3>
                  <button 
                    onClick={() => addDynamicField(setPhones, phones)} 
                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5"/> Add Phone
                  </button>
                </div>
                <div className="space-y-2.5">
                  {phones.map((phone, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        value={phone} 
                        onChange={(e) => handleDynamicChange(setPhones, phones, idx, e.target.value)} 
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" 
                        placeholder="+91 81900 78401" 
                      />
                      {phones.length > 1 && (
                        <button 
                          onClick={() => removeDynamicField(setPhones, phones, idx)} 
                          className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Emails */}
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-gray-900">Email Addresses</h3>
                  <button 
                    onClick={() => addDynamicField(setEmails, emails)} 
                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5"/> Add Email
                  </button>
                </div>
                <div className="space-y-2.5">
                  {emails.map((email, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => handleDynamicChange(setEmails, emails, idx, e.target.value)} 
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" 
                        placeholder="kannanpyropark@gmail.com" 
                      />
                      {emails.length > 1 && (
                        <button 
                          onClick={() => removeDynamicField(setEmails, emails, idx)} 
                          className="p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= OPERATIONS TAB ================= */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-serif font-bold text-base sm:text-lg mb-2 text-gray-900">Pre-Order Checkout Rules</h3>
              <p className="text-xs text-gray-500 mb-4">Set the minimum cart total required for a customer to submit their pre-order list.</p>
              
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Order Value (₹)</label>
                <input 
                  type="number" 
                  value={form.min_order_value} 
                  onChange={(e) => setForm({...form, min_order_value: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-bold text-lg text-blue-600 outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= SECURITY TAB ================= */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-serif font-bold text-base sm:text-lg mb-2 text-gray-900">Change Admin Password</h3>
              <p className="text-xs text-gray-500 mb-6">Update your login password. You will remain logged in after changing it.</p>
              
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
                    placeholder="Confirm new password"
                  />
                </div>
                
                <button 
                  onClick={handlePasswordUpdate}
                  disabled={updatingPassword || !newPassword || !confirmPassword}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}