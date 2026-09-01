// Demo vet clinics for trying out the nearest-vets feature before real
// clinics are added. Clearly fictional (matches the "Seed demo dogs"
// pattern), seeded only when an admin explicitly clicks the button, never
// silently.
export const demoVets: {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}[] = [
  {
    name: "Dr. Bhim's Pet Clinic",
    address: "Near Jodhpur Char Rasta, Satellite Road, Ahmedabad",
    phone: "079-1234-5001",
    lat: 23.0301,
    lng: 72.5158,
  },
  {
    name: "Dr. Ruchi's Animal Hospital",
    address: "C.G. Road, Navrangpura, Ahmedabad",
    phone: "079-1234-5002",
    lat: 23.0339,
    lng: 72.5615,
  },
  {
    name: "Dr. Patel's Veterinary Care",
    address: "Rambaug Road, Maninagar, Ahmedabad",
    phone: "079-1234-5003",
    lat: 22.9963,
    lng: 72.5993,
  },
  {
    name: "Dr. Mehta's Pashu Chikitsalay",
    address: "Near Vastrapur Lake, Ahmedabad",
    phone: "079-1234-5004",
    lat: 23.0367,
    lng: 72.5296,
  },
  {
    name: "Dr. Shah's Animal Clinic",
    address: "South Bopal Main Road, Ahmedabad",
    phone: "079-1234-5005",
    lat: 23.0327,
    lng: 72.4695,
  },
  {
    name: "Dr. Desai's Veterinary Center",
    address: "Ashram Road, Paldi, Ahmedabad",
    phone: "079-1234-5006",
    lat: 23.0158,
    lng: 72.5697,
  },
];

// Names this list used before doctor-style names, kept only so the seed
// action can find and replace them cleanly if they were already seeded.
export const legacyDemoVetNames = [
  "Satellite Road Pet Clinic",
  "Navrangpura Animal Hospital",
  "Maninagar Veterinary Care",
  "Vastrapur Street Animal Trust",
  "Bopal Community Vet Center",
];
