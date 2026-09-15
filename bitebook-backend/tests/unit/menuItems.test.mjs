import { describe, it, expect } from "vitest";
import menuItemsUtils from "../../utils/menuItems.js";

const { buildMenuItems, ensureMenuItems, matchesMenuSearch } = menuItemsUtils;

describe("menu item utilities", () => {
  it("generates cuisine-specific menu items", () => {
    const items = buildMenuItems({
      name: "Spice House",
      cuisine: "Indian",
      venueType: "restaurant",
    });

    expect(items.length).toBeGreaterThan(0);
    expect(items).toContain("Chicken Curry");
    expect(items).toContain("Naan");
  });

  it("ensures menu items exist when restaurant has none", () => {
    const restaurant = ensureMenuItems({
      name: "Tokyo Bowl",
      cuisine: "Japanese",
      venueType: "restaurant",
    });

    expect(Array.isArray(restaurant.menuItems)).toBe(true);
    expect(restaurant.menuItems.length).toBeGreaterThan(0);
  });

  it("matches search terms from cuisine", () => {
    const matched = matchesMenuSearch(
      {
        name: "Lagos Kitchen",
        cuisine: "Nigerian",
        venueType: "restaurant",
      },
      "nigerian",
    );

    expect(matched).toBe(true);
  });

  it("matches search terms from menu items", () => {
    const matched = matchesMenuSearch(
      {
        name: "Golden Chopsticks",
        cuisine: "Chinese",
        menuItems: ["Sweet and Sour Chicken", "Dumplings"],
      },
      "dumplings",
    );

    expect(matched).toBe(true);
  });
});
