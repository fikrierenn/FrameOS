/**
 * Supabase Admin Client (Server-Side)
 * 
 * ⚠️ UYARI: Bu client RLS'i bypass eder!
 * 
 * SADECE şu durumlarda kullanılmalı:
 * - Background job processing (transcription pipeline)
 * - Admin operations
 * - System-level operations
 * 
 * Normal user operations için DAIMA supabaseClient.ts kullanın!
 * 
 * KULLANIM:
 * - API routes (server-side)
 * - Background jobs
 * - Server actions
 * 
 * @example
 * ```typescript
 * import { supabaseAdmin } from '@/lib/supabaseAdmin';
 * 
 * // ❌ YANLIŞ - RLS bypass, tüm user'ların videoları gelir
 * const { data } = await supabaseAdmin
 *   .from('videos')
 *   .select('*');
 * 
 * // ✅ DOĞRU - Manuel user_id filtresi
 * const { data } = await supabaseAdmin
 *   .from('videos')
 *   .select('*')
 *   .eq('user_id', userId);
 * ```
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase admin environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
