import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import VetsList from "@/components/VetsList";
import AddVetForm from "@/components/AddVetForm";
import { seedDemoVets } from "@/app/vets/actions";
import type { Vet } from "@/lib/supabase/types";

export default async function VetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile();
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: vets } = await supabase.from("vets").select("*");
  const canAddVet = profile.role === "admin" || profile.role === "ngo";
  const isAdmin = profile.role === "admin";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Nearest vets</h1>
          <p className="mt-1 text-sm text-muted">
            Real vets and clinics added by admins and NGOs, sorted by distance
            from you.
          </p>
        </div>
        {isAdmin && (vets ?? []).length === 0 && (
          <form action={seedDemoVets}>
            <button className="btn-outline btn-sm">🩺 Seed demo vets</button>
          </form>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {canAddVet && (
        <div className="mt-6">
          <AddVetForm />
        </div>
      )}

      <div className="mt-6">
        <VetsList vets={(vets ?? []) as Vet[]} />
      </div>
    </main>
  );
}
