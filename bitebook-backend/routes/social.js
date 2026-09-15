const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const sendError = require("../utils/sendError");

const User = require("../models/user");
const Review = require("../models/Review");
const Notification = require("../models/Notification");

function mapSocialUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    profilePictureUrl: user.profilePictureUrl,
    role: user.role,
  };
}

router.post(
  "/reply/:reviewId",
  auth,
  [body("comment").isString().isLength({ min: 1, max: 500 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, "Bad Request", errors.array());
    }

    try {
      const reviewId = req.params.reviewId;
      const { comment } = req.body;

      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return sendError(res, 400, "Bad Request", "Invalid review id");
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return sendError(res, 404, "Not Found", "Review not found");
      }

      review.replies.push({
        user: req.user.id,
        comment: comment.trim(),
      });

      await review.save();

      if (review.user.toString() !== req.user.id) {
        await new Notification({
          recipient: review.user,
          sender: req.user.id,
          type: "reply",
          reviewId: review._id,
        }).save();
      }

      const createdReply = review.replies[review.replies.length - 1];

      return res.status(201).json({
        message: "Reply added",
        reply: createdReply,
      });
    } catch (err) {
      return sendError(res, 500, "Server Error", err.message);
    }
  },
);

router.get("/users/:id", optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Bad Request", "Invalid user id");
    }

    const user = await User.findById(userId).select(
      "username role createdAt profilePictureUrl followers following",
    );
    if (!user) return sendError(res, 404, "Not Found", "User not found");

    const reviews = await Review.find({ user: userId })
      .populate("restaurant", "name image")
      .sort({ createdAt: -1 });

    const likesReceived = await Review.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } },
    ]);

    const currentUserId = req.user?.id;
    const isFollowingByMe = currentUserId
      ? user.followers.some(
          (followerId) => String(followerId) === currentUserId,
        )
      : false;

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        createdAt: user.createdAt,
      },
      reviews,
      stats: {
        followersCount: user.followers.length,
        followingCount: user.following.length,
        reviewsCount: reviews.length,
        likesReceived: likesReceived[0]?.totalLikes || 0,
        isFollowingByMe,
      },
      totalReviews: reviews.length,
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/users/:id/followers", optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Bad Request", "Invalid user id");
    }

    const user = await User.findById(userId)
      .select("followers")
      .populate("followers", "username profilePictureUrl role")
      .lean();

    if (!user) return sendError(res, 404, "Not Found", "User not found");

    return res.json({
      items: (user.followers || []).map(mapSocialUser),
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/users/:id/following", optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Bad Request", "Invalid user id");
    }

    const user = await User.findById(userId)
      .select("following")
      .populate("following", "username profilePictureUrl role")
      .lean();

    if (!user) return sendError(res, 404, "Not Found", "User not found");

    return res.json({
      items: (user.following || []).map(mapSocialUser),
    });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/users", optionalAuth, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    if (!search) {
      return res.json({ items: [] });
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      50,
    );
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const filter = { username: rx, isVerified: true };
    if (req.user?.id) {
      filter._id = { $ne: req.user.id };
    }

    const users = await User.find(filter)
      .select("username profilePictureUrl")
      .sort({ username: 1 })
      .limit(limit)
      .lean();

    const items = await Promise.all(
      users.map(async (user) => {
        const reviewsCount = await Review.countDocuments({ user: user._id });
        const likesAgg = await Review.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(user._id) } },
          { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
          { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } },
        ]);

        return {
          id: String(user._id),
          username: user.username,
          profilePictureUrl: user.profilePictureUrl,
          reviewsCount,
          likesReceived: likesAgg[0]?.totalLikes || 0,
        };
      }),
    );

    return res.json({ items });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put("/follow/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return sendError(res, 400, "Bad Request", "Invalid user id");
    }

    if (targetId === req.user.id) {
      return sendError(res, 400, "Bad Request", "You cannot follow yourself");
    }

    const userToFollow = await User.findById(targetId);
    if (!userToFollow)
      return sendError(res, 404, "Not Found", "User not found");

    const me = await User.findById(req.user.id);
    if (!me)
      return sendError(res, 404, "Not Found", "Your user account not found");

    const alreadyFollowing = me.following.some(
      (id) => id.toString() === targetId,
    );

    if (alreadyFollowing) {
      await userToFollow.updateOne({ $pull: { followers: req.user.id } });
      await me.updateOne({ $pull: { following: targetId } });
      return res.json({ message: "Unfollowed" });
    }

    await userToFollow.updateOne({ $addToSet: { followers: req.user.id } });
    await me.updateOne({ $addToSet: { following: targetId } });

    await new Notification({
      recipient: targetId,
      sender: req.user.id,
      type: "follow",
    }).save();

    return res.json({ message: "Followed" });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put("/like/:reviewId", auth, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendError(res, 400, "Bad Request", "Invalid review id");
    }

    const review = await Review.findById(reviewId);
    if (!review) return sendError(res, 404, "Not Found", "Review not found");

    const isLiked = review.likes.some((id) => id.toString() === req.user.id);

    if (isLiked) {
      await review.updateOne({ $pull: { likes: req.user.id } });
      return res.json({ message: "Unliked" });
    }

    await review.updateOne({ $addToSet: { likes: req.user.id } });

    if (review.user.toString() !== req.user.id) {
      await new Notification({
        recipient: review.user,
        sender: req.user.id,
        type: "like",
        reviewId: review._id,
      }).save();
    }

    return res.json({ message: "Liked" });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/feed", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return sendError(res, 404, "Not Found", "User not found");

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50,
    );
    const skip = (page - 1) * limit;

    const filter = { user: { $in: me.following } };

    const total = await Review.countDocuments(filter);

    const items = await Review.find(filter)
      .populate("user", "username")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.max(Math.ceil(total / limit), 1);

    return res.json({ items, page, pages, total, limit });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/notifications", auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      50,
    );
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user.id };

    if (String(req.query.unreadOnly) === "true") {
      filter.read = false;
    }

    if (req.query.type) {
      const t = String(req.query.type);
      if (["like", "follow"].includes(t)) filter.type = t;
    }

    const total = await Notification.countDocuments(filter);

    const items = await Notification.find(filter)
      .populate("sender", "username profilePictureUrl")
      .populate({
        path: "reviewId",
        populate: {
          path: "restaurant",
          select: "name _id",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.max(Math.ceil(total / limit), 1);

    return res.json({ items, page, pages, total, limit });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.get("/notifications/unread-count", auth, async (req, res) => {
  try {
    const unread = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    return res.json({ unread });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put("/notifications/:id/read", auth, async (req, res) => {
  try {
    const notifId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notifId)) {
      return sendError(res, 400, "Bad Request", "Invalid notification id");
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: notifId, recipient: req.user.id },
      { read: true },
      { new: true },
    );

    if (!notif)
      return sendError(res, 404, "Not Found", "Notification not found");

    return res.json({ message: "Notification marked as read", notif });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

router.put("/notifications/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id }, { read: true });
    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    return sendError(res, 500, "Server Error", err.message);
  }
});

module.exports = router;
