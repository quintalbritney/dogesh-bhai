import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import PawPrint from "@/components/PawPrint";
import { seedDemoNgos } from "@/app/console/actions";
import type { Organisation } from "@/lib/supabase/types";

const HYGIENE_TIPS = [
  {
    title: "Clean water, always",
    body: "A shallow bowl of fresh water matters more than food in hot weather. Change it daily, stagnant water breeds disease.",
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
    body: "Rinse wounds with clean water or saline. Avoid strong antiseptics like neat Dettol directly on open wounds, they can damage tissue. Get to a vet within hours for anything deep.",
  },
  {
    title: "Heatstroke is an emergency",
    body: "Heavy panting, drooling, wobbling, or collapse in hot weather: move to shade immediately, offer water, wet the paws and belly with cool (not ice-cold) water, and get to a vet.",
  },
  {
    title: "Hit by a vehicle? Don't move it unnecessarily",
    body: "Internal injuries aren't visible. If the dog can't stand, support it flat on a board or firm cloth to transport. Dragging or lifting by the middle can worsen spinal injuries.",
  },
];

const FAQS = [
  {
    q: "Is it safe to touch a street dog I don't know?",
    a: "Let the dog approach you first if possible. Avoid sudden movements, direct staring, or reaching over its head. If it's growling, cowering, or showing teeth, give it space and report the case instead of forcing contact.",
  },
  {
    q: "Why sterilise instead of relocating a dog?",
    a: "Relocation just creates a territory vacuum that another dog fills, the population doesn't actually drop, and the relocated dog often can't survive in unfamiliar territory. Sterilisation (ABC) is the only method shown to reduce numbers over time.",
  },
  {
    q: "What vaccinations does a community dog need?",
    a: "Anti-rabies is the priority and is usually free through municipal drives. A full vaccination series (as advised by a vet) covers distemper, parvovirus, and other common risks too.",
  },
  {
    q: "A dog is aggressive towards people on my street, what do I do?",
    a: "Report it through this app's emergency flow with the location and details. Sudden aggression is often pain, fear, or a protective response (e.g. nursing puppies nearby) rather than random hostility, a vet or experienced handler should assess it, not the public.",
  },
  {
    q: "What does 'PawPass ID' actually mean for a doggo?",
    a: "It's a permanent record tied to one specific dog, not a person or a location. Once a dog is registered, every feeding, sighting, health event, and QR collar scan attaches to that same ID forever, so the dog's story doesn't get lost just because a different volunteer is on duty that week.",
  },
  {
    q: "I found a litter of puppies, what now?",
    a: "Puppies are fragile: keep handling brief and gentle, don't separate them from the mother if she's nearby (she's their best chance), and get them onto the app so a caregiver and, once old enough, a vet visit can be scheduled. Avoid giving cow's milk, it upsets their stomachs, plain water is safer until a vet weighs in.",
  },
  {
    q: "How is this different from just feeding a dog myself?",
    a: "Feeding is wonderful and still the most important daily act of care, this app doesn't replace it. What it adds is memory: a health history a vet can actually use, a caregiver team so one missed day doesn't mean a missed week, and a way for an NGO or municipal officer to find the dog again for vaccination or registration instead of starting from scratch.",
  },
  {
    q: "What's a 'care gap' and why does it matter?",
    a: "It means no active caregiver is currently assigned, so there's a real risk feeding or health checks quietly stop. It's flagged in red on purpose, a wagging tail on a well-fed dog and a care gap can look identical from a distance, the record is what tells the difference.",
  },
  {
    q: "Can I help even if I can't foster or adopt?",
    a: "Yes, and honestly that's most of what this app is built for. A five-minute walk to check a feeding bowl, logging a sighting so someone knows a dog is safe, or submitting a health event after a vet visit all count. Community dogs mostly don't need a new home, they need people who keep showing up where they already are.",
  },
];

export default async function LearnPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: orgs } = await supabase
    .from("organisations")
    .select("*")
    .eq("verification_status", "verified");

  const verifiedOrgs = (orgs ?? []) as Organisation[];
  const isAdmin = profile?.role === "admin";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <PawPrint className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-2 text-3xl font-bold">Learn to help, safely</h1>
        <p className="quote mt-2 text-muted">
          Everything you do, do it with love, and a little know-how.
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
          <Link href="/dogs" className="underline">
            a dog&apos;s passport page
          </Link>{" "}
          so a verified responder can act.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-secondary">❓ Frequently asked</h2>
        <p className="mt-1 text-sm text-muted">
          Everything we get asked most, from first pawprint to full care team.
        </p>
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-secondary">📍 Get help nearby</h2>
          {isAdmin && (
            <form action={seedDemoNgos}>
              <button className="btn-outline btn-sm">🏢 Seed demo NGOs</button>
            </form>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          Looking for the closest clinic instead?{" "}
          <Link href="/vets" className="underline">
            See nearest vets →
          </Link>
        </p>
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
