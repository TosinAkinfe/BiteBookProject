const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const auth = require("../middleware/authMiddleware");
const sendError = require("../utils/sendError");
const User = require("../models/user");

const {
  upload,
  uploadBufferToCloudinary,
} = require("../middleware/uploadMiddleware");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");
const {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword,
} = require("../utils/passwordPolicy");

function strongPasswordValidation(field = "password") {
  return body(field)
    .isString()
    .withMessage("Password must be a string")
    .custom((value) => {
      if (!isStrongPassword(value)) throw new Error(PASSWORD_POLICY_MESSAGE);
      return true;
    });
}

function profilePictureUploadMiddleware(req, res, next) {
  upload.single("profilePicture")(req, res, (err) => {
    if (err)
      return sendError(
        res,
        400,
        "Bad Request",
        err.message || "Invalid profile picture upload",
      );
    return next();
  });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    details: "Too many auth attempts. Try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    details: "Too many login attempts. Try again later.",
  },
});

function signToken(user, res) {
  if (!process.env.JWT_SECRET)
    return sendError(res, 500, "Server Error", "JWT_SECRET is not set in .env");
  const payload = { user: { id: user.id || null, role: user.role || "user" } };
  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: 36000 },
    (err, token) => {
      if (err) return sendError(res, 500, "Server Error", err.message);
      return res.json({ token });
    },
  );
}


