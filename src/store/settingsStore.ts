import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

interface SiteSettings {
  hero_bg_url: string;
  hero_subtitle: string;
  hero_subtitle_color: string;
  hero_title_main: string;
  hero_title_main_color: string;
  hero_title_highlight: string;
  hero_title_highlight_color: string;
  hero_description: string;
  hero_description_color: string;
  footer_about: string;
  footer_address: string;
  footer_phones: string[];
  footer_emails: string[];
  footer_facebook: string;
  footer_instagram: string;
  footer_twitter: string;
  min_order_value: number;
}

interface SettingsState {
  settings: SiteSettings | null;
  loading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: true,
  fetchSettings: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data && !error) {
      set({ settings: data as SiteSettings, loading: false });
    } else {
      console.error("Failed to load site settings:", error);
      set({ loading: false });
    }
  },
}));