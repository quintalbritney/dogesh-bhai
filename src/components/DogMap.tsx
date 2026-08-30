"use client";

import dynamic from "next/dynamic";
import type { Dog } from "@/lib/supabase/types";

const DogMapClient = dynamic(() => import("@/components/DogMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-md border text-sm text-neutral-500">
      Loading map…
    </div>
  ),
});

export default function DogMap({ dogs }: { dogs: Dog[] }) {
  return <DogMapClient dogs={dogs} />;
}