router.post(
  "/register",
  authLimiter,
  [
    body("username").isString().isLength({ min: 3, max: 30 }).trim(),
    body("email").isEmail().normalizeEmail(),
    strongPasswordValidation(),
    body("isStudent").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());

    const { username, email, password, isStudent } = req.body;

    try {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        if (existingEmail.isVerified)
          return sendError(res, 400, "Bad Request", "User already exists");
        return sendError(
          res,
          400,
          "Bad Request",
          "Please verify your email first",
        );
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername)
        return sendError(res, 400, "Bad Request", "Username already taken");

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const rawVerificationToken = crypto.randomBytes(32).toString("hex");
      const hashedVerificationToken = crypto
        .createHash("sha256")
        .update(rawVerificationToken)
        .digest("hex");
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create user
      const user = new User({
        username,
        email,
        password: hashedPassword,
        isStudent: !!isStudent,
        role: "user",
        isVerified: false,
        verificationToken: hashedVerificationToken,
        verificationExpires,
      });
      await user.save();

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      await sendVerificationEmail(email, rawVerificationToken, baseUrl);

      return res
        .status(201)
        .json({
          message:
            "Account created! Check your email to verify before logging in.",
        });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.post(
  "/register-admin",
  authLimiter,
  [
    body("username").isString().isLength({ min: 3, max: 30 }).trim(),
    body("email").isEmail().normalizeEmail(),
    strongPasswordValidation(),
    body("adminKey").isString().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());
    if (!process.env.ADMIN_SIGNUP_KEY)
      return sendError(
        res,
        500,
        "Server Error",
        "ADMIN_SIGNUP_KEY is not set in .env",
      );

    const { username, email, password, adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_SIGNUP_KEY)
      return sendError(res, 403, "Forbidden", "Invalid admin signup key");

    try {
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return sendError(res, 400, "Bad Request", "User already exists");
      const existingUsername = await User.findOne({ username });
      if (existingUsername)
        return sendError(res, 400, "Bad Request", "Username already taken");

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      });
      await user.save();
      return signToken(user, res);
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user)
        return sendError(res, 400, "Bad Request", "Invalid credentials");
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return sendError(res, 400, "Bad Request", "Invalid credentials");
      if (!user.isVerified)
        return sendError(
          res,
          401,
          "Unauthorized",
          "Please verify your email before logging in.",
        );
      return signToken(user, res);
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return sendError(
        res,
        400,
        "Bad Request",
        "Verification token is required",
      );
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() },
    });
    if (!user)
      return sendError(
        res,
        400,
        "Bad Request",
        "Invalid or expired verification link",
      );
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
    return res.json({ message: "Email verified! You can now log in." });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.post(
  "/resend-verification",
  authLimiter,
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.json({
          message: "If an account exists, a verification email has been sent.",
        });
      if (user.isVerified)
        return res.json({ message: "Account is already verified." });
      const rawVerificationToken = crypto.randomBytes(32).toString("hex");
      const hashedVerificationToken = crypto
        .createHash("sha256")
        .update(rawVerificationToken)
        .digest("hex");
      user.verificationToken = hashedVerificationToken;
      user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      await sendVerificationEmail(email, rawVerificationToken, baseUrl);
      return res.json({
        message: "If an account exists, a verification email has been sent.",
      });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.json({
          message: "If that account exists, a reset email has been sent.",
        });
      const rawResetToken = crypto.randomBytes(32).toString("hex");
      const hashedResetToken = crypto
        .createHash("sha256")
        .update(rawResetToken)
        .digest("hex");
      user.resetPasswordToken = hashedResetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      await sendPasswordResetEmail(email, rawResetToken, baseUrl);
      return res.json({
        message: "If that account exists, a reset email has been sent.",
      });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.post(
  "/reset-password",
  authLimiter,
  [body("token").isString().notEmpty(), strongPasswordValidation()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());
    try {
      const { token, password } = req.body;
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (!user)
        return sendError(
          res,
          400,
          "Bad Request",
          "Invalid or expired reset token",
        );
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.json({
        message: "Password reset successful. You can now log in.",
      });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.post("/guest", authLimiter, async (req, res) => {
  try {
    if (!process.env.JWT_SECRET)
      return sendError(
        res,
        500,
        "Server Error",
        "JWT_SECRET is not set in .env",
      );
    const payload = { user: { id: null, role: "guest" } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 36000 },
      (err, token) => {
        if (err) return sendError(res, 500, "Server Error", err.message);
        return res.json({ token });
      },
    );
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password");
    if (!me) return sendError(res, 404, "Not Found", "User not found");
    return res.json({
      id: me._id,
      username: me.username,
      email: me.email,
      role: me.role,
      isVerified: me.isVerified,
      isStudent: me.isStudent,
      universityEmail: me.universityEmail,
      profilePictureUrl: me.profilePictureUrl,
      createdAt: me.createdAt,
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put(
  "/me",
  auth,
  profilePictureUploadMiddleware,
  [
    body("username").optional().isString().isLength({ min: 3, max: 30 }).trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("isStudent").optional().isBoolean(),
    body("universityEmail")
      .optional({ values: "falsy" })
      .isString()
      .isLength({ max: 120 })
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());
    try {
      const me = await User.findById(req.user.id);
      if (!me) return sendError(res, 404, "Not Found", "User not found");
      const nextUsername = req.body.username;
      const nextEmail = req.body.email;
      if (nextUsername && nextUsername !== me.username) {
        const existingUsername = await User.findOne({
          username: nextUsername,
        }).select("_id");
        if (existingUsername)
          return sendError(res, 400, "Bad Request", "Username already taken");
        me.username = nextUsername;
      }
      if (nextEmail && nextEmail !== me.email) {
        const existingEmail = await User.findOne({ email: nextEmail }).select(
          "_id",
        );
        if (existingEmail)
          return sendError(res, 400, "Bad Request", "Email already in use");
        me.email = nextEmail;
      }
      if (req.body.isStudent !== undefined)
        me.isStudent =
          req.body.isStudent === true || req.body.isStudent === "true";
      if (req.body.universityEmail !== undefined)
        me.universityEmail = String(req.body.universityEmail || "").trim();
      if (!me.isStudent) me.universityEmail = "";
      if (req.file) {
        const uploadedPicture = await uploadBufferToCloudinary(
          req.file.buffer,
          "bitebook-profile-pictures",
        );
        me.profilePictureUrl = uploadedPicture.secure_url;
      }
      await me.save();
      return res.json({
        id: me._id,
        username: me.username,
        email: me.email,
        role: me.role,
        isVerified: me.isVerified,
        isStudent: me.isStudent,
        universityEmail: me.universityEmail,
        profilePictureUrl: me.profilePictureUrl,
        createdAt: me.createdAt,
      });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.delete("/me/profile-picture", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return sendError(res, 404, "Not Found", "User not found");
    me.profilePictureUrl = "";
    await me.save();
    return res.json({
      id: me._id,
      username: me.username,
      email: me.email,
      role: me.role,
      isVerified: me.isVerified,
      isStudent: me.isStudent,
      universityEmail: me.universityEmail,
      profilePictureUrl: me.profilePictureUrl,
      createdAt: me.createdAt,
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.delete("/me", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const me = await User.findById(userId);
    if (!me) return sendError(res, 404, "Not Found", "User not found");
    const Review = require("../models/Review");
    const Bookmark = require("../models/Bookmark");
    const Notification = require("../models/Notification");
    await Review.deleteMany({ user: userId });
    await Bookmark.deleteMany({ user: userId });
    await Notification.deleteMany({ recipient: userId });
    await Notification.deleteMany({ sender: userId });
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } },
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } },
    );
    await me.deleteOne();
    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.delete("/admin/users/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return sendError(res, 403, "Forbidden", "Access denied: Admins only");
    const targetId = req.params.id;
    if (!targetId || targetId === req.user.id)
      return sendError(res, 400, "Bad Request", "Invalid target user");
    const target = await User.findById(targetId);
    if (!target) return sendError(res, 404, "Not Found", "User not found");
    if (target.role === "admin")
      return sendError(
        res,
        403,
        "Forbidden",
        "Admins cannot delete other admins",
      );
    const Review = require("../models/Review");
    const Bookmark = require("../models/Bookmark");
    const Notification = require("../models/Notification");
    await Review.deleteMany({ user: targetId });
    await Bookmark.deleteMany({ user: targetId });
    await Notification.deleteMany({ recipient: targetId });
    await Notification.deleteMany({ sender: targetId });
    await User.updateMany(
      { followers: targetId },
      { $pull: { followers: targetId } },
    );
    await User.updateMany(
      { following: targetId },
      { $pull: { following: targetId } },
    );
    await target.deleteOne();
    return res.json({ message: "User account deleted by admin" });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

module.exports = router;
