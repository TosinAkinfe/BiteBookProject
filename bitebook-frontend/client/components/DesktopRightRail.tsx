import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchCurrentUser } from "../lib/auth";

export default function DesktopRightRail() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const currentUser = await fetchCurrentUser();
      setIsAdmin(currentUser?.role === "admin");
    };

    loadCurrentUser();
  }, []);

  return (
    <aside className="hidden xl:block fixed right-0 top-0 h-screen w-[320px] border-l border-gray-200 bg-[#FFFDF8] px-6 py-8 dark:border-[#262626] dark:bg-[#070707]">
      <div className="mb-5 rounded-2xl border border-[#FFD7B0] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:border-[#4b3314] dark:bg-[#101010] dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
        <h3 className="font-lato font-bold text-lg text-black mb-2 dark:text-[#F9FAFB]">
          Explore Canterbury
        </h3>
        <p className="font-inter text-sm text-gray-600 mb-4 dark:text-[#CBD5E1]">
          Discover student discounts, study-friendly cafes, and trending
          restaurants around you.
        </p>
        <Link
          to="/map"
          className="inline-block rounded-lg bg-[#FF7B00] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-950/30 transition-colors hover:bg-[#E56A00]"
        >
          Open Map
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:border-[#2f2f2f] dark:bg-[#101010] dark:shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
        <h3 className="font-lato font-bold text-lg text-black mb-3 dark:text-[#F9FAFB]">
          Quick Links
        </h3>
        <div className="space-y-2 font-inter text-sm">
          <Link
            to="/notifications"
            state={{ backgroundLocation: location }}
            className="block rounded-lg border border-transparent px-3 py-2 text-gray-700 transition-colors hover:border-[#FF7B00] hover:bg-orange-50 hover:text-[#FF7B00] dark:text-[#D1D5DB] dark:hover:border-[#FF7B00] dark:hover:bg-[#1a1208] dark:hover:text-[#FFB366]"
          >
            Notifications
          </Link>
          {isAdmin && (
            <Link
              to="/restaurants/new"
              className="block rounded-lg border border-transparent px-3 py-2 text-gray-700 transition-colors hover:border-[#FF7B00] hover:bg-orange-50 hover:text-[#FF7B00] dark:text-[#D1D5DB] dark:hover:border-[#FF7B00] dark:hover:bg-[#1a1208] dark:hover:text-[#FFB366]"
            >
              Add Restaurant
            </Link>
          )}
          <Link
            to="/search"
            className="block rounded-lg border border-transparent px-3 py-2 text-gray-700 transition-colors hover:border-[#FF7B00] hover:bg-orange-50 hover:text-[#FF7B00] dark:text-[#D1D5DB] dark:hover:border-[#FF7B00] dark:hover:bg-[#1a1208] dark:hover:text-[#FFB366]"
          >
            Search Results
          </Link>
        </div>
      </div>
    </aside>
  );
}
