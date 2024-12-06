export function slugify(text: string): string {
  const norwegianChars: { [key: string]: string } = {
    æ: "ae",
    ø: "o",
    å: "a",
    Æ: "AE",
    Ø: "O",
    Å: "A",
  };

  return text
    .toLowerCase()
    .replace(/[æøåÆØÅ]/g, (char) => norwegianChars[char] || char)
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .trim(); // Trim - from start and end
}
