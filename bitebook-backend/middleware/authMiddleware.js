const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const sendError = require("../utils/sendError");
const User = require("../models/user");

module.exports = async function (req, res, next) {
  const headerToken = req.header("x-auth-token") || req.header("authorization");
  const token =
    headerToken && headerToken.startsWith("Bearer ")
      ? headerToken.slice(7)
      : headerToken;

  if (!token) {
    return sendError(
      res,
      401,
      "Unauthorized",
      "No token, authorization denied",
    );
  }

  if (!process.env.JWT_SECRET) {
    return sendError(res, 500, "Server Error", "JWT_SECRET is not set in .env");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded?.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(
        res,
        401,
        "Unauthorized",
        "Token is not valid for authenticated access",
      );
    }

    const exists = await User.exists({ _id: userId });
    if (!exists) {
      return sendError(
        res,
        401,
        "Unauthorized",
        "User account no longer exists",
      );
    }

    req.user = decoded.user;
    next();
  } catch (err) {
    return sendError(res, 401, "Unauthorized", "Token is not valid");
  }
};
