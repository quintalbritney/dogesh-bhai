// Free-to-use photos of Indian community dogs, sourced from Wikimedia Commons
// (CC BY-SA / public domain). Credited in the site footer per license terms.
// Fetched via Commons' stable Special:FilePath redirect, which always resolves
// to the current upload.wikimedia.org location for a given file title.

function commonsFile(title: string, width: number) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=${width}`;
}

export const stockPhotos = {
  hero: commonsFile("An Indian Street Dog.jpg", 1600),
  feedingPuppies: commonsFile("A street dog feeding her puppies.jpg", 800),
  kozhikode: commonsFile("Stray dogs from Kozhikode, Kerala, India.jpg", 800),
  dehradun: commonsFile("Indian Street Dog Dehradun.jpg", 800),
  mumbai: commonsFile("Mumbai Street Dog Victor Grigas Random Shots-2.jpg", 800),
  varanasi: commonsFile("A feral dog in Varanasi, Uttar Pradesh, India (2015).jpg", 800),
  calcutta: commonsFile("Calcutta Street Dog.jpg", 800),
} as const;

export const stockPhotoGallery = [
  { src: stockPhotos.feedingPuppies, alt: "A street dog feeding her puppies" },
  { src: stockPhotos.kozhikode, alt: "Stray dogs in Kozhikode, Kerala" },
  { src: stockPhotos.mumbai, alt: "A community dog on a Mumbai street" },
  { src: stockPhotos.dehradun, alt: "An Indian street dog in Dehradun" },
  { src: stockPhotos.varanasi, alt: "A community dog in Varanasi" },
  { src: stockPhotos.calcutta, alt: "A community dog in Calcutta" },
];

// Individual portrait photos used for demo dog profiles.
export const dogPortraits = {
  pariah1: commonsFile("Indian pariah dog 07904.jpg", 800),
  pariah2: commonsFile("Indian pariah dog 07905.jpg", 800),
  pariah3: commonsFile("The Indian Pariah Dog.jpg", 800),
  pariahPet: commonsFile("A Pet Indian Pariah Dog.jpg", 800),
  streetDog: commonsFile("Indian street dog.jpg", 800),
} as const;
