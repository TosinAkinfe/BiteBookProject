/* @vitest-environment jsdom */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PASSWORD_POLICY_MESSAGE } from "../lib/passwordPolicy";
import Signup from "./Signup";

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("Signup password validation", () => {
  it("shows the shared password policy error for weak passwords", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>,
      );
    });

    const inputs = container.querySelectorAll("input");
    const [usernameInput, emailInput, passwordInput, confirmPasswordInput] =
      Array.from(inputs) as HTMLInputElement[];

    await act(async () => {
      setInputValue(usernameInput, "Alex");
      setInputValue(emailInput, "alex@example.com");
      setInputValue(passwordInput, "Weak1");
      setInputValue(confirmPasswordInput, "Weak1");
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Create Account"),
    ) as HTMLButtonElement | undefined;

    expect(submitButton).toBeTruthy();

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain(PASSWORD_POLICY_MESSAGE);
  });
});
