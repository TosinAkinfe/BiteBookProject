import { useEffect, useMemo, useState } from "react";
import { type Location, useLocation, useNavigate } from "react-router-dom";

type SortValue = "price_asc" | "price_desc" | "rating_desc" | "popular";

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Price Ascending", value: "price_asc" },
  { label: "Price Descending", value: "price_desc" },
  { label: "Highest Rated", value: "rating_desc" },
  { label: "Most Popular", value: "popular" },
];

const PRICE_OPTIONS = ["£", "££", "£££"];

const CATEGORY_OPTIONS = [
  { label: "Cafes", value: "cafe" },
  { label: "Restaurants", value: "restaurant" },
  { label: "Quick Bites", value: "quick_bite" },
  { label: "Bakeries & Desserts", value: "desserts" },
];

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        selected
          ? "bg-[#FF7B00] border-[#FF7B00]"
          : "bg-[#D9D9D9] border-[#D9D9D9]"
      }`}
    >
      {selected && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path
            d="M1 5L4.5 8.5L11 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function StarRow({
  count,
  selected,
  onClick,
}: {
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full py-2 transition-all ${
        selected ? "opacity-100" : "opacity-70"
      }`}
    >
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <svg
            key={index}
            width="22"
            height="19"
            viewBox="0 0 24 20"
            fill="none"
          >
            <path
              d="M11.769 1.241C11.853 1.032 12.147 1.032 12.231 1.241L14.336 6.45C14.451 6.733 14.726 6.919 15.031 6.919H21.566C21.821 6.919 21.912 7.256 21.692 7.385L16.606 10.356C16.285 10.544 16.15 10.94 16.289 11.285L18.273 16.195C18.362 16.416 18.121 16.625 17.915 16.505L12.378 13.27C12.144 13.133 11.856 13.133 11.622 13.27L6.085 16.505C5.879 16.625 5.638 16.416 5.727 16.195L7.711 11.285C7.85 10.94 7.715 10.544 7.394 10.356L2.308 7.385C2.087 7.256 2.179 6.919 2.434 6.919H8.969C9.274 6.919 9.549 6.733 9.664 6.45L11.769 1.241Z"
              fill={index < count ? "#F2CF63" : "none"}
              stroke="black"
              strokeWidth="0.5"
            />
          </svg>
        ))}
      </div>
      <SelectionDot selected={selected} />
    </button>
  );
}

function parseInitialState(search: string) {
  const params = new URLSearchParams(search);

  const sortValue = params.get("sort") as SortValue | null;
  const initialSort = SORT_OPTIONS.some((opt) => opt.value === sortValue)
    ? sortValue
    : null;

  const initialRating = Number(params.get("minRating") || "0");

  const initialPrices = (params.get("prices") || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => PRICE_OPTIONS.includes(entry));

  const initialCategories = (params.get("categories") || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) =>
      CATEGORY_OPTIONS.some((category) => category.value === entry),
    );

  return {
    initialSort,
    initialRating:
      Number.isNaN(initialRating) || initialRating < 1 || initialRating > 5
        ? null
        : initialRating,
    initialPrices: Array.from(new Set(initialPrices)),
    initialCategories: Array.from(new Set(initialCategories)),
  };
}

