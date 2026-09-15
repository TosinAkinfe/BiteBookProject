const MENU_PATTERNS = [
  {
    match: ["sushi", "japanese"],
    items: ["Sushi Roll", "Ramen", "Gyoza", "Tempura", "Miso Soup"],
  },
  {
    match: ["thai"],
    items: ["Pad Thai", "Green Curry", "Spring Rolls", "Satay", "Jasmine Rice"],
  },
  {
    match: ["indian", "curry"],
    items: ["Chicken Curry", "Vegetable Biryani", "Naan", "Samosa", "Mango Lassi"],
  },
  {
    match: ["chinese"],
    items: ["Sweet and Sour Chicken", "Fried Rice", "Dumplings", "Chow Mein", "Spring Rolls"],
  },
  {
    match: ["italian", "pizza", "pasta"],
    items: ["Margherita Pizza", "Pasta Carbonara", "Garlic Bread", "Lasagne", "Tiramisu"],
  },
  {
    match: ["burger", "quick bite", "fast food", "fast-food"],
    items: ["Beef Burger", "Chicken Burger", "Fries", "Loaded Wrap", "Milkshake"],
  },
  {
    match: ["cafe", "coffee", "brunch"],
    items: ["Flat White", "Cappuccino", "Avocado Toast", "Croissant", "Breakfast Bagel"],
  },
  {
    match: ["bakery", "bakehouse", "patisserie"],
    items: ["Sourdough Loaf", "Croissant", "Cinnamon Bun", "Pain au Chocolat", "Cake Slice"],
  },
  {
    match: ["dessert", "desserts", "ice cream", "sweet"],
    items: ["Ice Cream Scoop", "Waffle", "Brownie", "Cheesecake", "Sundae"],
  },
  {
    match: ["fish", "seafood", "chips"],
    items: ["Fish and Chips", "Calamari", "Prawn Salad", "Seafood Chowder", "Haddock Burger"],
  },
  {
    match: ["pub", "bar"],
    items: ["Burgers", "Nachos", "Chicken Wings", "Loaded Fries", "Sharing Platter"],
  },
];

const FALLBACK_ITEMS = [
  "House Special",
  "Daily Burger",
  "Seasonal Salad",
  "Loaded Fries",
  "Dessert of the Day",
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueItems(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function buildMenuItems(restaurant = {}) {
  const haystack = normalizeText(
    [restaurant.name, restaurant.cuisine, restaurant.venueType]
      .filter(Boolean)
      .join(" "),
  );

  const matched = MENU_PATTERNS.find((pattern) =>
    pattern.match.some((term) => haystack.includes(term)),
  );

  const baseItems = matched ? matched.items : FALLBACK_ITEMS;

  const cuisine = normalizeText(restaurant.cuisine);
  const extras = [];

  if (cuisine.includes("italian")) extras.push("Pizza Slice");
  if (cuisine.includes("indian")) extras.push("Chicken Tikka");
  if (cuisine.includes("thai")) extras.push("Pad Krapow");
  if (cuisine.includes("japanese")) extras.push("Donburi Bowl");
  if (cuisine.includes("mexican")) extras.push("Tacos");
  if (cuisine.includes("greek")) extras.push("Gyros");
  if (cuisine.includes("mediterranean")) extras.push("Mezze Platter");
  if (cuisine.includes("chinese")) extras.push("Egg Fried Rice");
  if (cuisine.includes("american")) extras.push("Cheeseburger");

  return uniqueItems([...baseItems, ...extras]).slice(0, 8);
}

function matchesMenuSearch(restaurant = {}, query = "") {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const haystack = normalizeText(
    [
      restaurant.name,
      restaurant.cuisine,
      restaurant.venueType,
      restaurant.location?.address,
      ...(Array.isArray(restaurant.menuItems) ? restaurant.menuItems : []),
      ...buildMenuItems(restaurant),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return haystack.includes(normalizedQuery);
}

function ensureMenuItems(restaurant = {}) {
  const menuItems = Array.isArray(restaurant.menuItems) && restaurant.menuItems.length
    ? restaurant.menuItems
    : buildMenuItems(restaurant);

  return {
    ...restaurant,
    menuItems,
  };
}

module.exports = {
  buildMenuItems,
  ensureMenuItems,
  matchesMenuSearch,
};