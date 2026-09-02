import PawPrint from "@/components/PawPrint";
import { createClient } from "@/lib/supabase/server";
import { listDogPhotos, pickRandom } from "@/lib/dogPhotoStorage";

export default async function AuthShell({
  quote,
  children,
}: {
  quote: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const bucketPhotos = await listDogPhotos(supabase);
  const gridPhotos = pickRandom(bucketPhotos, 4);

  return (
    <main className="flex h-[calc(100vh-57px)] min-h-0 flex-1 overflow-hidden">
      <div className="relative hidden w-1/2 overflow-hidden bg-primary/10 md:block">
        {gridPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 p-1">
            {gridPhotos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.fileName}
                src={photo.url}
                alt="A community dog on Dogesh Bhai"
                className="h-[calc((100vh-69px)/2)] w-full rounded-xl object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="flex h-[calc(100vh-57px)] w-full items-center justify-center text-primary">
            <PawPrint className="h-20 w-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute right-6 top-6 rotate-12 text-white/80">
          <PawPrint className="paw-float h-14 w-14" />
        </div>
        <div className="absolute bottom-10 left-8 right-8 text-white">
          <PawPrint className="h-6 w-6 text-white/90" />
          <p className="quote mt-3 text-xl">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center overflow-y-auto px-6 py-16 md:w-1/2">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
