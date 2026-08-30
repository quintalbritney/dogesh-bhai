import { createDog } from "@/app/dogs/actions";
import { requireProfile } from "@/lib/auth";
import SubmitButton from "@/components/SubmitButton";

export default async function NewDogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfile();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">Give a dog a voice 🐾</h1>
      <p className="mt-1 text-sm text-muted">
        This creates a persistent Dogesh Bhai ID for the dog. Fill in what you
        know now — you can add more later.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createDog} className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium">
          Name
          <input
            name="name"
            required
            className="input mt-1 w-full"
            placeholder="Moti"
          />
        </label>

        <label className="text-sm font-medium">
          Photo URL
          <input
            name="photo_url"
            className="input mt-1 w-full"
            placeholder="Paste a link to a clear photo of the dog"
          />
        </label>

        <label className="text-sm font-medium">
          Sex
          <select
            name="sex"
            defaultValue="unknown"
            className="input mt-1 w-full"
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
            className="input mt-1 w-full"
            placeholder="e.g. 2-3 years"
          />
        </label>

        <label className="text-sm font-medium">
          Coat / appearance
          <input
            name="coat_notes"
            className="input mt-1 w-full"
            placeholder="e.g. brown and white, medium fur"
          />
        </label>

        <label className="text-sm font-medium">
          Identification markers
          <input
            name="markers"
            className="input mt-1 w-full"
            placeholder="e.g. notched left ear, white paw"
          />
        </label>

        <label className="text-sm font-medium">
          Usual location
          <input
            name="location_label"
            className="input mt-1 w-full"
            placeholder="e.g. Satellite Road, near the bus stop"
          />
        </label>

        <SubmitButton pendingText="Registering…" className="btn-primary mt-2 w-full py-3">
          Register this dog 🐾
        </SubmitButton>
      </form>
    </main>
  );
}
