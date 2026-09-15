const mongoose = require("mongoose");

const BookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
  },
  { timestamps: true },
);

BookmarkSchema.index({ user: 1, restaurant: 1 }, { unique: true });

BookmarkSchema.index({ restaurant: 1, createdAt: -1 });

module.exports = mongoose.model("Bookmark", BookmarkSchema);
