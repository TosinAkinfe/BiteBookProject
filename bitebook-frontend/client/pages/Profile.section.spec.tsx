/* @vitest-environment jsdom */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "./Profile";

const authMocks = vi.hoisted(() => ({
  fetchCurrentUser: vi.fn(),
  fetchWithAuth: vi.fn(),
}));

vi.mock("../lib/auth", () => ({
  fetchCurrentUser: authMocks.fetchCurrentUser,
  fetchWithAuth: authMocks.fetchWithAuth,
  getAuthMode: () => "user",
}));

vi.mock("../components/AppTopBar", () => ({
  default: () => <div data-testid="topbar" />,
}));

vi.mock("../components/BottomNav", () => ({
  default: () => <div data-testid="bottom-nav" />,
}));

function createResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("Profile follower dialog", () => {
  beforeEach(() => {
    authMocks.fetchCurrentUser.mockResolvedValue({
      id: "me-1",
      username: "Me",
      email: "me@example.com",
      role: "user",
    });

    authMocks.fetchWithAuth.mockImplementation(async (path: string) => {
      if (path === "/social/users/me-1") {
        return createResponse({
          user: {
            id: "me-1",
            username: "Me",
            role: "user",
            profilePictureUrl: "",
            createdAt: "2026-05-14T00:00:00.000Z",
          },
          reviews: [],
          stats: {
            followersCount: 1,
            followingCount: 0,
            likesReceived: 0,
            reviewsCount: 0,
          },
        });
      }

      if (path === "/social/users/me-1/followers") {
        return createResponse({
          items: [
            {
              id: "user-2",
              username: "Alice",
              profilePictureUrl: "",
              role: "user",
            },
          ],
        });
      }

      return createResponse({ details: "Unexpected path" }, false);
    });
  });

  afterEach(() => {
    authMocks.fetchCurrentUser.mockReset();
    authMocks.fetchWithAuth.mockReset();
    document.body.innerHTML = "";
  });

  it("opens the followers dialog and shows fetched users", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>,
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    const followersButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Followers")) as
      | HTMLButtonElement
      | undefined;

    expect(followersButton).toBeTruthy();

    await act(async () => {
      followersButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Alice");
  });
});
