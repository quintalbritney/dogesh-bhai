"use client";

import { useState } from "react";

export default function PhotoUploadField({
  name = "photo",
  existingUrl,
}: {
  name?: string;
  existingUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  const shown = preview ?? existingUrl ?? null;

  return (
    <div className="flex flex-col gap-2">
      {shown && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt="Selected dog photo"
          className="aspect-square w-28 rounded-xl border object-cover"
        />
      )}
      <label className="text-sm font-medium">
        {existingUrl ? "Replace photo" : "Photo"}
        <input
          type="file"
          name={name}
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="input mt-1 w-full"
        />
      </label>
      <p className="text-xs text-muted">
        Tap to take a photo, or choose one from your gallery.
      </p>
    </div>
  );
}
