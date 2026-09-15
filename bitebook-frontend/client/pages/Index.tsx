import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import RestaurantCard from "../components/RestaurantCard";
import { API_URL } from "../config/api";
import type { Restaurant } from "../data/restaurants";
import { fetchCurrentUser, getAuthHeaders } from "../lib/auth";
import { mapBackendRestaurantToCard } from "../lib/restaurantMapper";

type TrendingReview = {
  _id: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
  createdAt?: string;
  user?: {
    _id?: string;
    username?: string;
    profilePictureUrl?: string;
  };
  restaurant?: {
    _id?: string;
    name?: string;
    image?: string;
  };
};

type TrendingRestaurant = {
  id: string;
  recentReviews: number;
  restaurant: Restaurant;
};

type Category = "all" | "cafe" | "restaurant" | "quick_bite" | "desserts";
type SortOption = "price_asc" | "price_desc" | "rating_desc" | "popular";

interface CategoryOption {
  id: Category;
  label: string;
  icon: React.ReactNode;
}

const FILTERABLE_CATEGORIES: Category[] = [
  "cafe",
  "restaurant",
  "quick_bite",
  "desserts",
];

const VALID_PRICE_BUCKETS = ["£", "££", "£££"];

const CATEGORIES: CategoryOption[] = [
  {
    id: "all",
    label: "All",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5S8 12.93 8 11s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "cafe",
    label: "Cafes",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "restaurant",
    label: "Restaurants",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "quick_bite",
    label: "Quick Bites",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13h4v6h-4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "desserts",
    label: "Desserts",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C9.24 2 7 4.24 7 7c0 2.21 1.34 4.09 3.25 4.85V14H8v2h3v6h2v-6h3v-2h-2.25v-2.15C15.66 11.09 17 9.21 17 7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [trendingRestaurants, setTrendingRestaurants] = useState<
    TrendingRestaurant[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendingError, setTrendingError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const currentUser = await fetchCurrentUser();
      setIsAdmin(currentUser?.role === "admin");
    };

    loadCurrentUser();

    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const allItems: unknown[] = [];
        let page = 1;
        let pages = 1;

        do {
          const res = await fetch(
            `${API_URL}/restaurants?limit=50&page=${page}`,
            {
              headers: getAuthHeaders(),
            },
          );
          const data = await res.json();

          if (!res.ok) {
            setError(data.details || "Failed to fetch restaurants");
            setRestaurants([]);
            return;
          }

          const items = Array.isArray(data.items) ? data.items : [];
          allItems.push(...items);
          pages = Number(data.pages) > 0 ? Number(data.pages) : 1;
          page += 1;
        } while (page <= pages);

        const mappedRestaurants = allItems
          .map(mapBackendRestaurantToCard)
          .filter((restaurant) => Boolean(restaurant.id));

        setRestaurants(mappedRestaurants);
        setError("");
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
        setError("Unable to load restaurants. Please try again.");
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTrendingRestaurants = async () => {
      try {
        setTrendingLoading(true);
        const res = await fetch(`${API_URL}/restaurants/trending?limit=6`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok) {
          setTrendingError(
            data.details || "Failed to load trending restaurants",
          );
          setTrendingRestaurants([]);
          return;
        }

        const mappedTrending = Array.isArray(data)
          ? data
              .map((item: any) => ({
                id: String(item._id || item.id || item.restaurant?._id || ""),
                recentReviews: Number(item.count || item.reviews || 0),
                restaurant: mapBackendRestaurantToCard(
                  item.details || item.restaurant || item,
                ),
              }))
              .filter((entry: TrendingRestaurant) =>
                Boolean(entry.restaurant.id),
              )
          : [];

        setTrendingRestaurants(mappedTrending);
        setTrendingError("");
      } catch (err) {
        console.error("Failed to fetch trending restaurants:", err);
        setTrendingError("Unable to load trending restaurants right now.");
        setTrendingRestaurants([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchRestaurants();
    fetchTrendingRestaurants();
  }, []);

  const selectedCategories = useMemo(() => {
    const raw = searchParams.get("categories") || "";
    const values = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry): entry is Category =>
        FILTERABLE_CATEGORIES.includes(entry as Category),
      );

    return Array.from(new Set(values));
  }, [searchParams]);

  const selectedPriceRanges = useMemo(() => {
    const raw = searchParams.get("prices") || "";
    const values = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => VALID_PRICE_BUCKETS.includes(entry));

    return Array.from(new Set(values));
  }, [searchParams]);

  const sortOption = (searchParams.get("sort") || "") as SortOption;
  const minRating = Number(searchParams.get("minRating") || "0");

  const activeCategory: Category =
    selectedCategories.length === 1
      ? selectedCategories[0]
      : selectedCategories.length === 0
        ? "all"
        : "all";

  const parsePriceWeight = (priceRange: string) => {
    const count = (priceRange.match(/£/g) || []).length;
    return count > 0 ? count : 2;
  };

  const matchesCategory = (restaurant: Restaurant, category: Category) => {
    if (category === "desserts") {
      return (
        restaurant.venueType === "desserts" ||
        restaurant.venueType === "bakery" ||
        restaurant.venueType === "ice_cream"
      );
    }

    if (category === "quick_bite") {
      return (
        restaurant.venueType === "quick_bite" ||
        restaurant.venueType === "fast_food"
      );
    }

    return restaurant.venueType === category;
  };

  const filteredAndSortedRestaurants = useMemo(() => {
    let next = [...restaurants];

    if (selectedCategories.length > 0) {
      next = next.filter((restaurant) =>
        selectedCategories.some((category) =>
          matchesCategory(restaurant, category),
        ),
      );
    }

    if (selectedPriceRanges.length > 0) {
      next = next.filter((restaurant) =>
        selectedPriceRanges.includes(restaurant.priceRange || ""),
      );
    }

    if (!Number.isNaN(minRating) && minRating > 0) {
      next = next.filter(
        (restaurant) => Number(restaurant.rating || 0) >= minRating,
      );
    }

    if (sortOption === "price_asc") {
      next.sort(
        (a, b) =>
          parsePriceWeight(a.priceRange) - parsePriceWeight(b.priceRange),
      );
    } else if (sortOption === "price_desc") {
      next.sort(
        (a, b) =>
          parsePriceWeight(b.priceRange) - parsePriceWeight(a.priceRange),
      );
    } else if (sortOption === "rating_desc" || sortOption === "popular") {
      next.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return next;
  }, [
    restaurants,
    selectedCategories,
    selectedPriceRanges,
    minRating,
    sortOption,
  ]);

  const setCategoriesFilter = (categories: Category[]) => {
    const nextParams = new URLSearchParams(searchParams);
    const values = categories.filter((category) => category !== "all");

    if (values.length === 0) {
      nextParams.delete("categories");
    } else {
      nextParams.set("categories", values.join(","));
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleChipCategoryClick = (category: Category) => {
    if (category === "all") {
      setCategoriesFilter([]);
      return;
    }

    setCategoriesFilter([category]);
  };

  const cafes = filteredAndSortedRestaurants.filter(
    (restaurant) => restaurant.venueType === "cafe",
  );
  const restaurantsOnly = filteredAndSortedRestaurants.filter(
    (restaurant) => restaurant.venueType === "restaurant",
  );
  const quickBites = filteredAndSortedRestaurants.filter(
    (restaurant) => restaurant.venueType === "quick_bite",
  );
  const desserts = filteredAndSortedRestaurants.filter(
    (restaurant) =>
      restaurant.venueType === "desserts" || restaurant.venueType === "bakery",
  );

  const sections = [
    {
      title: "Cafes",
      category: "cafe" as const,
      restaurants: cafes.slice(0, 6),
    },
    {
      title: "Restaurants",
      category: "restaurant" as const,
      restaurants: restaurantsOnly.slice(0, 6),
    },
    {
      title: "Quick Bites",
      category: "quick_bite" as const,
      restaurants: quickBites.slice(0, 6),
    },
    {
      title: "Bakeries & Desserts",
      category: "desserts" as const,
      restaurants: desserts.slice(0, 6),
    },
  ];

  const visibleSections =
    selectedCategories.length === 0 || activeCategory === "all"
      ? sections
      : sections.filter((section) =>
          selectedCategories.includes(section.category),
        );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto pt-[140px] pb-[100px] max-w-[402px] mx-auto w-full">
        <div className="px-4 mb-8">
          <h1 className="font-great-vibes text-4xl text-black text-center mb-2">
            Discover
          </h1>
          <p className="font-inter text-sm text-gray-600 text-center">
            Find restaurants near you
          </p>
        </div>

        {error && (
          <div className="mx-4 mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="px-4 py-8 text-center">
            <p className="font-inter text-sm text-gray-500">
              Loading restaurants...
            </p>
          </div>
        )}

        <div className="px-4 mb-8 pb-6 border-b border-gray-200">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide mb-3">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleChipCategoryClick(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? "bg-[#FF7B00] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-inter text-sm font-medium">
                  {category.label}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              navigate(
                {
                  pathname: "/filters",
                  search: location.search,
                },
                {
                  state: { backgroundLocation: location },
                },
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white font-inter text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M6 12h12M9 18h6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Filters
          </button>
        </div>

        <div className="px-4 mb-8">
          <div className="mb-4 flex items-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M13.5 2.5C10.8 5.4 9.5 7.8 9.5 10.4C9.5 12.4 10.6 13.8 12.1 14.8C13.1 13.2 13.5 11.9 13.5 10.7C14.8 11.9 15.6 13.6 15.6 15.4C15.6 18.3 13.6 20.7 10.7 20.7C7.4 20.7 5 18 5 14.7C5 11 7.7 7.5 11.3 4.3L13.5 2.5Z"
                fill="black"
              />
            </svg>
            <h2 className="font-lato font-bold text-lg text-black">
              Trending Restaurants
            </h2>
          </div>

          {trendingError && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {trendingError}
            </div>
          )}

          {trendingLoading ? (
            <p className="font-inter text-sm text-gray-500">
              Loading trending restaurants...
            </p>
          ) : trendingRestaurants.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {trendingRestaurants.map((entry) => (
                <div
                  key={entry.id}
                  className="flex-shrink-0 w-[300px] rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-300 bg-gray-100">
                      <img
                        src={entry.restaurant.image}
                        alt={entry.restaurant.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-lato text-base font-bold text-black">
                        {entry.restaurant.name}
                      </p>
                      <p className="truncate font-inter text-xs text-gray-500">
                        {entry.restaurant.cuisine} ·{" "}
                        {entry.restaurant.priceRange}
                      </p>
                      <p className="font-inter text-[11px] text-gray-500">
                        {entry.recentReviews} recent review
                        {entry.recentReviews === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        entry.restaurant.id &&
                        navigate(`/restaurant/${entry.restaurant.id}`)
                      }
                      className="rounded-full border border-black px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white"
                    >
                      Open
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M13.5 2.5C10.8 5.4 9.5 7.8 9.5 10.4C9.5 12.4 10.6 13.8 12.1 14.8C13.1 13.2 13.5 11.9 13.5 10.7C14.8 11.9 15.6 13.6 15.6 15.4C15.6 18.3 13.6 20.7 10.7 20.7C7.4 20.7 5 18 5 14.7C5 11 7.7 7.5 11.3 4.3L13.5 2.5Z"
                          fill="white"
                        />
                      </svg>
                      Trending
                    </span>
                    <span className="font-inter text-[11px] text-gray-500">
                      Updated from recent user reviews
                    </span>
                  </div>

                  {entry.restaurant.image && (
                    <img
                      src={entry.restaurant.image}
                      alt={entry.restaurant.name}
                      className="mt-3 w-full h-[170px] rounded-2xl object-cover border border-[#E0E0E0]"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-inter text-sm text-gray-500">
              No trending restaurants yet.
            </p>
          )}
        </div>

        {!loading && filteredAndSortedRestaurants.length > 0 && (
          <div className="space-y-8 px-4">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <div className="mb-4">
                  <h2 className="font-lato font-bold text-lg text-black">
                    {section.title}
                  </h2>
                  <div className="h-1 w-12 bg-[#FF7B00] rounded-full mt-2"></div>
                </div>

                <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  {section.restaurants.length > 0 ? (
                    section.restaurants.map((restaurant) => (
                      <div key={restaurant.id} className="flex-shrink-0 w-64">
                        <RestaurantCard
                          restaurant={restaurant}
                          variant="horizontal"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-sm text-gray-500 font-inter">
                      No {section.title.toLowerCase()} found yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAndSortedRestaurants.length === 0 && !error && (
          <div className="px-4 py-8 text-center">
            <p className="font-inter text-sm text-gray-500">
              No restaurants match your filters
            </p>
          </div>
        )}

        {!loading && isAdmin && (
          <div className="px-4 mt-10 pb-2 xl:hidden">
            <button
              onClick={() =>
                navigate("/restaurants/new", {
                  state: { backgroundLocation: location },
                })
              }
              className="w-full rounded-[28px] bg-black px-5 py-4 text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF7B00] text-xl leading-none text-white">
                  +
                </span>
                <div className="text-left">
                  <div className="font-lato text-lg font-bold leading-none">
                    Add Restaurant
                  </div>
                  <div className="font-inter text-xs text-gray-300">
                    Admin access only
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
