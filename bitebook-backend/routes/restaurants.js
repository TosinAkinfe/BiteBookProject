const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const {
  upload,
  uploadBufferToCloudinary,
} = require("../middleware/uploadMiddleware");
const sendError = require("../utils/sendError");
const {
  buildMenuItems,
  ensureMenuItems,
  matchesMenuSearch,
} = require("../utils/menuItems");

const Restaurant = require("../models/restaurant");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Bookmark = require("../models/Bookmark");

const CANTERBURY_BOUNDS = {
  south: 51.18,
  north: 51.34,
  west: 0.92,
  east: 1.22,
};

function sortRestaurants(restaurants, sort, dir) {
  const items = [...restaurants];

  if (sort === "rating") {
    items.sort((a, b) =>
      dir === 1
        ? Number(a.averageRating || 0) - Number(b.averageRating || 0)
        : Number(b.averageRating || 0) - Number(a.averageRating || 0),
    );
    return items;
  }

  if (sort === "name") {
    items.sort((a, b) =>
      dir === 1
        ? String(a.name || "").localeCompare(String(b.name || ""))
        : String(b.name || "").localeCompare(String(a.name || "")),
    );
    return items;
  }

  items.sort((a, b) =>
    dir === 1
      ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      : new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
  return items;
}

function imageUploadMiddleware(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return sendError(
        res,
        400,
        "Bad Request",
        err.message || "Invalid image upload",
      );
    }
    return next();
  });
}

async function uploadRestaurantImage(file) {
  if (!file || !file.buffer) return "";
  const uploaded = await uploadBufferToCloudinary(file.buffer);
  return uploaded?.secure_url || "";
}

