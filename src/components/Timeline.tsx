import type { TimelineEvent } from "@/lib/supabase/types";
import { timeAgo } from "@/lib/dates";

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-neutral-500">No events yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-3 border-l pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-neutral-400" />
          <p className="text-sm">{event.description}</p>
          <p className="text-xs text-neutral-400">{timeAgo(event.created_at)}</p>
        </li>
      ))}
    </ol>
  );
}
