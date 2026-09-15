const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: {
    type: String,
    enum: ["like", "follow", "reply", "review"],
    required: true,
  },

  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },

  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
