import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import { fetchCurrentUser, fetchWithAuth, getAuthMode } from "../lib/auth";

type UserReview = {
  _id: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
  createdAt?: string;
  restaurant?: {
    _id?: string;
    name?: string;
    image?: string;
  };
};

type PublicUserProfile = {
  id: string;
  username: string;
  role?: string;
  profilePictureUrl?: string;
  createdAt?: string;
};

type UserProfileResponse = {
  user: PublicUserProfile;
  reviews: UserReview[];
  stats?: {
    followersCount?: number;
    followingCount?: number;
    reviewsCount?: number;
    likesReceived?: number;
    isFollowingByMe?: boolean;
  };
  totalReviews: number;
  details?: string;
};

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 20" fill="none">
          <path
            d="M11.769 1.241C11.853 1.032 12.147 1.032 12.231 1.241L14.336 6.45C14.451 6.733 14.726 6.919 15.031 6.919H21.566C21.821 6.919 21.912 7.256 21.692 7.385L16.606 10.356C16.285 10.544 16.15 10.94 16.289 11.285L18.273 16.195C18.362 16.416 18.121 16.625 17.915 16.505L12.378 13.27C12.144 13.133 11.856 13.133 11.622 13.27L6.085 16.505C5.879 16.625 5.638 16.416 5.727 16.195L7.711 11.285C7.85 10.94 7.715 10.544 7.394 10.356L2.308 7.385C2.087 7.256 2.179 6.919 2.434 6.919H8.969C9.274 6.919 9.549 6.733 9.664 6.45L11.769 1.241Z"
            fill={i < Math.round(rating) ? "#F2CF63" : "white"}
            stroke="black"
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function Avatar({ name, imageUrl }: { name?: string; imageUrl?: string }) {
  return (
    <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || "Profile picture"}
          className="h-full w-full object-cover"
        />
      ) : (
        <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M25 45.3125C28.5659 45.3177 32.0698 44.3798 35.1562 42.5938V35.9375C35.1562 34.0727 34.4155 32.2843 33.0968 30.9657C31.7782 29.647 29.9898 28.9062 28.125 28.9062H21.875C20.0102 28.9062 18.2218 29.647 16.9032 30.9657C15.5845 32.2843 14.8438 34.0727 14.8438 35.9375V42.5938C17.9302 44.3798 21.4341 45.3177 25 45.3125ZM39.8438 35.9375V38.8656C42.546 35.9728 44.344 32.3535 45.0169 28.4526C45.6898 24.5516 45.2082 20.5391 43.6312 16.9082C42.0543 13.2773 39.4509 10.1863 36.1408 8.01514C32.8308 5.84398 28.9585 4.68731 25 4.68731C21.0415 4.68731 17.1692 5.84398 13.8592 8.01514C10.5491 10.1863 7.94566 13.2773 6.36875 16.9082C4.79184 20.5391 4.31022 24.5516 4.98311 28.4526C5.65599 32.3535 7.45405 35.9728 10.1562 38.8656V35.9375C10.1553 33.5213 10.9013 31.1638 12.292 29.188C13.6827 27.2121 15.6502 25.7144 17.925 24.9C16.745 23.5427 15.9802 21.8746 15.7221 20.0947C15.4639 18.3148 15.7232 16.4981 16.469 14.8615C17.2148 13.2249 18.4156 11.8373 19.9282 10.8643C21.4409 9.89133 23.2015 9.37398 25 9.37398C26.7985 9.37398 28.5591 9.89133 30.0718 10.8643C31.5844 11.8373 32.7852 13.2249 33.531 14.8615C34.2768 16.4981 34.5361 18.3148 34.2779 20.0947C34.0197 21.8746 33.255 23.5427 32.075 24.9C34.3498 25.7144 36.3173 27.2121 37.708 29.188C39.0987 31.1638 39.8447 33.5213 39.8438 35.9375ZM25 50C31.6304 50 37.9893 47.3661 42.6777 42.6777C47.3661 37.9893 50 31.6304 50 25C50 18.3696 47.3661 12.0107 42.6777 7.32233C37.9893 2.63392 31.6304 0 25 0C18.3696 0 12.0107 2.63392 7.32233 7.32233C2.63392 12.0107 0 18.3696 0 25C0 31.6304 2.63392 37.9893 7.32233 42.6777C12.0107 47.3661 18.3696 50 25 50Z"
            fill="black"
          />
        </svg>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [stats, setStats] = useState<UserProfileResponse["stats"]>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isGuest = getAuthMode() !== "user";

  useEffect(() => {
    const loadCurrentUser = async () => {
      const me = await fetchCurrentUser();
      setCurrentUserId(me?.id || null);
      setIsAdmin(me?.role === "admin");
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) {
        setError("User id is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetchWithAuth(`/social/users/${id}`);
        const data = (await res.json()) as UserProfileResponse;

        if (!res.ok) {
          setError(data?.details || "Failed to load user profile.");
          setProfile(null);
          setReviews([]);
          setStats({});
          return;
        }

        setProfile(data.user);
        setReviews(data.reviews || []);
        setStats(data.stats || {});
        setError("");
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError("Unable to load this profile right now.");
        setProfile(null);
        setReviews([]);
        setStats({});
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!profile?.id || !currentUserId || currentUserId === profile.id) return;

    if (isGuest) {
      navigate("/login");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetchWithAuth(`/social/follow/${profile.id}`, {
        method: "PUT",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.details || "Failed to update follow status.");
        return;
      }

      setStats((prev) => {
        const isFollowing = Boolean(prev?.isFollowingByMe);
        return {
          ...prev,
          isFollowingByMe: !isFollowing,
          followersCount: Math.max(
            0,
            (prev?.followersCount || 0) + (isFollowing ? -1 : 1),
          ),
        };
      });
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      setError("Unable to update follow right now.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDeleteUser = async () => {
    if (!profile?.id || !isAdmin) return;

    const confirmed = window.confirm(
      `Delete ${profile.username}'s account? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetchWithAuth(`/auth/admin/users/${profile.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.details || "Failed to delete account.");
        return;
      }

      navigate("/search?tab=users");
    } catch (err) {
      console.error("Failed to delete user account:", err);
      setError("Unable to delete this account right now.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar showBack onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pt-[140px] pb-[100px] max-w-[402px] mx-auto w-full">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <p className="font-inter text-sm text-gray-500">
              Loading reviewer profile...
            </p>
          </div>
        ) : error || !profile ? (
          <div className="px-4 py-8 text-center">
            <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
              {error || "Profile not found"}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-[#FF7B00] text-white"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 mb-6 text-center">
              <Avatar
                name={profile.username}
                imageUrl={profile.profilePictureUrl}
              />
              <h1 className="font-great-vibes text-4xl text-black mb-1">
                {profile.username}
              </h1>
              <p className="font-inter text-sm text-gray-500">
                {(stats?.reviewsCount ?? reviews.length) || 0} review
                {(stats?.reviewsCount ?? reviews.length) === 1 ? "" : "s"}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="font-lato text-lg font-bold text-black">
                    {stats?.followersCount || 0}
                  </p>
                  <p className="font-inter text-[11px] text-gray-500">
                    Followers
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="font-lato text-lg font-bold text-black">
                    {stats?.followingCount || 0}
                  </p>
                  <p className="font-inter text-[11px] text-gray-500">
                    Following
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="font-lato text-lg font-bold text-black">
                    {stats?.likesReceived || 0}
                  </p>
                  <p className="font-inter text-[11px] text-gray-500">Likes</p>
                </div>
              </div>

              {currentUserId && currentUserId !== profile.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={actionLoading}
                  className={`mt-4 w-full rounded-full px-4 py-3 font-lato font-bold text-white transition-colors disabled:opacity-60 ${
                    stats?.isFollowingByMe
                      ? "bg-black hover:bg-gray-800"
                      : "bg-[#FF7B00] hover:bg-[#E56A00]"
                  }`}
                >
                  {actionLoading
                    ? "Updating..."
                    : stats?.isFollowingByMe
                      ? "Unfollow"
                      : "Follow"}
                </button>
              )}

              {isAdmin && currentUserId !== profile.id && (
                <button
                  onClick={handleAdminDeleteUser}
                  disabled={actionLoading}
                  className="mt-3 w-full rounded-full border border-red-300 bg-red-50 px-4 py-3 font-lato font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  {actionLoading ? "Deleting..." : "Delete Account (Admin)"}
                </button>
              )}
            </div>

            <div className="px-4 mb-6 space-y-4">
              <h3 className="font-lato font-bold text-black">Reviews</h3>

              {reviews.length === 0 ? (
                <p className="font-inter text-sm text-gray-500">
                  This user has not posted any reviews yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <Link
                      key={review._id}
                      to={
                        review.restaurant?._id
                          ? `/restaurant/${review.restaurant._id}`
                          : "/"
                      }
                      className="block rounded-2xl border border-[#E0E0E0] bg-white p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-lato font-bold text-black">
                            {review.restaurant?.name || "Restaurant"}
                          </p>
                          <p className="font-inter text-xs text-gray-500">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString(
                                  "en-GB",
                                )
                              : "Recently"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <ReviewStars rating={Number(review.rating || 0)} />
                          <span className="font-inter text-xs font-semibold text-black">
                            {formatScore(Number(review.rating || 0))}/5
                          </span>
                        </div>
                      </div>

                      <p className="font-inter text-sm text-gray-700 leading-6 line-clamp-3">
                        {review.comment || "No comment provided."}
                      </p>

                      {review.photoUrl && (
                        <img
                          src={review.photoUrl}
                          alt="Review upload"
                          className="mt-3 w-full max-h-[520px] rounded-xl object-contain bg-black/5 border border-[#E0E0E0]"
                        />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
