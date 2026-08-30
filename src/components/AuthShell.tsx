import PawPrint from "@/components/PawPrint";
import { stockPhotos } from "@/lib/stockPhotos";

export default function AuthShell({
  quote,
  children,
}: {
  quote: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-57px)] flex-1">
      <div className="relative hidden w-1/2 md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stockPhotos.kozhikode}
          alt="Community street dogs"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-10 left-8 right-8 text-white">
          <PawPrint className="h-6 w-6 text-white/90" />
          <p className="quote mt-3 text-xl">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 md:w-1/2">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
