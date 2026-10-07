const img = (color, text, w = 500, h = 700) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${color};stop-opacity:1"/><stop offset="100%" style="stop-color:#1A0E14;stop-opacity:0.8"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><text x="${w/2}" y="${h/2 - 16}" font-family="Georgia,serif" font-size="22" text-anchor="middle" fill="#D4A94A">${text}</text><text x="${w/2}" y="${h/2 + 18}" font-family="Georgia,serif" font-size="13" text-anchor="middle" fill="rgba(255,255,255,0.55)">Lakshmi Vastra Studio</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const sqImg = (color, text) => img(color, text, 300, 300);

export const PRODUCTS = [
  {
    id: 1,
    name: "Kanjeevaram Silk Saree",
    images: [img("#7B1D45", "Kanjeevaram Silk"), img("#591430", "Kanjeevaram Detail")],
    price: 12500,
    mrp: 15000,
    fabric: "Pure Kanjeevaram Silk",
    occasion: "Wedding & Bridal",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["#7B1D45", "#B8892A", "#2D5016"],
    isNew: true,
  },
  {
    id: 2,
    name: "Banarasi Georgette Saree",
    images: [img("#8B6914", "Banarasi Georgette"), img("#6B5010", "Banarasi Detail")],
    price: 8900,
    mrp: 11000,
    fabric: "Banarasi Georgette",
    occasion: "Festive Ethnic",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["#B8892A", "#7B1D45", "#1A0E14"],
    isNew: true,
  },
  {
    id: 3,
    name: "Chiffon Evening Saree",
    images: [img("#2D2D6B", "Chiffon Evening"), img("#1A1A4A", "Chiffon Detail")],
    price: 5500,
    mrp: 7000,
    fabric: "Pure Chiffon",
    occasion: "Evening",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["#2D2D6B", "#D4A94A", "#FFFFFF"],
    isNew: true,
  },
  {
    id: 4,
    name: "Tussar Silk Casual Drape",
    images: [img("#5C4A2A", "Tussar Silk"), img("#4A3A1E", "Tussar Detail")],
    price: 4200,
    mrp: 5500,
    fabric: "Tussar Silk",
    occasion: "Casual Day",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["#8B7355", "#D4A94A", "#F0E0B8"],
    isNew: true,
  },
  {
    id: 5,
    name: "Bridal Lehenga Set",
    images: [img("#6B0F30", "Bridal Lehenga"), img("#530C25", "Lehenga Detail")],
    price: 25000,
    mrp: 32000,
    fabric: "Heavy Silk with Zari",
    occasion: "Wedding & Bridal",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["#6B0F30", "#B8892A", "#FFFFFF"],
    isNew: false,
  },
  {
    id: 6,
    name: "Cotton Handloom Saree",
    images: [img("#1E5C3A", "Cotton Handloom"), img("#154A2C", "Handloom Detail")],
    price: 2800,
    mrp: 3500,
    fabric: "Handloom Cotton",
    occasion: "Casual Day",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["#2E6B4A", "#F0E0B8", "#7B1D45"],
    isNew: true,
  },
];

export const SHOWCASE_LOOKS = [
  {
    id: 1,
    index: "01",
    name: "Bridal Lehenga",
    fabric: "Heavy Silk · Zari Embroidery",
    price: "₹25,000",
    bg: "linear-gradient(150deg,#2A0612 0%,#6B0F30 60%,#7B1D45 100%)",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#7B1D45", "#B8892A", "#FFFFFF"],
    image: img("#6B0F30", "Bridal Lehenga"),
  },
  {
    id: 2,
    index: "02",
    name: "Kanjeevaram Silk",
    fabric: "Pure Silk · Temple Border",
    price: "₹12,500",
    bg: "linear-gradient(150deg,#0D1A0D 0%,#1A4A1A 60%,#2D6B2D 100%)",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#2D6B2D", "#B8892A", "#7B1D45"],
    image: img("#1A4A1A", "Kanjeevaram Silk"),
  },
  {
    id: 3,
    index: "03",
    name: "Chiffon Evening",
    fabric: "Pure Chiffon · Hand-painted",
    price: "₹8,500",
    bg: "linear-gradient(150deg,#0D0D2A 0%,#1A1A4A 60%,#2D2D6B 100%)",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#2D2D6B", "#D4A94A", "#F0E0B8"],
    image: img("#1A1A4A", "Chiffon Evening"),
  },
  {
    id: 4,
    index: "04",
    name: "Banarasi Festive",
    fabric: "Banarasi Silk · Zari Weave",
    price: "₹9,500",
    bg: "linear-gradient(150deg,#1A0D00 0%,#4A2A00 60%,#6B3A00 100%)",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#6B3A0A", "#B8892A", "#7B1D45"],
    image: img("#4A2A00", "Banarasi Festive"),
  },
];

export const OCCASIONS = [
  { id: 1, name: "Wedding & Bridal", image: img("#6B0F30", "Wedding & Bridal", 400, 700) },
  { id: 2, name: "Evening Wear", image: img("#1A1A4A", "Evening Wear", 400, 400) },
  { id: 3, name: "Casual Day", image: img("#1E5C3A", "Casual Day", 400, 400) },
  { id: 4, name: "Festive Ethnic", image: img("#4A2A00", "Festive Ethnic", 400, 400) },
];

export const TESTIMONIALS_DATA = [
  { id: 1, name: "Priya Sharma", avatar: "P", rating: 5, text: "The Kanjeevaram saree I ordered was absolutely stunning. The quality is unmatched and the delivery was prompt.", product: "Kanjeevaram Silk Saree" },
  { id: 2, name: "Meera Nair", avatar: "M", rating: 5, text: "Draped in pure elegance for my daughter's wedding. Every guest asked where I got this gorgeous lehenga.", product: "Bridal Lehenga Set" },
  { id: 3, name: "Ananya Patel", avatar: "A", rating: 5, text: "The chiffon saree is perfect for evening events. Lightweight, beautiful, and exactly as described.", product: "Chiffon Evening Saree" },
];

export const LOOKBOOK_IMAGES = [
  img("#7B1D45", "Look 01", 380, 560),
  img("#B8892A", "Look 02", 380, 560),
  img("#2D2D6B", "Look 03", 380, 560),
  img("#2D6B2D", "Look 04", 380, 560),
  img("#6B3A0A", "Look 05", 380, 560),
  img("#4A0A1A", "Look 06", 380, 560),
];

export const INSTAGRAM_IMAGES = [
  sqImg("#7B1D45", "@lvstudio"),
  sqImg("#B8892A", "@lvstudio"),
  sqImg("#2D2D6B", "@lvstudio"),
  sqImg("#1E5C3A", "@lvstudio"),
  sqImg("#6B3A0A", "@lvstudio"),
  sqImg("#4A0A1A", "@lvstudio"),
  sqImg("#591430", "@lvstudio"),
  sqImg("#8B6914", "@lvstudio"),
];
