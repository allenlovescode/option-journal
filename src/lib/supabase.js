import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://ptkmfjjzuevfyrbrxudg.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0a21mamp6dWV2ZnlyYnJ4dWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTYxOTIsImV4cCI6MjA5NTYzMjE5Mn0.UwdR2k6durevKo_u18X70D35kXgS0WjCl0eVqaqO4lw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
