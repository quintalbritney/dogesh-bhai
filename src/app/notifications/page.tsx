import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { markAllNotificationsRead } from "@/app/notifications/actions";
import type { Notification } from "@/lib/supabase/types";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const all = (notifications ?? []) as Notification[];
  const hasUnread = all.some((n) => !n.read_status);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button className="text-sm underline">Mark all as read</button>
          </form>
        )}
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {all.map((n) => (
          <li
            key={n.id}
            className={`rounded-md border p-3 text-sm ${n.read_status ? "text-neutral-500" : ""}`}
          >
            <p>{n.message}</p>
            <p className="text-xs text-neutral-400">{timeAgo(n.created_at)}</p>
          </li>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing here yet.</p>
        )}
      </ul>
    </main>
  );
}
