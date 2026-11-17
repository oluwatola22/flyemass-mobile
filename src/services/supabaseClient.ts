import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  'https://oalpwwreypjprsmkcdvq.supabase.co';

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbHB3d3JleXBqcHJzbWtjZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3NjA1MzMsImV4cCI6MjExMDMzNjUzM30.rb4IHUMRt9bQQyMXL_Ank-Ggi-mL76dcUuwui7jqouU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export const SUPABASE_CONFIG = {
  projectId: 'oalpwwreypjprsmkcdvq',
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  region: 'eu-north-1',
  status: 'ACTIVE_HEALTHY'
};
