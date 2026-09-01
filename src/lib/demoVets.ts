// Demo vet clinics for trying out the nearest-vets feature before real
// clinics are added. Clearly fictional (matches the "Seed demo dogs"
// pattern) — seeded only when an admin explicitly clicks the button, never
// silently.
export const demoVets: {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
}[] = [
  {
    name: "Satellite Road Pet Clinic",
    address: "Near Jodhpur Char Rasta, Satellite Road, Ahmedabad",
    phone: "079-1234-5001",
    lat: 23.0301,
    lng: 72.5158,
  },
  {
    name: "Navrangpura Animal Hospital",
    address: "C.G. Road, Navrangpura, Ahmedabad",
    phone: "079-1234-5002",
    lat: 23.0339,
    lng: 72.5615,
  },
  {
    name: "Maninagar Veterinary Care",
    address: "Rambaug Road, Maninagar, Ahmedabad",
    phone: "079-1234-5003",
    lat: 22.9963,
    lng: 72.5993,
  },
  {
    name: "Vastrapur Street Animal Trust",
    address: "Near Vastrapur Lake, Ahmedabad",
    phone: "079-1234-5004",
    lat: 23.0367,
    lng: 72.5296,
  },
  {
    name: "Bopal Community Vet Center",
    address: "South Bopal Main Road, Ahmedabad",
    phone: "079-1234-5005",
    lat: 23.0327,
    lng: 72.4695,
  },
];
