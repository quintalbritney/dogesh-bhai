import { dogPortraits, stockPhotos } from "@/lib/stockPhotos";
import type { DogSex, DogStatus } from "@/lib/supabase/types";

// Ahmedabad-area coordinates (matches the PP-PIL pilot city code) so the
// map has real, spread-out markers to demo against.
const AHMEDABAD = { lat: 23.0225, lng: 72.5714 };

function offset(latDelta: number, lngDelta: number) {
  return { lat: AHMEDABAD.lat + latDelta, lng: AHMEDABAD.lng + lngDelta };
}

export const demoDogs: {
  name: string;
  sex: DogSex;
  age_estimate: string;
  coat_notes: string;
  location_label: string;
  photo_url: string;
  status: DogStatus;
  coords: { lat: number; lng: number };
}[] = [
  {
    name: "Bozo",
    sex: "male",
    age_estimate: "3-4 years",
    coat_notes: "Tan with a white blaze",
    location_label: "Satellite Road",
    photo_url: dogPortraits.pariah1,
    status: "well_cared_for",
    coords: offset(0.01, 0.015),
  },
  {
    name: "Patchy",
    sex: "female",
    age_estimate: "2 years",
    coat_notes: "Brown and white patches",
    location_label: "Navrangpura",
    photo_url: dogPortraits.pariah2,
    status: "attention_needed",
    coords: offset(-0.008, 0.02),
  },
  {
    name: "Ronny",
    sex: "male",
    age_estimate: "5+ years",
    coat_notes: "Black and tan",
    location_label: "Maninagar",
    photo_url: dogPortraits.pariah3,
    status: "care_gap",
    coords: offset(0.02, -0.01),
  },
  {
    name: "Suzi",
    sex: "female",
    age_estimate: "1-2 years",
    coat_notes: "Golden, medium fur",
    location_label: "Vastrapur",
    photo_url: dogPortraits.pariahPet,
    status: "well_cared_for",
    coords: offset(-0.015, -0.02),
  },
  {
    name: "Toffee",
    sex: "male",
    age_estimate: "2-3 years",
    coat_notes: "Caramel brown",
    location_label: "Bopal",
    photo_url: dogPortraits.streetDog,
    status: "attention_needed",
    coords: offset(0.03, 0.03),
  },
  {
    name: "Prince",
    sex: "male",
    age_estimate: "4 years",
    coat_notes: "Black with white paws",
    location_label: "Paldi",
    photo_url: stockPhotos.calcutta,
    status: "well_cared_for",
    coords: offset(-0.02, 0.01),
  },
  {
    name: "Lassie",
    sex: "female",
    age_estimate: "3 years",
    coat_notes: "Cream, long ears",
    location_label: "Thaltej",
    photo_url: stockPhotos.dehradun,
    status: "care_gap",
    coords: offset(0.015, -0.025),
  },
  {
    name: "Pixy",
    sex: "female",
    age_estimate: "1 year",
    coat_notes: "Small, black and white",
    location_label: "Chandkheda",
    photo_url: stockPhotos.mumbai,
    status: "attention_needed",
    coords: offset(-0.01, 0.035),
  },
  {
    name: "Puppy",
    sex: "unknown",
    age_estimate: "3 months",
    coat_notes: "Fawn, still growing",
    location_label: "Naranpura",
    photo_url: stockPhotos.feedingPuppies,
    status: "well_cared_for",
    coords: offset(0.005, -0.005),
  },
  {
    name: "Pappu",
    sex: "male",
    age_estimate: "6+ years",
    coat_notes: "Grey muzzle, senior dog",
    location_label: "Isanpur",
    photo_url: stockPhotos.varanasi,
    status: "care_gap",
    coords: offset(-0.025, -0.015),
  },
];
