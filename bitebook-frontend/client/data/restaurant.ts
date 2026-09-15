export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  venueType?: string;
  priceRange: string;
  rating: number;
  distance: number;
  image: string;
  isSaved?: boolean;
  hours?: {
    monThu: string;
    friSat: string;
    sun: string;
  };
  address?: string;
  nearestStation?: string;
  phone?: string;
  email?: string;
  description?: string;
  menuItems?: string[];
}

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Bill's",
    cuisine: "Italian",
    priceRange: "££",
    rating: 4.6,
    distance: 0.6,
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/433a8ec051b3313d865c461e1e0a82db3e3e7ed1?width=550",
    isSaved: true,
    hours: {
      monThu: "12:00–22:30",
      friSat: "12:00–23:30",
      sun: "10:00–21:30",
    },
    address: "17 Copper Lane, Shoreditch, London, E2 7JP",
    nearestStation:
      "Old Street (8 min walk) / Shoreditch High Street (10 min walk)",
    phone: "020 7946 2187",
    email: "123@billskitchen.co.uk",
    description:
      "Seasonal comfort food, cooked like you're staying for dessert. Vibe: Warm, casual-upmarket, date-night friendly, good for groups.",
  },
  {
    id: "2",
    name: "Bill's",
    cuisine: "Italian",
    priceRange: "££",
    rating: 4.6,
    distance: 0.6,
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/e26ba4ae9aafde1cc0e3dc16d05b5d1caceca8b0?width=550",
    isSaved: true,
    hours: {
      monThu: "12:00–22:30",
      friSat: "12:00–23:30",
      sun: "10:00–21:30",
    },
    address: "17 Copper Lane, Shoreditch, London, E2 7JP",
    nearestStation:
      "Old Street (8 min walk) / Shoreditch High Street (10 min walk)",
    phone: "020 7946 2187",
    email: "123@billskitchen.co.uk",
    description:
      "Seasonal comfort food, cooked like you're staying for dessert. Vibe: Warm, casual-upmarket, date-night friendly, good for groups.",
  },
  {
    id: "3",
    name: "Bill's",
    cuisine: "Italian",
    priceRange: "££",
    rating: 4.6,
    distance: 0.6,
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/a0aec7389b59c267fe9e6cb147a75e605ac97963?width=550",
    isSaved: true,
    hours: {
      monThu: "12:00–22:30",
      friSat: "12:00–23:30",
      sun: "10:00–21:30",
    },
    address: "17 Copper Lane, Shoreditch, London, E2 7JP",
    nearestStation:
      "Old Street (8 min walk) / Shoreditch High Street (10 min walk)",
    phone: "020 7946 2187",
    email: "123@billskitchen.co.uk",
    description:
      "Seasonal comfort food, cooked like you're staying for dessert. Vibe: Warm, casual-upmarket, date-night friendly, good for groups.",
  },
  {
    id: "4",
    name: "Bill's",
    cuisine: "Italian",
    priceRange: "££",
    rating: 4.6,
    distance: 0.6,
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/857fa986cec4c2e0aa07adc4b025ab3fd28d0b64?width=550",
    isSaved: false,
    hours: {
      monThu: "12:00–22:30",
      friSat: "12:00–23:30",
      sun: "10:00–21:30",
    },
    address: "17 Copper Lane, Shoreditch, London, E2 7JP",
    phone: "020 7946 2187",
    email: "123@billskitchen.co.uk",
    description:
      "Seasonal comfort food, cooked like you're staying for dessert. Vibe: Warm, casual-upmarket, date-night friendly, good for groups.",
  },
  {
    id: "5",
    name: "Bill's",
    cuisine: "Italian",
    priceRange: "££",
    rating: 4.6,
    distance: 0.6,
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/f4feb673e80e4972d359398aae538197d7e81162?width=619",
    isSaved: true,
    hours: {
      monThu: "12:00–22:30",
      friSat: "12:00–23:30",
      sun: "10:00–21:30",
    },
    address: "17 Copper Lane, Shoreditch, London, E2 7JP",
    phone: "020 7946 2187",
    email: "123@billskitchen.co.uk",
    description:
      "Seasonal comfort food, cooked like you're staying for dessert. Vibe: Warm, casual-upmarket, date-night friendly, good for groups.",
  },
  {
    id: "6",
    name: "Bill's",
    cuisine: "Italian",
    priceRange: "££",
    rating: 4.6,
    distance: 0.6,
    image:
      "https://api.builder.io/api/v1/image/assets/TEMP/13fd579ce991c037c4cd5394fdb386349beb9585?width=619",
    isSaved: false,
    hours: {
      monThu: "12:00–22:30",
      friSat: "12:00–23:30",
      sun: "10:00–21:30",
    },
    address: "17 Copper Lane, Shoreditch, London, E2 7JP",
    phone: "020 7946 2187",
    email: "123@billskitchen.co.uk",
    description:
      "Seasonal comfort food, cooked like you're staying for dessert. Vibe: Warm, casual-upmarket, date-night friendly, good for groups.",
  },
];

export const savedRestaurants = restaurants.filter((r) => r.isSaved);