export default function FiltersOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as
    | { backgroundLocation?: Location }
    | undefined;
  const backgroundLocation = locationState?.backgroundLocation;

  const sourceSearch = backgroundLocation?.search ?? location.search;

  const { initialSort, initialRating, initialPrices, initialCategories } =
    useMemo(() => parseInitialState(sourceSearch), [sourceSearch]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortValue | null>(
    initialSort,
  );
  const [selectedRating, setSelectedRating] = useState<number | null>(
    initialRating,
  );
  const [selectedPrices, setSelectedPrices] = useState<string[]>(initialPrices);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);

  useEffect(() => {
    setSelectedSort(initialSort);
    setSelectedRating(initialRating);
    setSelectedPrices(initialPrices);
    setSelectedCategories(initialCategories);
  }, [initialSort, initialRating, initialPrices, initialCategories]);

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

  const closeTray = () => {
    setIsOpen(false);
    window.setTimeout(() => {
      navigate(-1);
    }, 260);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((entry) => entry !== category)
        : [...prev, category],
    );
  };

  const togglePrice = (price: string) => {
    setSelectedPrices((prev) =>
      prev.includes(price)
        ? prev.filter((entry) => entry !== price)
        : [...prev, price],
    );
  };

  const handleReset = () => {
    setSelectedSort(null);
    setSelectedRating(null);
    setSelectedPrices([]);
    setSelectedCategories([]);
  };

  const handleApply = () => {
    const next = new URLSearchParams(sourceSearch);

    if (selectedSort) {
      next.set("sort", selectedSort);
    } else {
      next.delete("sort");
    }

    if (selectedRating) {
      next.set("minRating", String(selectedRating));
    } else {
      next.delete("minRating");
    }

    if (selectedPrices.length > 0) {
      next.set("prices", selectedPrices.join(","));
    } else {
      next.delete("prices");
    }

    if (selectedCategories.length > 0) {
      next.set("categories", selectedCategories.join(","));
    } else {
      next.delete("categories");
    }

    const targetPath = backgroundLocation?.pathname || "/";
    const query = next.toString();

    navigate(
      {
        pathname: targetPath,
        search: query ? `?${query}` : "",
      },
      { replace: true },
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col pointer-events-none overscroll-none xl:hidden">
      <div className="flex-1 pointer-events-auto" onClick={closeTray} />

      <div
        className={`w-full max-w-[402px] mx-auto bg-white rounded-t-[40px] overflow-y-auto max-h-[88vh] pb-[calc(16px+env(safe-area-inset-bottom))] pointer-events-auto transform transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5">
          <h2 className="font-lato font-bold text-2xl text-black text-center mb-4">
            Sort
          </h2>
          <div className="space-y-1 mb-6">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setSelectedSort((prev) =>
                    prev === option.value ? null : option.value,
                  )
                }
                className="flex items-center justify-between w-full py-2"
              >
                <span className="font-lato text-xl text-black">
                  {option.label}
                </span>
                <SelectionDot selected={selectedSort === option.value} />
              </button>
            ))}
          </div>

          <div className="h-px bg-gray-200 mb-6" />

          <h2 className="font-lato font-bold text-2xl text-black text-center mb-4">
            Price
          </h2>
          <div className="space-y-1 mb-6">
            {PRICE_OPTIONS.map((price) => (
              <button
                key={price}
                onClick={() => togglePrice(price)}
                className="flex items-center justify-between w-full py-2"
              >
                <span className="font-lato text-xl text-black">{price}</span>
                <SelectionDot selected={selectedPrices.includes(price)} />
              </button>
            ))}
          </div>

          <div className="h-px bg-gray-200 mb-6" />

          <h2 className="font-lato font-bold text-2xl text-black text-center mb-4">
            Rating
          </h2>
          <div className="space-y-1 mb-6">
            {[1, 2, 3, 4, 5].map((stars) => (
              <StarRow
                key={stars}
                count={stars}
                selected={selectedRating === stars}
                onClick={() =>
                  setSelectedRating((prev) => (prev === stars ? null : stars))
                }
              />
            ))}
          </div>

          <div className="h-px bg-gray-200 mb-6" />

          <h2 className="font-lato font-bold text-2xl text-black text-center mb-4">
            Categories
          </h2>
          <div className="space-y-1 mb-8">
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category.value}
                onClick={() => toggleCategory(category.value)}
                className="flex items-center justify-between w-full py-2"
              >
                <span className="font-lato text-xl text-black">
                  {category.label}
                </span>
                <SelectionDot
                  selected={selectedCategories.includes(category.value)}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 pb-2">
            <button
              onClick={handleApply}
              className="w-full py-4 bg-[#FF7B00] text-white font-lato font-bold text-lg rounded-full hover:bg-[#E56A00] transition-colors"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="w-full py-4 bg-black text-white font-lato font-bold text-lg rounded-full hover:bg-gray-900 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
