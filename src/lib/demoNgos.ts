// Demo NGO organisations so /learn's "Get help nearby" list and the admin
// console have something to show before real NGOs sign up. Clearly
// fictional, same pattern as demoVets and demoDogs. Note: these are NOT
// selectable in the "Connect to NGO" dropdown on a dog's page, that list
// only shows organisations with a real signed-up NGO-role account linked
// (the security check an org actually belongs to a real NGO), which these
// demo rows deliberately don't have.
export const demoNgos: { name: string; type: string }[] = [
  { name: "Ahmedabad Street Paws Trust", type: "ngo" },
  { name: "Karuna Canine Care Society, Navrangpura", type: "ngo" },
  { name: "Sarvodaya Animal Welfare, Maninagar", type: "ngo" },
  { name: "Prem Paws Foundation, Satellite", type: "ngo" },
  { name: "Vastrapur Strays Welfare Society", type: "ngo" },
  { name: "Bopal Community Dog Welfare Trust", type: "ngo" },
];

// Names this list used before locality suffixes were added, kept only so
// the seed action can find and replace them cleanly if already seeded.
export const legacyDemoNgoNames = [
  "Karuna Canine Care Society",
  "Sarvodaya Animal Welfare",
  "Prem Paws Foundation",
];
