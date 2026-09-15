const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const sendError = require("../utils/sendError");
const {
  upload,
  uploadBufferToCloudinary,
} = require("../middleware/uploadMiddleware");

const Review = require("../models/Review");
const Restaurant = require("../models/restaurant");
const User = require("../models/user");
const Notification = require("../models/Notification");

function reviewImageUploadMiddleware(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      return sendError(
        res,
        400,
        "Bad Request",
        err.message || "Invalid review photo upload",
      );
    }
    return next();
  });
}

const updateRestaurantRating = async (restaurantId) => {
  const stats = await Review.aggregate([
    { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$user",
        latestRating: { $first: "$rating" },
      },
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$latestRating" },
      },
    },
  ]);

  const newAvg = stats.length > 0 ? stats[0].avgScore : 0;
  await Restaurant.findByIdAndUpdate(restaurantId, { averageRating: newAvg });
  return newAvg;
};

router.post(
  "/:restaurantId",
  auth,
  reviewImageUploadMiddleware,
  [
    body("rating").isInt({ min: 1, max: 5 }),
    body("comment").optional().isString().isLength({ max: 500 }).trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendError(res, 400, "Bad Request", errors.array());

    try {
      const { rating, comment } = req.body;
      const { restaurantId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return sendError(res, 400, "Bad Request", "Invalid restaurant id");
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant)
        return sendError(res, 404, "Not Found", "Restaurant not found");

      const newReview = new Review({
        user: req.user.id,
        restaurant: restaurantId,
        rating,
        comment: comment || "",
        photoUrl: "",
      });

      if (req.file) {
        const uploadedPhoto = await uploadBufferToCloudinary(
          req.file.buffer,
          "bitebook-reviews",
        );
        newReview.photoUrl = uploadedPhoto.secure_url;
      }

      await newReview.save();

      const followers = await User.find({ following: req.user.id }).select(
        "_id",
      );
      if (followers.length > 0) {
        await Notification.insertMany(
          followers.map((follower) => ({
            recipient: follower._id,
            sender: req.user.id,
            type: "review",
            reviewId: newReview._id,
          })),
        );
      }

      const newAvg = await updateRestaurantRating(restaurantId);

      return res.status(201).json({
        message: "Review added!",
        restaurantAverage: newAvg.toFixed(1),
        entry: newReview,
      });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.get("/restaurant/:restaurantId", optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendError(res, 400, "Bad Request", "Invalid restaurant id");
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50,
    );
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ restaurant: restaurantId });

    const items = await Review.find({ restaurant: restaurantId })
      .populate("user", "username profilePictureUrl")
      .populate("replies.user", "username profilePictureUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const currentUserId = req.user?.id;
    const mappedItems = items.map((item) => {
      const plainItem = item.toObject();
      return {
        ...plainItem,
        isLikedByMe: currentUserId
          ? (plainItem.likes || []).some(
              (likedUserId) => String(likedUserId) === currentUserId,
            )
          : false,
      };
    });

    const pages = Math.max(Math.ceil(total / limit), 1);

    return res.json({ items: mappedItems, page, pages, total, limit });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/trending", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "8", 10), 1),
      20,
    );

    const items = await Review.find()
      .populate("user", "username profilePictureUrl")
      .populate("restaurant", "name image")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ items, limit });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const reviewId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 400, "Bad Request", "Invalid review id");
    }

    const review = await Review.findById(reviewId);
    if (!review) return sendError(res, 404, "Not Found", "Review not found");

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return sendError(res, 403, "Forbidden", "Not authorized");
    }

    const restaurantId = review.restaurant;

    await Notification.deleteMany({ reviewId: review._id });
    await review.deleteOne();

    const newAvg = await updateRestaurantRating(restaurantId);

    return res.json({
      message: "Review deleted",
      newAverage: newAvg.toFixed(1),
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

module.exports = router;
