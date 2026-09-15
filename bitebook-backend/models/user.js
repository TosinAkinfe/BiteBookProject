const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },

  password: { type: String, required: true },

  isStudent: { type: Boolean, default: false },
  universityEmail: { type: String, default: "", trim: true },

  profilePictureUrl: { type: String, default: "", trim: true },

  role: { type: String, enum: ["user", "admin"], default: "user" },

  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationExpires: { type: Date, default: null },

  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
