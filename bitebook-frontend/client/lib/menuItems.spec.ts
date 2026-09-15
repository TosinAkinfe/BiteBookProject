import { describe, expect, it } from "vitest";
import { buildMenuItems, findMatchingMenuItems } from "./menuItems";

describe("menu item helpers", () => {
  it("builds menu items from cuisine", () => {
    const items = buildMenuItems({
      name: "Bombay Kitchen",
      cuisine: "Indian",
      venueType: "restaurant",
    });

    expect(items).toContain("Chicken Curry");
    expect(items).toContain("Naan");
  });

  it("matches cuisine search words in food tab", () => {
    const matches = findMatchingMenuItems(
      {
        name: "Lagos Grill",
        cuisine: "Nigerian",
        venueType: "restaurant",
      },
      "nigerian",
    );

    expect(matches.length).toBeGreaterThan(0);
  });

  it("matches direct menu item search", () => {
    const matches = findMatchingMenuItems(
      {
        name: "Roma House",
        cuisine: "Italian",
        menuItems: ["Margherita Pizza", "Garlic Bread"],
      },
      "pizza",
    );

    expect(matches).toContain("Margherita Pizza");
  });
});
