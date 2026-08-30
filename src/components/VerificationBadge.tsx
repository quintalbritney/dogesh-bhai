import type { VerificationStatus } from "@/lib/supabase/types";

const LABEL: Record<VerificationStatus, string> = {
  verified: "🟢 Verified",
  community: "🟡 Community logged",
  unverified: "⚪ Unverified",
  disputed: "🔴 Disputed",
};

export default function VerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  return (
    <span className="whitespace-nowrap rounded-full border px-2 py-0.5 text-xs">
      {LABEL[status]}
    </span>
  );
}
