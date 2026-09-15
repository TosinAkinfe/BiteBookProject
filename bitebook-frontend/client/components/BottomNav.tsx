import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const { pathname } = useLocation();

  const isHome = pathname === "/";
  const isSearch = pathname === "/search";
  const isSaved = pathname === "/saved";
  const isProfile = pathname.startsWith("/profile");

  const homeClass = isHome ? "text-[#FF7B00]" : "text-black dark:text-white";
  const searchClass = isSearch
    ? "text-[#FF7B00]"
    : "text-black dark:text-white";
  const savedClass = isSaved ? "text-[#FF7B00]" : "text-black dark:text-white";
  const profileClass = isProfile
    ? "text-[#FF7B00]"
    : "text-black dark:text-white";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 xl:hidden dark:bg-black dark:border-[#262626]">
      <div className="max-w-[402px] mx-auto h-[84px] flex items-start pt-3 px-3 justify-between">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-11 transition-colors duration-200 ${homeClass}`}
          aria-label="Home"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 10.5L12 3L21 10.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 9.8V20C5 20.55 5.45 21 6 21H10V14H14V21H18C18.55 21 19 20.55 19 20V9.8"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <Link
          to="/search"
          className={`flex flex-col items-center justify-center w-11 transition-colors duration-200 ${searchClass}`}
          aria-label="Search"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.5 18C14.642 18 18 14.642 18 10.5C18 6.358 14.642 3 10.5 3C6.358 3 3 6.358 3 10.5C3 14.642 6.358 18 10.5 18Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 16L21 21"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <Link
          to="/saved"
          className={`flex flex-col items-center justify-center w-11 transition-colors duration-200 ${savedClass}`}
          aria-label="Saved"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 4.5H18C18.55 4.5 19 4.95 19 5.5V21L12 17.25L5 21V5.5C5 4.95 5.45 4.5 6 4.5Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center w-11 transition-colors duration-200 ${profileClass}`}
          aria-label="Profile"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12C14.209 12 16 10.209 16 8C16 5.791 14.209 4 12 4C9.791 4 8 5.791 8 8C8 10.209 9.791 12 12 12Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
