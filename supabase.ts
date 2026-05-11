
import { createClient } from '@supabase/supabase-js';

/**
 * SUPABASE CONFIGURATION
 * ------------------------------------
 * Updated with the valid anon key provided by the user to resolve auth issues.
 */

const SUPABASE_URL = 'https://gkhuoypdfqqveoinkzcg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdraHVveXBkZnFxdmVvaW5remNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzc2MDksImV4cCI6MjA4NTcxMzYwOX0.pd0cZtc3VocTRRmWNg9gOJOb8O5X-GJzP-LSMZf7lHY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});

export const isSupabaseConfigured = () => {
    // Basic check for a valid-looking JWT key
    return !!supabase && SUPABASE_ANON_KEY.length > 50;
};
