import type { Restaurant } from "../data/restaurants";

const FALLBACK_RESTAURANT_IMAGE = "";

const DEFAULT_PRICE_RANGE = "££";

const CATEGORY_KEYWORDS: Array<{ venueType: string; terms: string[] }> = [
  {
    venueType: "desserts",
    terms: [
      "dessert",
      "desserts",
      "ice cream",
      "sweet",
      "waffle",
      "cake",
      "pastry",
      "gelato",
      "sundae",
    ],
  },
  {
    venueType: "bakery",
    terms: ["bakery", "bakehouse", "patisserie", "croissant", "bread", "buns"],
  },
  {
    venueType: "quick_bite",
    terms: [
      "burger",
      "fast food",
      "fast-food",
      "takeaway",
      "take out",
      "sandwich",
      "wrap",
      "fries",
      "kebab",
      "pizza slice",
    ],
  },
  {
    venueType: "cafe",
    terms: ["cafe", "coffee", "espresso", "tea room", "brunch", "lounge"],
  },
];

function inferVenueType(restaurant: any) {
  const haystack = [restaurant.name, restaurant.cuisine, restaurant.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const category of CATEGORY_KEYWORDS) {
    if (category.terms.some((term) => haystack.includes(term))) {
      return category.venueType;
    }
  }

  return restaurant.venueType || "restaurant";
}

export function mapBackendRestaurantToCard(restaurant: any): Restaurant {
  return {
    id: String(restaurant._id || restaurant.id || ""),
    name: restaurant.name || "Restaurant",
    cuisine: restaurant.cuisine || "Unknown",
    venueType: inferVenueType(restaurant),
    priceRange: restaurant.priceRange || DEFAULT_PRICE_RANGE,
    rating: Number(restaurant.averageRating ?? restaurant.rating ?? 0),
    distance: Number(restaurant.distance ?? 0),
    image: restaurant.image || FALLBACK_RESTAURANT_IMAGE,
    isSaved: Boolean(restaurant.isBookmarkedByMe),
    address: restaurant.location?.address || restaurant.address || "",
    description: restaurant.description || "",
    menuItems: Array.isArray(restaurant.menuItems) ? restaurant.menuItems : [],
  };
}
