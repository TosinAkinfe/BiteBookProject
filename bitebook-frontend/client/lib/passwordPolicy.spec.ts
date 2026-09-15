import { describe, expect, it } from "vitest";
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from "./passwordPolicy";

describe("password policy helper", () => {
  it("accepts a valid password", () => {
    expect(isStrongPassword("BiteBook1")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isStrongPassword("password")).toBe(false);
    expect(isStrongPassword("PASSWORD1")).toBe(false);
    expect(isStrongPassword("Password")).toBe(false);
  });

  it("exposes the shared error message", () => {
    expect(PASSWORD_POLICY_MESSAGE).toContain("uppercase");
  });
});
