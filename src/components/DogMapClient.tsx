"use client";

import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { Dog } from "@/lib/supabase/types";

const STATUS_COLOR: Record<string, string> = {
  well_cared_for: "#22c55e",
  attention_needed: "#eab308",
  care_gap: "#ef4444",
};

function markerIcon(color: string) {
  return L.divIcon({
    html: `<span style="background:${color};width:16px;height:16px;display:block;border-radius:50%;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.5)"></span>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function DogMapClient({ dogs }: { dogs: Dog[] }) {
  const located = dogs.filter(
    (d) => d.current_lat != null && d.current_lng != null,
  );

  const center: [number, number] =
    located.length > 0
      ? [located[0].current_lat as number, located[0].current_lng as number]
      : [23.0225, 72.5714]; // Ahmedabad, as a reasonable default pilot center

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
      className="rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((dog) => (
        <Marker
          key={dog.id}
          position={[dog.current_lat as number, dog.current_lng as number]}
          icon={markerIcon(STATUS_COLOR[dog.status] ?? "#888")}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="!rounded-full !border-0 !bg-header-bg !px-2 !py-0.5 !text-xs !font-bold !text-white !shadow">
            {dog.name}
          </Tooltip>
          <Popup>
            <p className="font-medium">{dog.name}</p>
            <p className="text-xs">{dog.pawpass_id}</p>
            <Link href={`/dogs/${dog.pawpass_id}`} className="text-xs underline">
              View passport
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
