
import { createClient } from '@supabase/supabase-js';

/**
 * PRODUCTION SUPABASE CONFIGURATION
 * ------------------------------------
 */
const RAW_URL = 'https://tnvpngdqhxidmekekbkx.supabase.co';
const RAW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRudnBuZ2RxaHhpZG1lcWVrYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzQ4NzksImV4cCI6MjA4NTUxMDg3OX0.sXf98TK3X7O4nRrI7UKbP0GSp_RfGJhtwrSMVgmF7t8';

// Sanitize inputs to prevent trailing spaces or character issues
const SUPABASE_URL = RAW_URL.trim();
const SUPABASE_ANON_KEY = RAW_KEY.trim();

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

export const isSupabaseConfigured = () => {
    return !!supabase && SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
};
