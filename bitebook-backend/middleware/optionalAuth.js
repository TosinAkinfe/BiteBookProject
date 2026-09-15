const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

module.exports = function optionalAuth(req, res, next) {
  const headerToken = req.header("x-auth-token") || req.header("authorization");
  const token =
    headerToken && headerToken.startsWith("Bearer ")
      ? headerToken.slice(7)
      : headerToken;

  if (!token) return next();

  if (!process.env.JWT_SECRET) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = decoded?.user;

    if (!user) return next();

    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
      req.user = user;
      return next();
    }

    req.user = { role: user.role || "guest", id: null };
    return next();
  } catch (e) {
    return next();
  }
};
