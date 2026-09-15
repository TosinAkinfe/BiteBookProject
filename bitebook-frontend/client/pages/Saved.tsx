import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import RestaurantCard from "../components/RestaurantCard";
import type { Restaurant } from "../data/restaurants";
import { fetchWithAuth, getToken } from "../lib/auth";
import { mapBackendRestaurantToCard } from "../lib/restaurantMapper";

export default function Saved() {
  const navigate = useNavigate();
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasToken, setHasToken] = useState(Boolean(getToken()));

  useEffect(() => {
    const fetchSavedRestaurants = async () => {
      const token = getToken();
      setHasToken(Boolean(token));

      if (!token) {
        setSavedRestaurants([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetchWithAuth("/restaurants/bookmarks/me");
        const data = await res.json();

        if (!res.ok) {
          setError(data.details || "Failed to load saved restaurants");
          setSavedRestaurants([]);
          return;
        }

        const mapped = Array.isArray(data)
          ? data
              .map((item) => ({
                ...mapBackendRestaurantToCard(item),
                isSaved: true,
              }))
              .filter((r) => Boolean(r.id))
          : [];

        setSavedRestaurants(mapped);
        setError("");
      } catch (err) {
        console.error("Failed to fetch saved restaurants:", err);
        setError("Unable to load saved restaurants. Please try again.");
        setSavedRestaurants([]);
      } finally {
        setLoading(false);
        setHasToken(Boolean(getToken()));
      }
    };

    fetchSavedRestaurants();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto pt-[140px] pb-[100px] max-w-[402px] mx-auto w-full">
        <div className="px-4 mb-8">
          <h1 className="font-great-vibes text-4xl text-black text-center mb-2">
            Favourites
          </h1>
          <p className="font-inter text-sm text-gray-600 text-center">
            {hasToken
              ? `${savedRestaurants.length} restaurants saved`
              : "Sign in to view your saved restaurants"}
          </p>
        </div>

        {loading && (
          <div className="px-4 py-8 text-center">
            <p className="font-inter text-sm text-gray-500">
              Loading saved restaurants...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-4 mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && hasToken && savedRestaurants.length > 0 ? (
          <div className="px-4 space-y-4">
            {savedRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                variant="vertical"
              />
            ))}
          </div>
        ) : !loading && !hasToken ? (
          <div className="px-4 py-12 text-center">
            <h3 className="font-inter font-semibold text-lg text-black mb-2">
              Sign In Required
            </h3>
            <p className="font-inter text-sm text-gray-600 mb-6">
              Please sign in to view and manage your saved restaurants.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="inline-block px-6 py-2 bg-[#FF7B00] text-white font-inter font-medium rounded-lg hover:bg-[#E56A00] transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          !loading && (
            <div className="px-4 py-12 text-center">
              <div className="mb-4 text-4xl">❤️</div>
              <h3 className="font-inter font-semibold text-lg text-black mb-2">
                No Saved Restaurants
              </h3>
              <p className="font-inter text-sm text-gray-600 mb-6">
                Start exploring and save your favourite restaurants
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-2 bg-[#FF7B00] text-white font-inter font-medium rounded-lg hover:bg-[#E56A00] transition-colors"
              >
                Explore Restaurants
              </Link>
            </div>
          )
        )}
      </main>

      <BottomNav />
    </div>
  );
}
