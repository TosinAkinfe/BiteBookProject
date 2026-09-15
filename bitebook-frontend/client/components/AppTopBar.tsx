import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchWithAuth, getAuthMode } from "../lib/auth";

interface AppTopBarProps {
  showBack?: boolean;
  onBack?: () => void;
}

export default function AppTopBar({ showBack, onBack }: AppTopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const showProfileSettings = location.pathname === "/profile";
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (getAuthMode() !== "user") {
        setHasUnread(false);
        return;
      }

      try {
        const res = await fetchWithAuth("/social/notifications/unread-count");
        const data = await res.json();
        if (!res.ok) {
          setHasUnread(false);
          return;
        }

        setHasUnread(Number(data?.unread || 0) > 0);
      } catch (err) {
        console.error("Failed to fetch unread notifications:", err);
        setHasUnread(false);
      }
    };

    loadUnreadCount();
  }, [location.pathname]);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white xl:hidden dark:bg-black dark:border-b dark:border-[#262626]">
      <div className="max-w-[402px] mx-auto h-[60px] flex items-center justify-between px-2">
        <div className="w-8 h-8 flex items-center justify-center">
          {showBack ? (
            <button onClick={onBack} className="p-1 text-black dark:text-white">
              <svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                <path
                  d="M7.854 3.625C6.733 3.625 5.657 4.071 4.864 4.864C4.071 5.657 3.625 6.733 3.625 7.854V21.146C3.625 22.268 4.071 23.343 4.864 24.136C5.657 24.929 6.733 25.375 7.854 25.375H18.125C18.446 25.375 18.753 25.248 18.979 25.021C19.206 24.795 19.333 24.487 19.333 24.167C19.333 23.846 19.206 23.539 18.979 23.312C18.753 23.086 18.446 22.958 18.125 22.958H7.854C7.373 22.958 6.912 22.767 6.573 22.428C6.233 22.088 6.042 21.627 6.042 21.146V7.854C6.042 7.373 6.233 6.912 6.573 6.573C6.912 6.233 7.373 6.042 7.854 6.042H18.125C18.446 6.042 18.753 5.914 18.979 5.688C19.206 5.461 19.333 5.154 19.333 4.833C19.333 4.513 19.206 4.206 18.979 3.979C18.753 3.752 18.446 3.625 18.125 3.625H7.854ZM21.396 8.812C21.285 8.697 21.151 8.605 21.004 8.542C20.856 8.478 20.698 8.445 20.537 8.444C20.377 8.442 20.218 8.473 20.069 8.534C19.921 8.594 19.786 8.684 19.672 8.797C19.559 8.911 19.469 9.046 19.409 9.194C19.348 9.343 19.317 9.502 19.319 9.662C19.32 9.823 19.353 9.981 19.417 10.129C19.48 10.276 19.572 10.41 19.687 10.521L22.458 13.292H10.875C10.555 13.292 10.247 13.419 10.021 13.646C9.794 13.872 9.667 14.18 9.667 14.5C9.667 14.821 9.794 15.128 10.021 15.354C10.247 15.581 10.555 15.708 10.875 15.708H22.458L19.687 18.479C19.467 18.707 19.346 19.012 19.348 19.329C19.351 19.646 19.478 19.949 19.702 20.173C19.926 20.397 20.229 20.524 20.546 20.527C20.863 20.53 21.168 20.408 21.396 20.188L26.229 15.354C26.456 15.128 26.583 14.82 26.583 14.5C26.583 14.18 26.456 13.872 26.229 13.646L21.396 8.812Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          ) : (
            <Link to="/map" className="text-black dark:text-white">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.778 3.665C3.583 4.049 3.583 4.55 3.583 5.553V6.103L19.697 4.638C19.68 4.201 19.634 3.909 19.511 3.665C19.339 3.328 19.065 3.054 18.728 2.882C18.344 2.687 17.843 2.687 16.84 2.687H6.449C5.446 2.687 4.944 2.687 4.561 2.882C4.224 3.054 3.95 3.328 3.778 3.665ZM19.706 6.437L15.348 6.833L17.593 18.806C18.123 18.794 18.456 18.754 18.728 18.615C19.065 18.443 19.339 18.169 19.511 17.832C19.706 17.449 19.706 16.947 19.706 15.944V6.437ZM15.772 18.81L13.556 6.996L3.583 7.902V15.944C3.583 16.947 3.583 17.449 3.778 17.832C3.95 18.169 4.224 18.443 4.561 18.615C4.944 18.81 5.446 18.81 6.449 18.81H15.772ZM12.092 13.463C12.092 15.396 10.175 16.754 9.34 17.254C9.224 17.324 9.092 17.36 8.957 17.36C8.822 17.36 8.69 17.324 8.575 17.254C7.739 16.754 5.822 15.396 5.822 13.462C5.822 11.566 7.341 10.301 8.957 10.301C10.63 10.301 12.092 11.566 12.092 13.463Z"
                  fill="currentColor"
                />
                <path
                  d="M8.957 14.332C9.452 14.332 9.853 13.931 9.853 13.436C9.853 12.941 9.452 12.54 8.957 12.54C8.463 12.54 8.062 12.941 8.062 13.436C8.062 13.931 8.463 14.332 8.957 14.332Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          )}
        </div>

        <Link
          to="/"
          className="font-spartan text-[32px] leading-none select-none"
        >
          <span
            className="text-black"
            style={{ WebkitTextStroke: "1px black" }}
          >
            Bite
          </span>
          <span
            className="text-[#FF7B00]"
            style={{ WebkitTextStroke: "1px black" }}
          >
            Book
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {showProfileSettings && (
            <Link
              to="/profile/settings"
              className="w-8 h-8 flex items-center justify-center text-black dark:text-white"
              aria-label="Open settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M19.4 13.5C19.483 12.837 19.483 12.163 19.4 11.5L21 10.25L19.5 7.75L17.62 8.32C17.106 7.894 16.533 7.549 15.92 7.3L15.5 5.25H12.5L12.08 7.3C11.467 7.549 10.894 7.894 10.38 8.32L8.5 7.75L7 10.25L8.6 11.5C8.517 12.163 8.517 12.837 8.6 13.5L7 14.75L8.5 17.25L10.38 16.68C10.894 17.106 11.467 17.451 12.08 17.7L12.5 19.75H15.5L15.92 17.7C16.533 17.451 17.106 17.106 17.62 16.68L19.5 17.25L21 14.75L19.4 13.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
          <button
            onClick={() =>
              navigate("/notifications", {
                state: { backgroundLocation: location },
              })
            }
            className="relative w-8 h-8 flex items-center justify-center text-black dark:text-white"
            aria-label="Open notifications"
          >
            {hasUnread && (
              <span className="absolute right-[2px] top-[2px] h-2.5 w-2.5 rounded-full bg-[#FF7B00] border border-white" />
            )}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 18.5H14C14 19.6 13.1 20.5 12 20.5C10.9 20.5 10 19.6 10 18.5ZM21 16.5V17.5H3V16.5L5 14.5V8.5C5 5.4 7 2.7 10 1.8V1.5C10 0.4 10.9 -0.5 12 -0.5C13.1 -0.5 14 0.4 14 1.5V1.8C17 2.7 19 5.4 19 8.5V14.5L21 16.5ZM17 8.5C17 5.7 14.8 3.5 12 3.5C9.2 3.5 7 5.7 7 8.5V15.5H17V8.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
