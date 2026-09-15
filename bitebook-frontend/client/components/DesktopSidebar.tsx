import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Search", to: "/search" },
  { label: "Map", to: "/map" },
  { label: "Saved", to: "/saved" },
  { label: "Profile", to: "/profile" },
  { label: "Settings", to: "/profile/settings" },
];

export default function DesktopSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden xl:flex fixed left-0 top-0 h-screen w-[260px] border-r border-gray-200 bg-white px-6 py-8 flex-col">
      <Link
        to="/"
        className="font-spartan text-[36px] leading-none mb-10 select-none"
      >
        <span className="text-black" style={{ WebkitTextStroke: "1px black" }}>
          Bite
        </span>
        <span
          className="text-[#FF7B00]"
          style={{ WebkitTextStroke: "1px black" }}
        >
          Book
        </span>
      </Link>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-xl px-4 py-3 font-lato text-lg transition-colors ${
                isActive
                  ? "bg-orange-50 text-[#FF7B00] font-bold"
                  : "text-black hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
