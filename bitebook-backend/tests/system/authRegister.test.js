import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import authRoutes from "../../routes/auth.js";
import { PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy.js";

describe("auth register system checks", () => {
  it("rejects weak passwords before reaching the database", async () => {
    const app = express();
    app.use(express.json());
    app.use("/auth", authRoutes);

    const res = await request(app).post("/auth/register").send({
      username: "Alex",
      email: "alex@example.com",
      password: "Weak1",
    });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(
      res.body.details.some((item) => item.msg === PASSWORD_POLICY_MESSAGE),
    ).toBe(true);
  });
});
