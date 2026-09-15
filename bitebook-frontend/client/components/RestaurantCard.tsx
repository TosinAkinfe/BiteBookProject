import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Restaurant } from "../data/restaurants";
import { fetchWithAuth, getAuthMode } from "../lib/auth";

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: "horizontal" | "vertical" | "full";
}

function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
      <path
        d="M11.767 1.285C11.849 1.073 12.151 1.073 12.233 1.285L14.337 6.683C14.449 6.97 14.727 7.16 15.036 7.16H21.621C21.874 7.16 21.967 7.493 21.751 7.624L16.59 10.749C16.278 10.938 16.147 11.324 16.279 11.663L18.285 16.809C18.372 17.031 18.127 17.237 17.923 17.113L12.389 13.763C12.15 13.618 11.85 13.618 11.611 13.763L6.077 17.113C5.873 17.237 5.628 17.031 5.715 16.809L7.721 11.663C7.853 11.324 7.722 10.938 7.41 10.749L2.249 7.624C2.033 7.493 2.126 7.16 2.379 7.16H8.964C9.273 7.16 9.551 6.97 9.663 6.683L11.767 1.285Z"
        fill={filled ? "#F2CF63" : "none"}
        stroke="black"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path
        d="M11.768 5.001C13.939 4.942 16.05 5.717 17.668 7.166L18.001 7.465L18.335 7.166C19.954 5.718 22.066 4.944 24.237 5.005C26.409 5.065 28.474 5.954 30.011 7.489C31.545 9.023 32.435 11.087 32.497 13.257C32.559 15.42 31.793 17.525 30.356 19.143L17.998 31.519L5.643 19.143C4.204 17.524 3.438 15.417 3.501 13.252C3.564 11.081 4.455 9.016 5.992 7.482C7.53 5.948 9.596 5.059 11.768 5.001Z"
        fill={filled ? "#EB0000" : "white"}
        fillOpacity={filled ? 0.86 : 1}
        stroke="black"
      />
    </svg>
  );
}

export default function RestaurantCard({
  restaurant,
  variant = "vertical",
}: RestaurantCardProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(restaurant.isSaved ?? false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    setSaved(restaurant.isSaved ?? false);
  }, [restaurant.isSaved, restaurant.id]);

  const handleBookmarkToggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (bookmarkLoading) {
      return;
    }

    if (getAuthMode() !== "user") {
      navigate("/login");
      return;
    }

    const previous = saved;
    setSaved(!previous);
    setBookmarkLoading(true);

    try {
      const res = await fetchWithAuth(
        `/restaurants/bookmark/${restaurant.id}`,
        {
          method: "PUT",
        },
      );

      if (!res.ok) {
        setSaved(previous);
        if (res.status === 401 || res.status === 403) {
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      setSaved(previous);
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (variant === "horizontal") {
    return (
      <Link
        to={`/restaurant/${restaurant.id}`}
        className="block flex-shrink-0 w-[280px] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-[0_8px_20px_rgba(0,0,0,0.12)] dark:bg-[#121212] dark:border-[#2A2A2A] dark:shadow-[0_10px_24px_rgba(0,0,0,0.65)]"
      >
        <div className="relative">
          {restaurant.image ? (
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-[163px] object-cover"
            />
          ) : (
            <div className="w-full h-[163px] bg-gradient-to-br from-[#FF7B00] to-[#F56C87] flex items-center justify-center px-4 text-center">
              <p className="font-lato text-white font-bold text-xl line-clamp-2">
                {restaurant.name}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white border-t border-gray-200 pt-1 pb-3 px-0 dark:bg-[#121212] dark:border-[#2A2A2A]">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-lato font-bold text-2xl text-black">
                {restaurant.name}
              </span>
              <span className="ml-2 font-lato text-sm text-black">
                <span className="font-bold">Cuisine:</span> {restaurant.cuisine}{" "}
                - {restaurant.priceRange}
              </span>
            </div>
            <button
              className="ml-auto flex-shrink-0"
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              aria-label={
                saved ? "Remove from favourites" : "Save to favourites"
              }
            >
              <HeartIcon filled={saved} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-lato font-bold text-sm text-black">
              Rating:
            </span>
            <StarIcon />
            <span className="font-lato text-sm text-black">
              {restaurant.rating}
            </span>
            <span className="ml-3 font-lato font-bold text-sm text-black">
              Distance:
            </span>
            <span className="font-lato text-sm text-black">
              {restaurant.distance} Miles
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/restaurant/${restaurant.id}`} className="block">
      <div className="border border-black rounded-[30px] overflow-hidden bg-white mx-6">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-[163px] object-cover"
          />
        ) : (
          <div className="w-full h-[163px] bg-gradient-to-br from-[#FF7B00] to-[#F56C87] flex items-center justify-center px-4 text-center">
            <p className="font-lato text-white font-bold text-xl line-clamp-2">
              {restaurant.name}
            </p>
          </div>
        )}
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="font-lato font-bold text-2xl text-black">
                {restaurant.name}
              </span>
              <span className="ml-2 font-lato text-sm text-black">
                <span className="font-bold">Cuisine:</span> {restaurant.cuisine}{" "}
                - {restaurant.priceRange}
              </span>
            </div>
            <button
              className="flex-shrink-0 ml-2"
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              aria-label={
                saved ? "Remove from favourites" : "Save to favourites"
              }
            >
              <HeartIcon filled={saved} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-lato font-bold text-sm text-black">
              Rating:
            </span>
            <StarIcon />
            <span className="font-lato text-sm text-black">
              {restaurant.rating}
            </span>
            <span className="ml-3 font-lato font-bold text-sm text-black">
              Distance:
            </span>
            <span className="font-lato text-sm text-black">
              {restaurant.distance} Miles
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
