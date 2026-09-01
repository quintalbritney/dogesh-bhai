"use client";

import { useEffect, useState } from "react";
import type { Vet } from "@/lib/supabase/types";

function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VetsList({ vets }: { vets: Vet[] }) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(() =>
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "This browser doesn't support location."
      : null,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setLocationError("Location not available, showing all vets alphabetically."),
    );
  }, []);

  const sorted = origin
    ? [...vets].sort(
        (a, b) => distanceKm(origin, a) - distanceKm(origin, b),
      )
    : [...vets].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      {locationError && (
        <p className="mb-3 text-xs text-muted">{locationError}</p>
      )}
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">
          No vets have been added yet. Once an admin or NGO adds one here,
          it&apos;ll show up for everyone.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((vet) => (
            <li key={vet.id} className="card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{vet.name}</p>
                {origin && (
                  <span className="text-xs text-muted">
                    {distanceKm(origin, vet).toFixed(1)} km
                  </span>
                )}
              </div>
              {vet.address && <p className="text-muted">{vet.address}</p>}
              {vet.phone && <p className="text-muted">{vet.phone}</p>}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${vet.lat},${vet.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-medium text-primary underline"
              >
                Get directions
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