function uniqueStrings(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50,
    );
    const skip = (page - 1) * limit;

    const {
      search,
      cuisine,
      venueType,
      wifiStrength,
      noiseLevel,
      hasStudentDiscount,
      isStudyFriendly,
      minRating,
      prices,
      categories,
      sort = "newest",
      order = "desc",
    } = req.query;

    const filter = {};

    if (cuisine) {
      const list = String(cuisine)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length === 1) filter.cuisine = list[0];
      else if (list.length > 1) filter.cuisine = { $in: list };
    }

    if (venueType) filter.venueType = String(venueType).trim();
    if (wifiStrength) filter["amenities.wifiStrength"] = String(wifiStrength);
    if (noiseLevel) filter["amenities.noiseLevel"] = String(noiseLevel);

    if (hasStudentDiscount !== undefined) {
      if (String(hasStudentDiscount) === "true")
        filter["studentPerks.hasStudentDiscount"] = true;
      if (String(hasStudentDiscount) === "false")
        filter["studentPerks.hasStudentDiscount"] = false;
    }

    if (isStudyFriendly !== undefined) {
      if (String(isStudyFriendly) === "true")
        filter["studentPerks.isStudyFriendly"] = true;
      if (String(isStudyFriendly) === "false")
        filter["studentPerks.isStudyFriendly"] = false;
    }

    if (minRating !== undefined) {
      const mr = Number(minRating);
      if (!Number.isNaN(mr)) filter.averageRating = { $gte: mr };
    }

    if (prices) {
      const allowedPrices = ["£", "££", "£££"];
      const selectedPrices = String(prices)
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => allowedPrices.includes(entry));
      if (selectedPrices.length > 0)
        filter.priceRange = { $in: selectedPrices };
    }

    if (categories) {
      const selectedCategories = String(categories)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const venueTypes = new Set();
      selectedCategories.forEach((category) => {
        if (category === "cafe") venueTypes.add("cafe");
        if (category === "restaurant") venueTypes.add("restaurant");
        if (category === "quick_bite") venueTypes.add("fast_food");
        if (category === "desserts") {
          venueTypes.add("bakery");
          venueTypes.add("ice_cream");
        }
      });
      if (venueTypes.size > 0)
        filter.venueType = { $in: Array.from(venueTypes) };
    }

    const searchTerm = String(search || "").trim();
    const dir = String(order).toLowerCase() === "asc" ? 1 : -1;

    let mongoSort = { createdAt: -1 };
    if (sort === "newest") mongoSort = { createdAt: dir };
    if (sort === "rating") mongoSort = { averageRating: dir, createdAt: -1 };
    if (sort === "name") mongoSort = { name: dir };

    let restaurants = [];
    let total = 0;

    if (searchTerm) {
      const allRestaurants = await Restaurant.find(filter).lean();
      const matchedRestaurants = allRestaurants.filter((restaurant) =>
        matchesMenuSearch(restaurant, searchTerm),
      );
      total = matchedRestaurants.length;
      restaurants = sortRestaurants(matchedRestaurants, sort, dir).slice(
        skip,
        skip + limit,
      );
    } else {
      total = await Restaurant.countDocuments(filter);
      restaurants = await Restaurant.find(filter)
        .sort(mongoSort)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const restaurantIds = restaurants.map((r) => r._id);
    const counts = await Bookmark.aggregate([
      { $match: { restaurant: { $in: restaurantIds } } },
      { $group: { _id: "$restaurant", bookmarkCount: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      counts.map((c) => [String(c._id), c.bookmarkCount]),
    );

    let mySet = new Set();
    if (req.user && req.user.id) {
      const mine = await Bookmark.find({
        user: req.user.id,
        restaurant: { $in: restaurantIds },
      }).select("restaurant");
      mySet = new Set(mine.map((b) => String(b.restaurant)));
    }

    let items = restaurants.map((r) => {
      const idStr = String(r._id);
      return ensureMenuItems({
        ...r,
        bookmarkCount: countMap.get(idStr) || 0,
        isBookmarkedByMe: req.user?.id ? mySet.has(idStr) : false,
      });
    });

    if (sort === "bookmarks") {
      items.sort((a, b) =>
        dir === 1
          ? a.bookmarkCount - b.bookmarkCount
          : b.bookmarkCount - a.bookmarkCount,
      );
    }

    const pages = Math.max(Math.ceil(total / limit), 1);
    return res.json({ items, page, pages, total, limit });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/trending", async (req, res) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const trending = await Review.aggregate([
      { $match: { createdAt: { $gte: lastWeek } } },
      { $group: { _id: "$restaurant", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "details",
        },
      },
      { $unwind: "$details" },
    ]);

    return res.json(trending);
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/bookmarks/me", auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .populate("restaurant")
      .sort({ createdAt: -1 });
    return res.json(bookmarks.map((b) => b.restaurant));
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put("/bookmark/:id", auth, async (req, res) => {
  try {
    const restaurantId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(restaurantId))
      return sendError(res, 400, "Bad Request", "Invalid restaurant id");

    const exists = await Restaurant.findById(restaurantId).select("_id");
    if (!exists)
      return sendError(res, 404, "Not Found", "Restaurant not found");

    const existing = await Bookmark.findOne({
      user: req.user.id,
      restaurant: restaurantId,
    });
    if (existing) {
      await existing.deleteOne();
      return res.json({ message: "Bookmark removed" });
    }

    await Bookmark.create({ user: req.user.id, restaurant: restaurantId });
    return res.json({ message: "Bookmarked!" });
  } catch (err) {
    if (err.code === 11000) return res.json({ message: "Bookmarked!" });
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/highlights", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);
    const top = await Bookmark.aggregate([
      { $group: { _id: "$restaurant", bookmarks: { $sum: 1 } } },
      { $sort: { bookmarks: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },
      { $project: { _id: 0, bookmarks: 1, restaurant: 1 } },
    ]);

    return res.json(top);
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/bbox", optionalAuth, async (req, res) => {
  try {
    const { south, north, west, east } = req.query;

    if (!south || !north || !west || !east) {
      return sendError(
        res,
        400,
        "Bad Request",
        "Missing bbox params: south, north, west, east",
      );
    }

    const s = parseFloat(south);
    const n = parseFloat(north);
    const w = parseFloat(west);
    const e = parseFloat(east);

    if (isNaN(s) || isNaN(n) || isNaN(w) || isNaN(e)) {
      return sendError(res, 400, "Bad Request", "Invalid bbox coordinates");
    }

    const southBound = Math.max(Math.min(s, n), CANTERBURY_BOUNDS.south);
    const northBound = Math.min(Math.max(s, n), CANTERBURY_BOUNDS.north);
    const westBound = Math.max(Math.min(w, e), CANTERBURY_BOUNDS.west);
    const eastBound = Math.min(Math.max(w, e), CANTERBURY_BOUNDS.east);

    if (southBound > northBound || westBound > eastBound) {
      return res.json({ items: [], total: 0 });
    }

    const filter = {
      "location.coordinates.lat": { $gte: southBound, $lte: northBound },
      "location.coordinates.lng": { $gte: westBound, $lte: eastBound },
    };

    const items = await Restaurant.find(filter)
      .select("_id name cuisine image averageRating location")
      .lean();

    const total = await Restaurant.countDocuments(filter);

    return res.json({ items, total });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.post(
  "/",
  auth,
  imageUploadMiddleware,
  [
    body("name").isString().notEmpty().trim(),
    body("cuisine").isString().notEmpty().trim(),
    body("address").isString().notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());

    try {
      if (req.user.role !== "admin") {
        return sendError(res, 403, "Forbidden", "Access denied: Admins only");
      }

      const {
        name,
        cuisine,
        address,
        venueType,
        priceRange,
        lat,
        lng,
        hasStudentDiscount,
        discountDetail,
        isStudyFriendly,
        wifiStrength,
        powerOutlets,
        noiseLevel,
      } = req.body;

      let image = "";
      if (req.file && req.file.buffer) {
        image = await uploadRestaurantImage(req.file);
      }

      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      const hasCoordinates =
        !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);

      const newRestaurant = new Restaurant({
        name,
        cuisine,
        venueType: venueType || "restaurant",
        image,
        priceRange: priceRange || "££",
        menuItems: buildMenuItems({
          name,
          cuisine,
          venueType: venueType || "restaurant",
        }),
        location: {
          address,
          coordinates: hasCoordinates
            ? { lat: parsedLat, lng: parsedLng }
            : undefined,
        },
        studentPerks: {
          hasStudentDiscount: String(hasStudentDiscount) === "true",
          discountDetail: discountDetail || "",
          isStudyFriendly: String(isStudyFriendly) === "true",
        },
        amenities: {
          wifiStrength: wifiStrength || "None",
          powerOutlets: powerOutlets || "None",
          noiseLevel: noiseLevel || "Moderate",
        },
        photos: image ? [image] : [],
        addedBy: req.user.id,
      });

      const saved = await newRestaurant.save();
      return res.status(201).json(saved);
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const restaurantId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendError(res, 400, "Bad Request", "Invalid restaurant id");
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant)
      return sendError(res, 404, "Not Found", "Restaurant not found");

    let isBookmarkedByMe = false;
    if (req.user?.id) {
      const existing = await Bookmark.findOne({
        user: req.user.id,
        restaurant: restaurantId,
      })
        .select("_id")
        .lean();
      isBookmarkedByMe = Boolean(existing);
    }

    return res.json({
      ...ensureMenuItems(restaurant),
      isBookmarkedByMe,
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put("/:id", auth, imageUploadMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, 403, "Forbidden", "Access denied: Admins only");
    }

    const restaurantId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendError(res, 400, "Bad Request", "Invalid restaurant id");
    }

    const updates = req.body || {};
    const existing = await Restaurant.findById(restaurantId).lean();
    if (!existing)
      return sendError(res, 404, "Not Found", "Restaurant not found");

    const nextImage = req.file?.buffer
      ? await uploadRestaurantImage(req.file)
      : existing.image || "";

    const nextPhotos = uniqueStrings([
      ...(Array.isArray(existing.photos) ? existing.photos : []),
      nextImage,
    ]);

    const nextName = String(updates.name ?? existing.name ?? "").trim();
    const nextCuisine = String(
      updates.cuisine ?? existing.cuisine ?? "",
    ).trim();
    const nextVenueType = String(
      updates.venueType ?? existing.venueType ?? "restaurant",
    ).trim();
    const nextAddress = String(
      updates.address ?? existing.location?.address ?? "",
    ).trim();

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        name: nextName,
        cuisine: nextCuisine,
        venueType: nextVenueType,
        image: nextImage,
        photos: nextPhotos,
        priceRange: String(updates.priceRange ?? existing.priceRange ?? "££"),
        location: {
          address: nextAddress,
          coordinates: {
            lat:
              updates.lat !== undefined && updates.lat !== ""
                ? Number(updates.lat)
                : existing.location?.coordinates?.lat,
            lng:
              updates.lng !== undefined && updates.lng !== ""
                ? Number(updates.lng)
                : existing.location?.coordinates?.lng,
          },
        },
        studentPerks: {
          hasStudentDiscount:
            updates.hasStudentDiscount !== undefined
              ? String(updates.hasStudentDiscount) === "true"
              : Boolean(existing.studentPerks?.hasStudentDiscount),
          discountDetail:
            updates.discountDetail !== undefined
              ? String(updates.discountDetail)
              : String(existing.studentPerks?.discountDetail || ""),
          isStudyFriendly:
            updates.isStudyFriendly !== undefined
              ? String(updates.isStudyFriendly) === "true"
              : Boolean(existing.studentPerks?.isStudyFriendly),
        },
        amenities: {
          wifiStrength:
            updates.wifiStrength || existing.amenities?.wifiStrength || "None",
          powerOutlets:
            updates.powerOutlets || existing.amenities?.powerOutlets || "None",
          noiseLevel:
            updates.noiseLevel || existing.amenities?.noiseLevel || "Moderate",
        },
        menuItems:
          updates.menuItems ||
          buildMenuItems({
            ...existing,
            ...updates,
            venueType: nextVenueType,
            name: nextName,
            cuisine: nextCuisine,
          }),
      },
      {
        new: true,
      },
    );

    return res.json({ message: "Restaurant updated", restaurant });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.post("/:id/photos", auth, imageUploadMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, 403, "Forbidden", "Access denied: Admins only");
    }

    const restaurantId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendError(res, 400, "Bad Request", "Invalid restaurant id");
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return sendError(res, 404, "Not Found", "Restaurant not found");

    if (!req.file || !req.file.buffer) {
      return sendError(res, 400, "Bad Request", "Photo file is required");
    }

    const photoUrl = await uploadRestaurantImage(req.file);
    if (!photoUrl) {
      return sendError(res, 500, "Server Error", "Failed to upload photo");
    }

    restaurant.photos = uniqueStrings([...(restaurant.photos || []), photoUrl]);
    if (!restaurant.image) {
      restaurant.image = photoUrl;
    }

    await restaurant.save();

    return res.json({
      message: "Restaurant photo added",
      restaurant,
      photoUrl,
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, 403, "Forbidden", "Access denied: Admins only");
    }

    const restaurantId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendError(res, 400, "Bad Request", "Invalid restaurant id");
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return sendError(res, 404, "Not Found", "Restaurant not found");

    const reviewIds = await Review.find({ restaurant: restaurantId }).distinct(
      "_id",
    );

    await Notification.deleteMany({ reviewId: { $in: reviewIds } });
    await Review.deleteMany({ restaurant: restaurantId });
    await Bookmark.deleteMany({ restaurant: restaurantId });

    await restaurant.deleteOne();

    return res.json({
      message: "Restaurant deleted",
      deletedRestaurantId: restaurantId,
      cascadeDeletedReviews: true,
      cascadeDeletedNotifications: true,
      cascadeDeletedBookmarks: true,
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

module.exports = router;
