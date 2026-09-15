import {
  type MouseEvent,
  type TouchEvent,
  useEffect,
  useMemo,
  useState,
  type WheelEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth, getAuthMode } from "../lib/auth";

type NotificationType = "like" | "follow" | "reply" | "review";

type NotificationItem = {
  _id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  sender?: {
    _id?: string;
    username?: string;
    profilePictureUrl?: string;
  };
  reviewId?: {
    _id?: string;
    restaurant?: {
      _id?: string;
      name?: string;
    };
  };
};

type NotificationResponse = {
  items: NotificationItem[];
  page: number;
  pages: number;
  total: number;
  limit: number;
};

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(now - date, 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

function getNotificationMessage(notification: NotificationItem) {
  const username = notification.sender?.username || "Someone";

  if (notification.type === "follow") {
    return `${username} started following you`;
  }

  if (notification.type === "review") {
    const restaurant = notification.reviewId?.restaurant?.name;
    return restaurant
      ? `${username} posted a new review on ${restaurant}`
      : `${username} posted a new review`;
  }

  if (notification.type === "reply") {
    const restaurant = notification.reviewId?.restaurant?.name;
    return restaurant
      ? `${username} replied to your review on ${restaurant}`
      : `${username} replied to your review`;
  }

  const restaurant = notification.reviewId?.restaurant?.name;
  if (restaurant) {
    return `${username} liked your review on ${restaurant}`;
  }

  return `${username} liked your review`;
}

function SenderAvatar({
  username,
  profilePictureUrl,
}: {
  username?: string;
  profilePictureUrl?: string;
}) {
  const initials = (username || "?").slice(0, 1).toUpperCase();

  if (profilePictureUrl) {
    return (
      <img
        src={profilePictureUrl}
        alt={username || "User"}
        className="h-12 w-12 rounded-full border border-[#E0E0E0] object-cover"
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-full border border-[#E0E0E0] bg-[#FFF8EF] flex items-center justify-center">
      <span className="font-lato font-bold text-base text-[#FF7B00]">
        {initials}
      </span>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const isGuest = getAuthMode() !== "user";

  useEffect(() => {
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    const openTimer = window.setTimeout(() => {
      setIsOpen(true);
    }, 10);

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTray();
      }
    };

    window.addEventListener("keydown", onEscape);

    return () => {
      window.clearTimeout(openTimer);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  const unreadCount = useMemo(
    () => items.reduce((count, item) => (item.read ? count : count + 1), 0),
    [items],
  );

  const loadNotifications = async (targetPage = 1, append = false) => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const query = new URLSearchParams({
        page: String(targetPage),
        limit: "12",
      });

      if (unreadOnly) {
        query.set("unreadOnly", "true");
      }

      const res = await fetchWithAuth(
        `/social/notifications?${query.toString()}`,
      );
      const data = (await res.json()) as NotificationResponse & {
        details?: string;
      };

      if (!res.ok) {
        setError(data.details || "Failed to load notifications.");
        return;
      }

      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Unable to load notifications right now.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setPages(1);
    loadNotifications(1, false);
  }, [unreadOnly]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/social/notifications/${id}/read`, {
        method: "PUT",
      });

      if (!res.ok) return;

      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item)),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetchWithAuth("/social/notifications/read-all", {
        method: "PUT",
      });
      if (!res.ok) return;

      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const closeTray = () => {
    setIsOpen(false);
    window.setTimeout(() => {
      navigate(-1);
    }, 260);
  };

  const closeTrayFromBackdrop = (
    event:
      | MouseEvent<HTMLDivElement>
      | TouchEvent<HTMLDivElement>
      | WheelEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    closeTray();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex pointer-events-none overscroll-none">
      <div
        className="flex-1 cursor-pointer pointer-events-auto"
        style={{ touchAction: "none" }}
        onClick={closeTrayFromBackdrop}
        onMouseDown={closeTrayFromBackdrop}
        onTouchStart={closeTrayFromBackdrop}
        onWheel={closeTrayFromBackdrop}
      />

      <div
        className={`w-[332px] bg-white rounded-l-[40px] overflow-y-auto flex flex-col pointer-events-auto transform transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pt-4 pl-4 pb-2 flex-shrink-0">
          <button
            onClick={closeTray}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close notifications"
          >
            <svg width="32" height="32" viewBox="0 0 42 42" fill="none">
              <path
                d="M11.375 5.25C9.751 5.25 8.193 5.895 7.044 7.044C5.895 8.193 5.25 9.751 5.25 11.375V30.625C5.25 32.25 5.895 33.807 7.044 34.956C8.193 36.105 9.751 36.75 11.375 36.75H26.25C26.714 36.75 27.159 36.566 27.487 36.237C27.816 35.909 28 35.464 28 35C28 34.536 27.816 34.091 27.487 33.763C27.159 33.434 26.714 33.25 26.25 33.25H11.375C10.679 33.25 10.011 32.973 9.519 32.481C9.027 31.989 8.75 31.321 8.75 30.625V11.375C8.75 10.679 9.027 10.011 9.519 9.519C10.011 9.027 10.679 8.75 11.375 8.75H26.25C26.714 8.75 27.159 8.566 27.487 8.237C27.816 7.909 28 7.464 28 7C28 6.536 27.816 6.091 27.487 5.763C27.159 5.434 26.714 5.25 26.25 5.25H11.375ZM30.987 12.763C30.826 12.596 30.633 12.462 30.419 12.371C30.206 12.279 29.976 12.231 29.744 12.229C29.511 12.227 29.281 12.271 29.066 12.359C28.851 12.447 28.655 12.577 28.491 12.741C28.327 12.905 28.197 13.101 28.109 13.316C28.021 13.531 27.977 13.761 27.979 13.994C27.981 14.226 28.029 14.456 28.121 14.669C28.212 14.883 28.346 15.076 28.513 15.237L32.526 19.25H15.75C15.286 19.25 14.841 19.434 14.513 19.763C14.184 20.091 14 20.536 14 21C14 21.464 14.184 21.909 14.513 22.237C14.841 22.566 15.286 22.75 15.75 22.75H32.526L28.513 26.763C28.194 27.093 28.018 27.535 28.022 27.994C28.026 28.453 28.21 28.892 28.534 29.216C28.859 29.54 29.298 29.724 29.756 29.728C30.215 29.732 30.657 29.556 30.987 29.237L37.987 22.237C38.315 21.909 38.5 21.464 38.5 21C38.5 20.536 38.315 20.091 37.987 19.763L30.987 12.763Z"
                fill="black"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-2 flex items-center justify-between gap-3">
          <button
            onClick={() => setUnreadOnly((prev) => !prev)}
            className={`rounded-full border px-3 py-1 text-xs font-inter ${
              unreadOnly
                ? "border-[#FF7B00] bg-orange-50 text-[#FF7B00]"
                : "border-gray-300 bg-white text-gray-600"
            }`}
          >
            {unreadOnly ? "Showing unread" : "Show unread only"}
          </button>

          <button
            onClick={markAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-inter text-gray-600 disabled:opacity-40"
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </button>
        </div>

        <div className="flex-1 px-5 pb-6 space-y-4">
          {isGuest ? (
            <div className="rounded-2xl border border-gray-300 p-4 bg-gray-50">
              <p className="font-inter text-sm text-gray-700 mb-3">
                Notifications are only available for signed-in accounts.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg bg-[#FF7B00] px-4 py-2 text-sm font-semibold text-white"
              >
                Go to Sign In
              </button>
            </div>
          ) : loading ? (
            <p className="font-inter text-sm text-gray-500">
              Loading notifications...
            </p>
          ) : error ? (
            <div className="rounded-2xl border border-red-300 bg-red-100 p-4">
              <p className="font-inter text-sm text-red-700">{error}</p>
              <button
                onClick={() => loadNotifications(1, false)}
                className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 border border-red-300"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="font-inter text-sm text-gray-500">
              No notifications yet.
            </p>
          ) : (
            <>
              {items.map((notif) => (
                <div
                  key={notif._id}
                  className={`w-full text-left p-4 border rounded-2xl transition-colors ${
                    notif.read
                      ? "border-gray-200 bg-white"
                      : "border-[#FFD9B0] bg-[#FFF8EF]"
                  }`}
                >
                  <button
                    onClick={() => {
                      if (!notif.read) {
                        markAsRead(notif._id);
                      }

                      if (notif.sender?._id) {
                        navigate(`/users/${notif.sender._id}`);
                        return;
                      }

                      const restaurantId = notif.reviewId?.restaurant?._id;
                      if (restaurantId) {
                        navigate(`/restaurant/${restaurantId}`);
                      }
                    }}
                    className="w-full text-left flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <SenderAvatar
                        username={notif.sender?.username}
                        profilePictureUrl={notif.sender?.profilePictureUrl}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-lato font-bold text-[15px] text-black leading-tight mb-1">
                          {notif.sender?.username || "Unknown User"}
                        </p>
                        {!notif.read && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-[#FF7B00] flex-shrink-0" />
                        )}
                      </div>
                      <p className="font-inter text-sm text-gray-700 leading-snug">
                        {getNotificationMessage(notif)}
                      </p>
                      <p className="font-inter text-xs text-gray-500 mt-2">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </button>

                  {notif.reviewId?.restaurant?._id && (
                    <div className="mt-3 pl-[60px]">
                      <button
                        onClick={() =>
                          navigate(
                            `/restaurant/${notif.reviewId?.restaurant?._id}`,
                          )
                        }
                        className="rounded-full border border-[#FF7B00] px-3 py-1 text-xs font-semibold text-[#FF7B00] hover:bg-orange-50"
                      >
                        View restaurant
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {page < pages && (
                <button
                  onClick={() => loadNotifications(page + 1, true)}
                  disabled={loadingMore}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-inter text-gray-700 disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
