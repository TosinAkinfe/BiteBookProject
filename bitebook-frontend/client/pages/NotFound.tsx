import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AppTopBar from "../components/AppTopBar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar />
      <main className="flex-1 flex flex-col items-center justify-center pb-[84px] pt-[60px] px-6">
        <h1 className="font-great-vibes text-[48px] text-black mb-4">Oops!</h1>
        <p className="font-lato text-lg text-gray-600 mb-2 text-center">
          This page doesn't exist yet.
        </p>
        <p className="font-lato text-sm text-gray-400 mb-8 text-center">
          Keep prompting to build this page out!
        </p>
        <Link
          to="/"
          className="rounded-full bg-[#FF7B00] px-8 py-3 font-lato font-bold text-white text-lg hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </main>
      <BottomNav />
    </div>
  );
};

export default NotFound;
