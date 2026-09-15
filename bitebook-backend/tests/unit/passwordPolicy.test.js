import { describe, expect, it } from "vitest";
import {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword,
} from "../../utils/passwordPolicy.js";

describe("password policy helper", () => {
  it("accepts a password that meets all rules", () => {
    expect(isStrongPassword("SecurePass1")).toBe(true);
  });

  it("rejects passwords that are too short or missing complexity", () => {
    expect(isStrongPassword("short1A")).toBe(false);
    expect(isStrongPassword("alllowercase1")).toBe(false);
    expect(isStrongPassword("ALLUPPERCASE1")).toBe(false);
  });

  it("exposes the shared policy message", () => {
    expect(PASSWORD_POLICY_MESSAGE).toContain("8-72 chars");
  });
});
