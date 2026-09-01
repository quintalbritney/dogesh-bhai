"use client";

import { useState } from "react";
import { createVet } from "@/app/vets/actions";
import SubmitButton from "@/components/SubmitButton";

export default function AddVetForm() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function useCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("This browser doesn't support location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setError("Couldn't get your location, check location permissions."),
    );
  }

  return (
    <form action={createVet} className="card flex flex-col gap-2 p-3">
      <p className="text-sm font-medium">Add a vet</p>
      <input name="name" required placeholder="Clinic or vet name" className="input" />
      <input name="address" placeholder="Address" className="input" />
      <input name="phone" placeholder="Phone" className="input" />

      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          className="btn-outline btn-sm"
        >
          📍 Use my current location
        </button>
        {coords && <span className="text-xs text-status-good">Location set</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <SubmitButton
        pendingText="Adding…"
        className="btn-primary btn-sm self-start"
      >
        Add vet
      </SubmitButton>
    </form>
  );
}
