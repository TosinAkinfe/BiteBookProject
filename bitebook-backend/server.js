require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const sendError = require("./utils/sendError");

const authRoutes = require("./routes/auth");
const reviewRoutes = require("./routes/reviews");
const socialRoutes = require("./routes/social");
const restaurantRoutes = require("./routes/restaurants");

const app = express();

console.log("✅ Server file started");

app.use(express.json());
app.use(cors());

let dbReady = false;

mongoose.connection.on("connected", () => {
  dbReady = true;
  console.log("🟢 MongoDB connection state: connected");
});

mongoose.connection.on("disconnected", () => {
  dbReady = false;
  console.log("🟠 MongoDB connection state: disconnected");
});

mongoose.connection.on("error", (err) => {
  dbReady = false;
  console.log("🔴 MongoDB connection error:", err.message);
});

function requireDb(req, res, next) {
  if (!dbReady) {
    return sendError(
      res,
      503,
      "Service Unavailable",
      "Database not connected yet. Try again in a moment.",
    );
  }
  next();
}

app.get("/", (req, res) => {
  res.send("📖 Welcome to the BiteBook API!");
});

app.use("/auth", requireDb, authRoutes);
app.use("/reviews", requireDb, reviewRoutes);
app.use("/social", requireDb, socialRoutes);
app.use("/restaurants", requireDb, restaurantRoutes);

app.use((req, res) => {
  return sendError(res, 404, "Not Found", "Route does not exist");
});

app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  return sendError(
    res,
    500,
    "Server Error",
    err.message || "Something went wrong",
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 BiteBook Server running on port ${PORT}`);
});

console.log("✅ About to connect to MongoDB...");

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 8000,
  })
  .then(() => console.log("✅ MongoDB Connected to BiteBook Database"))
  .catch((err) => console.log("❌ Database Connection Error:", err.message));
