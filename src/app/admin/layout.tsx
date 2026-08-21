'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const ADMIN_EMAILS = [process.env.NEXT_PUBLIC_ADMIN_EMAIL];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const verifyAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/admin-login');
        return;
      }

      if (!session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
        router.push('/'); 
        return;
      }

      setIsAuthorized(true);
    };

    verifyAccess();
  }, [router, supabase]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#d97706] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}