import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function notifyUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  type: string,
  message: string,
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    message,
  });
}
