"use client";

import { useState, useTransition } from "react";
import { logLocationPing } from "@/app/dogs/location-actions";
import type { PingSource } from "@/lib/supabase/types";

export default function LogSightingButton({
  dogId,
  pawpassId,
  source = "sighting",
  label = "📍 Log a sighting here",
}: {
  dogId: string;
  pawpassId: string;
  source?: PingSource;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    if (!navigator.geolocation) {
      setError("This browser doesn't support location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        startTransition(() => {
          logLocationPing(dogId, pawpassId, latitude, longitude, source);
        });
      },
      () => setError("Couldn't get your location, check location permissions."),
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="self-start rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {isPending ? "Logging…" : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
