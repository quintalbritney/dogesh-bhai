import { createDog } from "@/app/dogs/actions";
import { requireProfile } from "@/lib/auth";

export default async function NewDogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfile();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Register a dog</h1>
      <p className="mt-1 text-sm text-neutral-500">
        This creates a persistent Dogesh Bhai ID for the dog. Fill in what you
        know now — you can add photos and health history afterwards.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createDog} className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium">
          Name
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Moti"
          />
        </label>

        <label className="text-sm font-medium">
          Sex
          <select
            name="sex"
            defaultValue="unknown"
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="unknown">Not sure</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <label className="text-sm font-medium">
          Approximate age
          <input
            name="age_estimate"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g. 2-3 years"
          />
        </label>

        <label className="text-sm font-medium">
          Coat / appearance
          <input
            name="coat_notes"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g. brown and white, medium fur"
          />
        </label>

        <label className="text-sm font-medium">
          Identification markers
          <input
            name="markers"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g. notched left ear, white paw"
          />
        </label>

        <label className="text-sm font-medium">
          Usual location
          <input
            name="location_label"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g. Satellite Road, near the bus stop"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-neutral-900 px-3 py-2 text-white"
        >
          Register dog
        </button>
      </form>
    </main>
  );
}
