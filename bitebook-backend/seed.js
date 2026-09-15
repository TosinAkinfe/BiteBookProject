require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Restaurant = require("./models/restaurant");
const { buildMenuItems } = require("./utils/menuItems");
const sendError = (msg) => console.log("❌", msg);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 8000,
  })
  .then(() => console.log("🌱 Connected to DB for seeding..."))
  .catch((err) => sendError(err.message));

const buildAddress = (tags) => {
  const parts = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  return parts.join(", ");
};

const mapElementToRestaurant = (el) => {
  const tags = el.tags || {};
  const name = tags.name || `Unnamed ${el.type} ${el.id}`;
  const cuisine =
    (tags.cuisine && tags.cuisine.split(";")[0]) || tags.food || "Various";
  const amenity = tags.amenity || tags.shop || "restaurant";
  const venueType =
    amenity === "cafe"
      ? "cafe"
      : amenity === "fast_food"
        ? "quick_bite"
        : "restaurant";
  const image = tags.image || "";

  let lat = null;
  let lng = null;
  if (el.type === "node") {
    lat = el.lat;
    lng = el.lon;
  } else if (el.center) {
    lat = el.center.lat;
    lng = el.center.lon;
  }

  const address = buildAddress(tags) || tags["addr:street"] || "";

  return {
    name,
    cuisine,
    venueType,
    image,
    priceRange: "££",
    menuItems: buildMenuItems({
      name,
      cuisine,
      venueType,
    }),
    location: {
      address,
      coordinates: {
        lat,
        lng,
      },
    },
    studentPerks: {},
    amenities: {},
    averageRating: 0,
    source: {
      provider: "openstreetmap",
      placeId: String(el.id),
      url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    },
  };
};

const seedDB = async () => {
  const poisPath = path.join(__dirname, "scripts", "canterbury_pois.json");
  if (!fs.existsSync(poisPath)) {
    throw new Error(
      `Overpass results not found at ${poisPath}. Run the fetch step first.`,
    );
  }

  const raw = fs.readFileSync(poisPath, "utf8");
  const data = JSON.parse(raw);
  const elements = data.elements || [];

  const restaurantEls = elements.filter((el) => {
    const hasName = el.tags && el.tags.name;
    const hasCoords = (el.type === "node" && el.lat && el.lon) || el.center;
    return hasName && hasCoords;
  });

  const docs = restaurantEls
    .map(mapElementToRestaurant)
    .filter((r) => r.location.coordinates.lat && r.location.coordinates.lng);

  await Restaurant.deleteMany({});
  if (docs.length === 0) {
    console.log("No restaurant docs found to seed.");
    return;
  }

  await Restaurant.insertMany(docs, { ordered: false });
  console.log(`✅ Seeded ${docs.length} restaurants from OpenStreetMap.`);
};

seedDB()
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.log("❌ Seed error:", err && err.message ? err.message : err);
    mongoose.connection.close();
  });
