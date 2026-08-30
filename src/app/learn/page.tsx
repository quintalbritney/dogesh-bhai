import { createClient } from "@/lib/supabase/server";
import PawPrint from "@/components/PawPrint";
import type { Organisation } from "@/lib/supabase/types";

const HYGIENE_TIPS = [
  {
    title: "Clean water, always",
    body: "A shallow bowl of fresh water matters more than food in hot weather. Change it daily — stagnant water breeds disease.",
  },
  {
    title: "Check for ticks and wounds weekly",
    body: "Run your hands along the back, ears, and paws. Ticks cluster around ears and between toes. A small wound left untreated can turn septic fast in street conditions.",
  },
  {
    title: "Deworming, twice a year",
    body: "Community dogs pick up intestinal worms from scavenging. A vet-prescribed deworming tablet every 6 months keeps them healthier and reduces spread to puppies.",
  },
  {
    title: "Sterilise, don't just feed",
    body: "Feeding without sterilisation just means more puppies born into the same hardship. ABC (Animal Birth Control) programs are free through most municipal corporations.",
  },
];

const FIRST_AID_TIPS = [
  {
    title: "Approach slowly, from the side",
    body: "An injured dog is a scared dog. Don't approach head-on or reach over its head. Speak low and calm, let it see your hands.",
  },
  {
    title: "Muzzle before treating a painful wound",
    body: "Even the gentlest dog may bite out of pain. A soft cloth or leash looped gently around the muzzle (never over the nose if it's struggling to breathe) protects both of you.",
  },
  {
    title: "Clean, don't disinfect aggressively",
    body: "Rinse wounds with clean water or saline. Avoid strong antiseptics like neat Dettol directly on open wounds — they can damage tissue. Get to a vet within hours for anything deep.",
  },
  {
    title: "Heatstroke is an emergency",
    body: "Heavy panting, drooling, wobbling, or collapse in hot weather — move to shade immediately, offer water, wet the paws and belly with cool (not ice-cold) water, and get to a vet.",
  },
  {
    title: "Hit by a vehicle? Don't move it unnecessarily",
    body: "Internal injuries aren't visible. If the dog can't stand, support it flat on a board or firm cloth to transport — dragging or lifting by the middle can worsen spinal injuries.",
  },
];

const FAQS = [
  {
    q: "Is it safe to touch a street dog I don't know?",
    a: "Let the dog approach you first if possible. Avoid sudden movements, direct staring, or reaching over its head. If it's growling, cowering, or showing teeth, give it space and report the case instead of forcing contact.",
  },
  {
    q: "Why sterilise instead of relocating a dog?",
    a: "Relocation just creates a territory vacuum that another dog fills — the population doesn't actually drop, and the relocated dog often can't survive in unfamiliar territory. Sterilisation (ABC) is the only method shown to reduce numbers over time.",
  },
  {
    q: "What vaccinations does a community dog need?",
    a: "Anti-rabies is the priority and is usually free through municipal drives. A full vaccination series (as advised by a vet) covers distemper, parvovirus, and other common risks too.",
  },
  {
    q: "A dog is aggressive towards people on my street — what do I do?",
    a: "Report it through this app's emergency flow with the location and details. Sudden aggression is often pain, fear, or a protective response (e.g. nursing puppies nearby) rather than random hostility — a vet or experienced handler should assess it, not the public.",
  },
];

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("organisations")
    .select("*")
    .eq("verification_status", "verified");

  const verifiedOrgs = (orgs ?? []) as Organisation[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <PawPrint className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-2 text-3xl font-bold">Learn to help, safely</h1>
        <p className="quote mt-2 text-muted">
          Everything you do, do it with love — and a little know-how.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-secondary">🧼 Basic hygiene</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {HYGIENE_TIPS.map((tip) => (
            <div key={tip.title} className="card p-4">
              <p className="font-semibold">{tip.title}</p>
              <p className="mt-1 text-sm text-muted">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-secondary">🩹 First aid basics</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {FIRST_AID_TIPS.map((tip) => (
            <div key={tip.title} className="card p-4">
              <p className="font-semibold">{tip.title}</p>
              <p className="mt-1 text-sm text-muted">{tip.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          None of this replaces a vet. For anything serious, report it through{" "}
          <a href="/dogs" className="underline">
            a dog&apos;s passport page
          </a>{" "}
          so a verified responder can act.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-secondary">❓ Frequently asked</h2>
        <div className="mt-4 flex flex-col gap-2">
          {FAQS.map((item) => (
            <details key={item.q} className="card p-4">
              <summary className="cursor-pointer font-semibold">{item.q}</summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-secondary">📍 Get help nearby</h2>
        {verifiedOrgs.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            {verifiedOrgs.map((org) => (
              <div key={org.id} className="card p-4">
                <p className="font-semibold">{org.name}</p>
                <p className="text-sm text-muted">{org.type ?? "Organisation"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card mt-4 p-4 text-sm text-muted">
            No verified NGOs or vets are listed for this area yet. If you run
            one, ask an admin to add and verify your organisation from the
            console so caregivers can find you here.
          </div>
        )}
      </section>
    </main>
  );
}
