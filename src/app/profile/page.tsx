'use client';

import React, { useEffect, useState } from 'react';
import { User, MapPin, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // password update
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/'); // Redirect to home if not logged in
        return;
      }
      
      setSession(session);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone_number || '');
        setAddress(profile.delivery_address || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPassword(true);
    setPasswordMessage('');

    const {error} = await supabase.auth.updateUser({
      password: newPassword
    });

    setUpdatingPassword(false);

    if(error) {
      setPasswordMessage(`Error: ${error.message}`);
    } else {
      setPasswordMessage('Password updated successfully!');
      setNewPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phone,
        delivery_address: address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    setSaving(false);

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Hide success message after 3s
    } else {
      alert('Failed to update profile: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d97706]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] font-noto pb-20 pt-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1a1f36]">Account Profile</h1>
          <p className="text-gray-500 text-sm mt-2">Manage your personal information and default delivery address.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header Profile Block */}
          <div className="bg-[#0f172a] px-8 py-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-white">
              <h2 className="font-serif text-2xl font-bold">{fullName || 'Your Name'}</h2>
              <p className="font-poppins text-sm text-gray-400 mt-1">{session?.user?.email?.replace('@kannanpyropark.com', '')}</p>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#d97706] transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Mobile Number
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#d97706] transition-colors bg-gray-50"
                  maxLength={10}
                  readOnly // Usually, phone number acts as the login ID in this setup, so it shouldn't be editable
                  title="Mobile number cannot be changed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Default Delivery Address
              </label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full delivery address with pincode"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#d97706] transition-colors h-32 resize-none"
                required
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#d97706] hover:bg-yellow-600 disabled:bg-gray-300 text-white font-poppins font-bold text-sm px-8 py-3.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
              </button>
            </div>
          </form>
        </div>


        <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-100">
            <h3 className="font-serif text-xl font-bold text-[#1a1f36]">Security</h3>
            <p className="text-gray-500 text-xs mt-1">Update your account password</p>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="p-8 space-y-4">
            {passwordMessage && (
              <div className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${passwordMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <CheckCircle2 className="w-4 h-4" />
                {passwordMessage}
              </div>
            )}
            
            <div className="space-y-2 max-w-md">
              <label className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-wider">
                New Password
              </label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#d97706] transition-colors"
                minLength={6}
                required
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={updatingPassword || newPassword.length < 6}
                className="bg-[#0f172a] hover:bg-slate-800 disabled:bg-gray-300 text-white font-poppins font-bold text-sm px-8 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'UPDATE PASSWORD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}