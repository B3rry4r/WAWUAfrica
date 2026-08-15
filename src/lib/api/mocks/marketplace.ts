import type { MarketplaceProduct, Shop } from "@/types/marketplace";

export const SHOPS: Record<Shop["id"], Shop> = {
  basket: {
    id: "basket",
    name: "WAWUBasket",
    tagline: "Fashion, food, art, household",
    stat: "4,120 items",
    categories: ["All", "Fashion", "Food", "Art", "Home"],
  },
  beauty: {
    id: "beauty",
    name: "WAWUBeauty",
    tagline: "Hair, nails, skin, wellness",
    stat: "890 services",
    categories: ["All", "Hair", "Nails", "Skin", "Spa"],
  },
};

export const MARKETPLACE_ITEMS: MarketplaceProduct[] = [
  {
    id: "ankara-two-piece",
    shop: "basket",
    title: "Ankara two-piece",
    seller: "Ifeanyi Nwosu",
    location: "Aba",
    category: "Fashion",
    price: 18500,
    description:
      "Wax-print top and wrap skirt, fully lined. Send your measurements after ordering — five to seven days to sew, then delivery.",
    facts: ["Delivery nationwide, from ₦2,500", "Made to order · 5 to 7 days"],
    deliveryNote: "Aba · sews to your measurements",
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Fashion designer",
      verification: "verified_business",
      followers: "3.1k",
      wawuId: "wawu-ifeanyi",
    },
  },
  {
    id: "nsukka-oil-print",
    shop: "basket",
    title: "Nsukka oil print",
    seller: "Chidi Umeh",
    location: "Nsukka",
    category: "Art",
    price: 25000,
    description:
      "Original oil on canvas, unframed. Rolled and shipped in a tube — framing is on you.",
    facts: ["Delivery nationwide, from ₦3,000", "One of one · ships in 3 days"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Painter",
      verification: "basic",
      followers: "12",
      wawuId: "wawu-chidi",
    },
  },
  {
    id: "palm-oil-5l",
    shop: "basket",
    title: "Palm oil, 5 litres",
    seller: "Ngozi Eze",
    location: "Enugu",
    category: "Food",
    price: 9800,
    description: "Pressed in Enugu, sold in sealed 5-litre kegs. No blending, no colouring.",
    facts: ["Delivery nationwide, from ₦2,500", "Sealed keg · ships in 2 days"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Farmer",
      verification: "verified_user",
      followers: "310",
    },
  },
  {
    id: "raffia-basket",
    shop: "basket",
    title: "Raffia basket",
    seller: "Musa Danladi",
    location: "Kaduna",
    category: "Home",
    price: 6500,
    description: "Hand-woven raffia with a leather trim. Holds its shape when full.",
    facts: ["Delivery nationwide, from ₦2,000", "In stock · ships next day"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Weaver",
      verification: "basic",
      followers: "410",
      wawuId: "wawu-musa",
    },
  },
  {
    id: "braiding-home-visit",
    shop: "beauty",
    title: "Braiding, home visit",
    seller: "Ngozi Eze",
    location: "Enugu",
    category: "Hair",
    price: 12000,
    description:
      "She comes to you with everything needed. Knotless, box or cornrows — say which when you book.",
    facts: ["Home visit within Enugu", "3 to 5 hours depending on style"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Braider",
      verification: "verified_user",
      followers: "310",
    },
  },
  {
    id: "gel-manicure",
    shop: "beauty",
    title: "Gel manicure",
    seller: "Amaka Studio",
    location: "Lagos",
    category: "Nails",
    price: 7500,
    description: "Shape, cuticle work and gel colour. Studio appointment, Lekki Phase 1.",
    facts: ["In studio · Lekki Phase 1", "About 90 minutes"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Nail technician",
      verification: "verified_business",
      followers: "540",
    },
  },
  {
    id: "shea-butter-set",
    shop: "beauty",
    title: "Shea butter set",
    seller: "Zainab Bello",
    location: "Kano",
    category: "Skin",
    price: 4200,
    description: "Unrefined shea in three sizes, whipped without fragrance.",
    facts: ["Delivery nationwide, from ₦2,000", "In stock · ships next day"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Skincare",
      verification: "verified_business",
      followers: "1.6k",
      wawuId: "wawu-zainab",
    },
  },
  {
    id: "facial-60",
    shop: "beauty",
    title: "Facial, 60 minutes",
    seller: "Glow Room",
    location: "Abuja",
    category: "Spa",
    price: 15000,
    description: "Cleanse, exfoliate, extract, mask. Bring a note of any product that irritates you.",
    facts: ["In studio · Wuse 2", "60 minutes"],
    // SEAM: replace with GET /api/hub/marketplace/:shop/items/:id — seller card fields
    sellerDetail: {
      role: "Spa therapist",
      verification: "verified_business",
      followers: "890",
    },
  },
];

/** WAWU's own results, shown beneath shop results on marketplace search. */
export const ALSO_ON_WAWU = [
  {
    id: "ankara-course",
    title: "Sewing ankara that fits",
    subtitle: "Course · Ifeanyi Nwosu",
    href: "/learn/courses",
  },
];
