/**
 * Supabase Client (Client-Side)
 * 
 * Bu client browser'da çalışır ve RLS (Row Level Security) aktiftir.
 * Kullanıcı sadece kendi verilerini görebilir.
 * 
 * KULLANIM:
 * - Frontend component'lerinde
 * - Client Component'lerde
 * - Browser'da çalışan kodlarda
 * 
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabaseClient';
 * 
 * const { data: videos } = await supabase
 *   .from('videos')
 *   .select('*'); // RLS otomatik sadece user'ın videolarını döner
 * ```
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
