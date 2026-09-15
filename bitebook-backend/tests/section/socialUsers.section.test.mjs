import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import User from "../../models/user.js";
import socialRoutes from "../../routes/social.js";

function createLeanQueryResult(document) {
  return {
    select() {
      return this;
    },
    populate() {
      return this;
    },
    lean() {
      return Promise.resolve(document);
    },
  };
}

describe("GET /social/users (section)", () => {
  const selfId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    User.findById = vi.fn();
  });

  it("returns empty list when search query is missing", async () => {
    const app = express();
    app.use(express.json());
    app.use("/social", socialRoutes);

    const res = await request(app).get("/social/users");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
  });

  it("returns empty list for signed-in users when search query is missing", async () => {
    const token = jwt.sign(
      { user: { id: selfId, role: "user" } },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const app = express();
    app.use(express.json());
    app.use("/social", socialRoutes);

    const res = await request(app)
      .get("/social/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
  });

  it("returns followers for the requested profile", async () => {
    User.findById.mockReturnValue(
      createLeanQueryResult({
        followers: [
          {
            _id: "u1",
            username: "Alice",
            profilePictureUrl: "",
            role: "user",
          },
        ],
      }),
    );

    const app = express();
    app.use(express.json());
    app.use("/social", socialRoutes);

    const res = await request(app).get(
      "/social/users/64b7d3b7d3b7d3b7d3b7d3b7/followers",
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([
      {
        id: "u1",
        username: "Alice",
        profilePictureUrl: "",
        role: "user",
      },
    ]);
  });

  it("returns following for the requested profile", async () => {
    User.findById.mockReturnValue(
      createLeanQueryResult({
        following: [
          {
            _id: "u2",
            username: "Ben",
            profilePictureUrl: "https://example.com/ben.png",
            role: "admin",
          },
        ],
      }),
    );

    const app = express();
    app.use(express.json());
    app.use("/social", socialRoutes);

    const res = await request(app).get(
      "/social/users/64b7d3b7d3b7d3b7d3b7d3b7/following",
    );

    expect(res.status).toBe(200);
    expect(res.body.items[0]).toMatchObject({
      id: "u2",
      username: "Ben",
      profilePictureUrl: "https://example.com/ben.png",
      role: "admin",
    });
  });
});
