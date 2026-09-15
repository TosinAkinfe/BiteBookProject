const mongoose = require("mongoose");
const { buildMenuItems } = require("../utils/menuItems");

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cuisine: { type: String, required: true, trim: true },
  venueType: { type: String, default: "restaurant", trim: true },
  image: { type: String, default: "" },
  photos: { type: [String], default: [] },
  priceRange: { type: String, default: "££" },
  menuItems: {
    type: [String],
    default: function defaultMenuItems() {
      return buildMenuItems({
        name: this.name,
        cuisine: this.cuisine,
        venueType: this.venueType,
      });
    },
  },

  location: {
    address: { type: String, trim: true },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },

  studentPerks: {
    hasStudentDiscount: { type: Boolean, default: false },
    discountDetail: { type: String, default: "", trim: true },
    isStudyFriendly: { type: Boolean, default: false },
  },
  amenities: {
    wifiStrength: {
      type: String,
      enum: ["None", "Weak", "Strong"],
      default: "None",
    },
    powerOutlets: {
      type: String,
      enum: ["Few", "Many", "None"],
      default: "None",
    },
    noiseLevel: {
      type: String,
      enum: ["Quiet", "Moderate", "Loud"],
      default: "Moderate",
    },
  },
  // average rating (updated when reviews change)
  averageRating: { type: Number, default: 0 },

  source: {
    provider: { type: String, default: "manual", trim: true },
    placeId: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
  },

  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Restaurant", RestaurantSchema);
