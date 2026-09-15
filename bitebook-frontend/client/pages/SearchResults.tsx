import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import RestaurantCard from "../components/RestaurantCard";
import { API_URL } from "../config/api";
import type { Restaurant } from "../data/restaurants";
import { fetchWithAuth, getAuthHeaders } from "../lib/auth";
import { findMatchingMenuItems } from "../lib/menuItems";
import { mapBackendRestaurantToCard } from "../lib/restaurantMapper";
import { addSearchHistory } from "../lib/searchHistory";

type SearchTab = "restaurants" | "food" | "users";

type UserSearchItem = {
  id: string;
  username: string;
  profilePictureUrl?: string;
  reviewsCount?: number;
  likesReceived?: number;
};

type FoodSearchItem = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine?: string;
  image: string;
  priceRange: string;
  address?: string;
  matchedFoods: string[];
};

function getTabFromParams(tabValue: string | null): SearchTab {
  if (tabValue === "food") return "food";
  if (tabValue === "users") return "users";
  return "restaurants";
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildFoodResults(restaurants: Restaurant[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  return restaurants
    .map((restaurant) => {
      const matchedFoods = findMatchingMenuItems(restaurant, query);
      if (matchedFoods.length === 0) return null;

      const cuisineMatches = normalizeSearchValue(
        restaurant.cuisine || "",
      ).includes(normalizedQuery);
      const displayFoods = cuisineMatches ? matchedFoods : matchedFoods;

      return {
        id: `${restaurant.id}-${displayFoods.join("-")}`,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        cuisine: restaurant.cuisine,
        image: restaurant.image,
        priceRange: restaurant.priceRange,
        address: restaurant.address,
        matchedFoods: displayFoods,
      } satisfies FoodSearchItem;
    })
    .filter((item): item is FoodSearchItem => Boolean(item))
    .sort((a, b) => {
      const aScore = normalizeSearchValue(a.restaurantName).includes(
        normalizedQuery,
      )
        ? 1
        : 0;
      const bScore = normalizeSearchValue(b.restaurantName).includes(
        normalizedQuery,
      )
        ? 1
        : 0;
      return bScore - aScore;
    });
}

function priceRank(value?: string) {
  if (value === "£") return 1;
  if (value === "££") return 2;
  if (value === "£££") return 3;
  return 99;
}

function applyClientSort(restaurants: Restaurant[], sort: string | null) {
  const items = [...restaurants];

  if (sort === "price_asc") {
    items.sort((a, b) => priceRank(a.priceRange) - priceRank(b.priceRange));
    return items;
  }

  if (sort === "price_desc") {
    items.sort((a, b) => priceRank(b.priceRange) - priceRank(a.priceRange));
    return items;
  }

  if (sort === "rating_desc") {
    items.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    return items;
  }

  if (sort === "popular") {
    items.sort(
      (a, b) => Number(b.bookmarkCount || 0) - Number(a.bookmarkCount || 0),
    );
    return items;
  }

  return items;
}

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SearchTab>(
    getTabFromParams(searchParams.get("tab")),
  );
  const [restaurantQuery, setRestaurantQuery] = useState(
    searchParams.get("restaurants") || searchParams.get("q") || "",
  );
  const [foodQuery, setFoodQuery] = useState(searchParams.get("food") || "");
  const [userQuery, setUserQuery] = useState(searchParams.get("users") || "");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foodResults, setFoodResults] = useState<FoodSearchItem[]>([]);
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingFood, setLoadingFood] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [restaurantError, setRestaurantError] = useState("");
  const [foodError, setFoodError] = useState("");
  const [userError, setUserError] = useState("");

  useEffect(() => {
    setActiveTab(getTabFromParams(searchParams.get("tab")));
    setRestaurantQuery(
      searchParams.get("restaurants") || searchParams.get("q") || "",
    );
    setFoodQuery(searchParams.get("food") || "");
    setUserQuery(searchParams.get("users") || "");
  }, [searchParams]);

  const syncSearchUrl = (
    nextTab: SearchTab,
    nextRestaurantQuery: string,
    nextFoodQuery: string,
    nextUserQuery: string,
  ) => {
    const params = new URLSearchParams();
    params.set("tab", nextTab);

    const restaurantTerm = nextRestaurantQuery.trim();
    const userTerm = nextUserQuery.trim();

    if (restaurantTerm) {
      params.set("restaurants", restaurantTerm);
    }

    const foodTerm = nextFoodQuery.trim();
    if (foodTerm) {
      params.set("food", foodTerm);
    }

    if (userTerm) {
      params.set("users", userTerm);
    }

    navigate(`/search?${params.toString()}`);
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      const query = restaurantQuery.trim();

      if (!query) {
        setRestaurants([]);
        setRestaurantError("");
        setLoadingRestaurants(false);
        return;
      }

      try {
        setLoadingRestaurants(true);
        await addSearchHistory(query);

        const sortParam = searchParams.get("sort");
        const minRatingParam = searchParams.get("minRating");
        const pricesParam = searchParams.get("prices");
        const categoriesParam = searchParams.get("categories");

        const params = new URLSearchParams({
          search: query,
          limit: "50",
          sort:
            sortParam === "popular"
              ? "bookmarks"
              : sortParam === "rating_desc"
                ? "rating"
                : "newest",
          order: "desc",
        });

        if (minRatingParam) {
          params.set("minRating", minRatingParam);
        }
        if (pricesParam) {
          params.set("prices", pricesParam);
        }
        if (categoriesParam) {
          params.set("categories", categoriesParam);
        }

        const res = await fetch(`${API_URL}/restaurants?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok) {
          setRestaurantError(data.details || "Failed to fetch restaurants");
          setRestaurants([]);
          return;
        }

        const restaurantList = data.items || data;
        const mappedRestaurants = Array.isArray(restaurantList)
          ? restaurantList
              .map(mapBackendRestaurantToCard)
              .filter((restaurant) => Boolean(restaurant.id))
          : [];

        setRestaurants(applyClientSort(mappedRestaurants, sortParam));
        setRestaurantError("");
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
        setRestaurantError("Unable to load restaurants. Please try again.");
        setRestaurants([]);
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [restaurantQuery, searchParams]);

  useEffect(() => {
    const fetchFood = async () => {
      const query = foodQuery.trim();

      if (!query) {
        setFoodResults([]);
        setFoodError("");
        setLoadingFood(false);
        return;
      }

      try {
        setLoadingFood(true);
        await addSearchHistory(query);

        const sortParam = searchParams.get("sort");
        const minRatingParam = searchParams.get("minRating");
        const pricesParam = searchParams.get("prices");
        const categoriesParam = searchParams.get("categories");

        const params = new URLSearchParams({
          search: query,
          limit: "50",
          sort:
            sortParam === "popular"
              ? "bookmarks"
              : sortParam === "rating_desc"
                ? "rating"
                : "newest",
          order: "desc",
        });

        if (minRatingParam) {
          params.set("minRating", minRatingParam);
        }
        if (pricesParam) {
          params.set("prices", pricesParam);
        }
        if (categoriesParam) {
          params.set("categories", categoriesParam);
        }

        const res = await fetch(`${API_URL}/restaurants?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (!res.ok) {
          setFoodError(data.details || "Failed to fetch food results");
          setFoodResults([]);
          return;
        }

        const restaurantList = data.items || data;
        const mappedRestaurants = Array.isArray(restaurantList)
          ? restaurantList
              .map(mapBackendRestaurantToCard)
              .filter((restaurant) => Boolean(restaurant.id))
          : [];

        const sorted = applyClientSort(mappedRestaurants, sortParam);
        setFoodResults(buildFoodResults(sorted, query));
        setFoodError("");
      } catch (err) {
        console.error("Failed to fetch food results:", err);
        setFoodError("Unable to load food results. Please try again.");
        setFoodResults([]);
      } finally {
        setLoadingFood(false);
      }
    };

    fetchFood();
  }, [foodQuery, searchParams]);

  useEffect(() => {
    const fetchUsers = async () => {
      const query = userQuery.trim();

      if (!query) {
        setUsers([]);
        setUserError("");
        setLoadingUsers(false);
        return;
      }

      try {
        setLoadingUsers(true);
        const res = await fetchWithAuth(
          `/social/users?search=${encodeURIComponent(query)}&limit=12`,
        );
        const data = await res.json();

        if (!res.ok) {
          setUserError(data.details || "Failed to fetch users");
          setUsers([]);
          return;
        }

        setUsers(Array.isArray(data.items) ? data.items : []);
        setUserError("");
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUserError("Unable to load users. Please try again.");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [userQuery]);

  const handleTabChange = (nextTab: SearchTab) => {
    setActiveTab(nextTab);
    syncSearchUrl(nextTab, restaurantQuery, foodQuery, userQuery);
  };

  const handleSearchSubmit = () => {
    if (activeTab === "restaurants") {
      const trimmed = restaurantQuery.trim();
      if (!trimmed) return;
      syncSearchUrl("restaurants", trimmed, foodQuery, userQuery);
      return;
    }

    if (activeTab === "food") {
      const trimmed = foodQuery.trim();
      if (!trimmed) return;
      syncSearchUrl("food", restaurantQuery, trimmed, userQuery);
      return;
    }

    const trimmed = userQuery.trim();
    if (!trimmed) return;
    syncSearchUrl("users", restaurantQuery, foodQuery, trimmed);
  };

  const handleActiveQueryKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const activeQuery =
    activeTab === "restaurants"
      ? restaurantQuery
      : activeTab === "food"
        ? foodQuery
        : userQuery;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto pt-[140px] pb-[100px] w-full">
        <div className="mx-auto w-full max-w-[402px] px-4">
          <h1 className="font-great-vibes text-4xl text-black text-center mb-6">
            Search
          </h1>

          <div className="mx-auto mb-6 flex w-full overflow-hidden rounded-[18px] border border-black/10 bg-[#F3F3F3] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleTabChange("restaurants")}
              className={`flex-1 rounded-[14px] px-4 py-3 text-sm font-bold transition-all md:text-base ${
                activeTab === "restaurants"
                  ? "border border-black/10 bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Restaurants
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("food")}
              className={`flex-1 rounded-[14px] px-4 py-3 text-sm font-bold transition-all md:text-base ${
                activeTab === "food"
                  ? "border border-black/10 bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Food
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("users")}
              className={`flex-1 rounded-[14px] px-4 py-3 text-sm font-bold transition-all md:text-base ${
                activeTab === "users"
                  ? "border border-black/10 bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Users
            </button>
          </div>

          <section className="mx-auto w-full">
            <div className="relative mb-4">
              <input
                value={activeQuery}
                onChange={(event) =>
                  activeTab === "restaurants"
                    ? setRestaurantQuery(event.target.value)
                    : activeTab === "food"
                      ? setFoodQuery(event.target.value)
                      : setUserQuery(event.target.value)
                }
                onKeyDown={handleActiveQueryKeyDown}
                placeholder={
                  activeTab === "restaurants"
                    ? "Find restaurants..."
                    : activeTab === "food"
                      ? "Find foods..."
                      : "Find users..."
                }
                className="w-full rounded-2xl border border-[#E0E0E0] bg-white px-4 py-4 pr-14 font-inter text-[14px] text-black outline-none transition-shadow placeholder:text-gray-400 focus:shadow-sm"
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-black"
                aria-label={
                  activeTab === "restaurants"
                    ? "Search restaurants"
                    : activeTab === "food"
                      ? "Search foods"
                      : "Search users"
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {activeTab === "restaurants" ? (
              <>
                {restaurantError && (
                  <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                    {restaurantError}
                  </div>
                )}

                {loadingRestaurants ? (
                  <p className="font-inter text-sm text-gray-500">
                    Searching restaurants...
                  </p>
                ) : restaurantQuery.trim() === "" ? (
                  <p className="font-inter text-sm text-gray-600">
                    Search by restaurant name, cuisine, or location.
                  </p>
                ) : restaurants.length > 0 ? (
                  <div className="space-y-4">
                    <p className="font-inter text-sm text-gray-600">
                      Found {restaurants.length} restaurants
                    </p>
                    {restaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        variant="vertical"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="font-inter text-sm text-gray-600">
                    Try searching with different keywords.
                  </p>
                )}
              </>
            ) : activeTab === "food" ? (
              <>
                {foodError && (
                  <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                    {foodError}
                  </div>
                )}

                {loadingFood ? (
                  <p className="font-inter text-sm text-gray-500">
                    Searching food...
                  </p>
                ) : foodQuery.trim() === "" ? (
                  <p className="font-inter text-sm text-gray-600">
                    Search by dish, ingredient, or menu item.
                  </p>
                ) : foodResults.length > 0 ? (
                  <div className="space-y-3">
                    <p className="font-inter text-sm text-gray-600">
                      Found {foodResults.length} restaurants serving matching
                      food
                    </p>
                    {foodResults.map((food) => (
                      <Link
                        key={food.id}
                        to={`/restaurant/${food.restaurantId}`}
                        className="flex items-center gap-3 rounded-2xl border border-[#E0E0E0] bg-white p-3 transition-colors hover:bg-gray-50"
                      >
                        <img
                          src={food.image}
                          alt={food.restaurantName}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-lato font-bold text-black">
                            {food.matchedFoods.join(", ")}
                          </p>
                          <p className="truncate font-inter text-xs text-gray-500">
                            {food.restaurantName} • {food.cuisine || "Food"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {food.matchedFoods.slice(0, 4).map((item) => (
                              <span
                                key={`${food.id}-${item}`}
                                className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-[11px] font-semibold text-black"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-gray-400">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M9 18l6-6-6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="font-inter text-sm text-gray-600">
                    Try a different dish or food term.
                  </p>
                )}
              </>
            ) : (
              <>
                {userError && (
                  <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                    {userError}
                  </div>
                )}

                {loadingUsers ? (
                  <p className="font-inter text-sm text-gray-500">
                    Searching users...
                  </p>
                ) : userQuery.trim() === "" ? (
                  <p className="font-inter text-sm text-gray-600">
                    Search by username.
                  </p>
                ) : users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <Link
                        key={user.id}
                        to={`/users/${user.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-[#E0E0E0] bg-white p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-300 bg-gray-100">
                          {user.profilePictureUrl ? (
                            <img
                              src={user.profilePictureUrl}
                              alt={user.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-black">
                              {user.username.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-lato font-bold text-black">
                            {user.username}
                          </p>
                          <p className="font-inter text-xs text-gray-500">
                            {user.reviewsCount || 0} reviews ·{" "}
                            {user.likesReceived || 0} likes
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="font-inter text-sm text-gray-600">
                    Try a different username.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
