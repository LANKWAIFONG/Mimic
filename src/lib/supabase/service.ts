import { createClient } from "@supabase/supabase-js";

/** Server-only client using the service role key — bypasses RLS. Never expose to the browser. */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
