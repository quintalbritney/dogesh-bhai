import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function NavBar() {
  const profile = await getCurrentProfile();

  let unreadCount = 0;
  if (profile) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("read_status", false);
    unreadCount = count ?? 0;
  }

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          🐾 Dogesh Bhai
        </Link>

        {profile ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dogs">All dogs</Link>
            <Link href="/map">Map</Link>
            <Link href="/tasks">Today&apos;s care</Link>
            <Link href="/dogs/new">Register a dog</Link>
            {(profile.role === "vet" || profile.role === "admin") && (
              <Link href="/verify">Verification queue</Link>
            )}
            {(profile.role === "admin" || profile.role === "ngo") && (
              <Link href="/console">Console</Link>
            )}
            <Link href="/notifications">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Link>
            <form action={signOut}>
              <button className="text-neutral-500 underline">Log out</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
