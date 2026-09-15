import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import { fetchWithAuth, getAuthMode } from "../lib/auth";

type RestaurantSummary = {
  _id: string;
  name: string;
};

function formatRatingValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2 text-black dark:text-white">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 text-current"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          <svg width="32" height="28" viewBox="0 0 24 20" fill="none">
            <path
              d="M11.767 1.285C11.849 1.073 12.151 1.073 12.233 1.285L14.337 6.683C14.449 6.97 14.727 7.16 15.036 7.16H21.621C21.874 7.16 21.967 7.493 21.751 7.624L16.59 10.749C16.278 10.938 16.147 11.324 16.279 11.663L18.285 16.809C18.372 17.031 18.127 17.237 17.923 17.113L12.389 13.763C12.15 13.618 11.85 13.618 11.611 13.763L6.077 17.113C5.873 17.237 5.628 17.031 5.715 16.809L7.721 11.663C7.853 11.324 7.722 10.938 7.41 10.749L2.249 7.624C2.033 7.493 2.126 7.16 2.379 7.16H8.964C9.273 7.16 9.551 6.97 9.663 6.683L11.767 1.285Z"
              fill={n <= value ? "#F2CF63" : "none"}
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function PriceRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <span
            className={`text-2xl font-bold ${
              n <= value ? "text-[#FF7B00]" : "text-gray-400"
            }`}
          >
            £
          </span>
        </button>
      ))}
    </div>
  );
}

export default function WriteReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [experienceRating, setExperienceRating] = useState(0);
  const [priceRating, setPriceRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhoto, setReviewPhoto] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [photoInputKey, setPhotoInputKey] = useState(0);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!id) {
        setError("Restaurant id is missing.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetchWithAuth(`/restaurants/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.details || "Failed to load restaurant.");
          setRestaurant(null);
          return;
        }

        setRestaurant({ _id: data._id, name: data.name });
        setError("");
      } catch (err) {
        console.error("Failed to load restaurant for review:", err);
        setError("Unable to load this restaurant right now.");
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !restaurant) return;

    if (getAuthMode() !== "user") {
      navigate("/login");
      return;
    }

    if (experienceRating === 0 || !reviewText.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchWithAuth(`/reviews/${id}`, {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          formData.append("rating", String(experienceRating));
          formData.append("comment", reviewText.trim());
          if (reviewPhoto) {
            formData.append("photo", reviewPhoto);
          }
          return formData;
        })(),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.details || "Failed to post review.");
        return;
      }

      setSubmitted(true);
      setTimeout(() => navigate(`/restaurant/${id}`), 1200);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setError("Something went wrong while posting your review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-6xl">✓</div>
          <h2 className="font-great-vibes text-3xl text-black mb-2">
            Thank You!
          </h2>
          <p className="font-inter text-gray-600">
            Your review has been submitted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col dark:bg-black">
      <AppTopBar showBack onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pt-[140px] pb-[100px] max-w-[402px] mx-auto w-full">
        <div className="px-4 mb-8">
          <h1 className="font-great-vibes text-4xl text-black text-center mb-2 dark:text-white">
            Write Review
          </h1>
          <p className="font-inter text-sm text-gray-600 text-center dark:text-gray-300">
            {restaurant?.name || "Restaurant"}
          </p>
        </div>

        <div className="px-4 space-y-6">
          {error && (
            <div className="rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <p className="font-inter text-sm text-gray-500 dark:text-gray-300">
              Loading restaurant details...
            </p>
          ) : null}

          <div>
            <label className="block font-inter font-semibold text-black mb-3 dark:text-white">
              Star Rating
            </label>
            <StarRating
              value={experienceRating}
              onChange={setExperienceRating}
            />
            <p className="mt-2 font-inter text-sm text-gray-600 dark:text-gray-300">
              Selected rating: {formatRatingValue(experienceRating)}/5
            </p>
          </div>

          <div>
            <label className="block font-inter font-semibold text-black mb-3 dark:text-white">
              Price Range
            </label>
            <PriceRating value={priceRating} onChange={setPriceRating} />
          </div>

          <div>
            <label className="block font-inter font-semibold text-black mb-3 dark:text-white">
              Your Review
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this restaurant..."
              className="w-full h-32 px-4 py-3 border border-[#E0E0E0] rounded-lg font-inter text-sm text-black placeholder-[#828282] outline-none focus:border-[#FF7B00] focus:ring-1 focus:ring-[#FF7B00] transition-colors resize-none dark:border-[#303030] dark:bg-[#111111] dark:text-white dark:placeholder-gray-500"
            />
            <p className="font-inter text-xs text-gray-500 mt-2 dark:text-gray-400">
              {reviewText.length} characters
            </p>
          </div>

          <div>
            <label className="block font-inter font-semibold text-black mb-3 dark:text-white">
              Add Photo (Optional)
            </label>
            <input
              key={photoInputKey}
              id="review-photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setReviewPhoto(file);
              }}
            />
            <button
              type="button"
              onClick={() => document.getElementById("review-photo")?.click()}
              className="w-full p-4 border-2 border-dashed border-[#FF7B00] rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 dark:border-[#FF9F43] dark:hover:bg-[#1a1208]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5S8 12.93 8 11s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5z"
                  fill="currentColor"
                />
              </svg>
              <span className="font-inter font-medium text-[#FF7B00] dark:text-[#FFB366]">
                Add A Photo
              </span>
            </button>
            {reviewPhoto && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-[#303030] dark:bg-[#111111] dark:text-gray-300">
                Selected: {reviewPhoto.name}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              submitting ||
              !restaurant ||
              experienceRating === 0 ||
              !reviewText.trim()
            }
            className="w-full px-4 py-3 bg-[#FF7B00] text-white font-inter font-semibold rounded-lg hover:bg-[#E56A00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Posting..." : "Post Review"}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
