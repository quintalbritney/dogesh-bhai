// Common, warm Indian street-dog names, used whenever a dog is registered
// from a bare photo with no name attached (e.g. from the dog-photos
// bucket), instead of an ugly filename-derived name.
export const INDIAN_DOG_NAMES = [
  "Preeti",
  "Kiara",
  "Tobo",
  "Bobby",
  "Blackie",
  "Fanta",
  "Kannu",
  "Bhalu",
  "Munna",
  "Munni",
  "Ribbon",
  "Tommy",
  "Tony",
  "Moti",
  "Sheru",
  "Chintu",
  "Lucky",
  "Raja",
  "Rani",
  "Bruno",
  "Kaalu",
  "Julie",
  "Simba",
  "Choti",
];

// Common junk tokens that show up in filename-derived dog names (from
// camera/messaging-app exports), so they can be found and renamed.
const JUNK_NAME_PATTERNS = ["whatsapp", "screenshot", "img_", "image", "dsc_", "photo"];

export function looksLikeJunkName(name: string): boolean {
  const lower = name.toLowerCase();
  return JUNK_NAME_PATTERNS.some((token) => lower.includes(token));
}

export function pickUnusedIndianName(usedNames: Set<string>): string {
  const available = INDIAN_DOG_NAMES.filter((n) => !usedNames.has(n));
  const pool = available.length > 0 ? available : INDIAN_DOG_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}
