const mongoose = require("mongoose");

const ReviewReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, trim: true, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, default: "" },
  photoUrl: { type: String, trim: true, default: "" },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  replies: [ReviewReplySchema],

  createdAt: { type: Date, default: Date.now },
});

// Helps speed up rating updates
ReviewSchema.index({ restaurant: 1, user: 1, createdAt: -1 });

module.exports =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
