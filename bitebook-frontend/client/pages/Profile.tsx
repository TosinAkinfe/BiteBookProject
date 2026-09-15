import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  fetchCurrentUser,
  fetchWithAuth,
  getAuthMode,
  type AuthUser,
} from "../lib/auth";

type ProfileReview = {
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

type ProfileStats = {
  followersCount?: number;
  followingCount?: number;
  reviewsCount?: number;
  likesReceived?: number;
};

type ProfileResponse = {
  reviews?: ProfileReview[];
  stats?: ProfileStats;
  details?: string;
};

type SocialUser = {
  id: string;
  username: string;
  profilePictureUrl?: string;
  role?: string;
};

type SocialListType = "followers" | "following";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [reviews, setReviews] = useState<ProfileReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [stats, setStats] = useState<ProfileStats>({});
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState("");
  const [pictureSuccess, setPictureSuccess] = useState("");
  const [socialListOpen, setSocialListOpen] = useState(false);
  const [socialListType, setSocialListType] = useState<SocialListType | null>(
    null,
  );
  const [socialListLoading, setSocialListLoading] = useState(false);
  const [socialListError, setSocialListError] = useState("");
  const [socialListItems, setSocialListItems] = useState<SocialUser[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const authMode = getAuthMode();
  const isGuest = authMode === "guest" || !authMode;

  useEffect(() => {
    const loadUser = async () => {
      if (isGuest) {
        setUser(null);
        setLoadingUser(false);
        setReviewsLoading(false);
        return;
      }

      setLoadingUser(true);
      const me = await fetchCurrentUser();
      setUser(me);
      setLoadingUser(false);

      if (!me?.id) {
        setReviewsLoading(false);
        return;
      }

      try {
        setReviewsLoading(true);
        const res = await fetchWithAuth(`/social/users/${me.id}`);
        const data = (await res.json()) as ProfileResponse;

        if (!res.ok) {
          setReviewsError(data?.details || "Failed to load your reviews.");
          setReviews([]);
          setStats({});
          return;
        }

        setReviews(data.reviews || []);
        setStats(data.stats || {});
        setReviewsError("");
      } catch (err) {
        console.error("Failed to load profile reviews:", err);
        setReviewsError("Unable to load your reviews right now.");
        setReviews([]);
        setStats({});
      } finally {
        setReviewsLoading(false);
      }
    };

    loadUser();
  }, [isGuest]);

  const handleProfilePictureUpload = async (file: File | null) => {
    if (!file || !user) return;

    setPictureError("");
    setPictureSuccess("");
    setUploadingPicture(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const res = await fetchWithAuth("/auth/me", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setPictureError(data?.details || "Failed to update profile picture.");
        return;
      }

      setUser(data);
      setPictureSuccess("Profile picture updated.");
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      setPictureError("Something went wrong while uploading your picture.");
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSelectPicture = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveProfilePicture = async () => {
    if (!user) return;

    setUploadingPicture(true);
    setPictureError("");
    setPictureSuccess("");

    try {
      const res = await fetchWithAuth("/auth/me/profile-picture", {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setPictureError(data?.details || "Failed to remove profile picture.");
        return;
      }

      setUser(data);
      setPictureSuccess("Profile picture removed.");
    } catch (err) {
      console.error("Failed to remove profile picture:", err);
      setPictureError("Something went wrong while removing your picture.");
    } finally {
      setUploadingPicture(false);
    }
  };

  useEffect(() => {
    const loadSocialList = async () => {
      if (!socialListOpen || !socialListType || !user?.id) {
        return;
      }

      setSocialListLoading(true);
      setSocialListError("");

      try {
        const res = await fetchWithAuth(
          `/social/users/${user.id}/${socialListType}`,
        );
        const data = (await res.json()) as {
          items?: SocialUser[];
          details?: string;
        };

        if (!res.ok) {
          setSocialListError(data?.details || "Failed to load list.");
          setSocialListItems([]);
          return;
        }

        setSocialListItems(data.items || []);
      } catch (err) {
        console.error("Failed to load social list:", err);
        setSocialListError("Unable to load this list right now.");
        setSocialListItems([]);
      } finally {
        setSocialListLoading(false);
      }
    };

    loadSocialList();
  }, [socialListOpen, socialListType, user?.id]);

  const openSocialList = (type: SocialListType) => {
    if (!user?.id || isGuest) return;

    setSocialListType(type);
    setSocialListOpen(true);
  };

  const closeSocialList = () => {
    setSocialListOpen(false);
    setSocialListType(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto pt-[120px] pb-[100px] max-w-[402px] mx-auto w-full relative">
        <div className="px-4 mb-8 text-center">
          <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-3 overflow-hidden">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.username || "Profile picture"}
                className="w-full h-full object-cover"
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
          <button
            type="button"
            onClick={handleSelectPicture}
            disabled={uploadingPicture || isGuest}
            className="mb-3 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {uploadingPicture ? "Uploading..." : "Change Profile Picture"}
          </button>
          {user?.profilePictureUrl && (
            <button
              type="button"
              onClick={handleRemoveProfilePicture}
              disabled={uploadingPicture || isGuest}
              className="mb-3 ml-2 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              {uploadingPicture ? "Removing..." : "Remove"}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleProfilePictureUpload(event.target.files?.[0] || null)
            }
          />
          {pictureError && (
            <p className="mb-2 text-sm text-red-600">{pictureError}</p>
          )}
          {pictureSuccess && (
            <p className="mb-2 text-sm text-green-700">{pictureSuccess}</p>
          )}
          <h1 className="font-great-vibes text-4xl text-black mb-1">
            {loadingUser ? "Loading..." : user?.username || "Profile"}
          </h1>
        </div>

        <div className="space-y-6 px-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <button
              type="button"
              onClick={() => openSocialList("followers")}
              disabled={isGuest || loadingUser}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <p className="font-lato text-2xl font-bold text-black">
                {stats.followersCount || 0}
              </p>
              <p className="font-inter text-[11px] uppercase tracking-widest text-gray-500">
                Followers
              </p>
            </button>
            <button
              type="button"
              onClick={() => openSocialList("following")}
              disabled={isGuest || loadingUser}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <p className="font-lato text-2xl font-bold text-black">
                {stats.followingCount || 0}
              </p>
              <p className="font-inter text-[11px] uppercase tracking-widest text-gray-500">
                Following
              </p>
            </button>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="font-lato text-2xl font-bold text-black">
                {stats.likesReceived || 0}
              </p>
              <p className="font-inter text-[11px] uppercase tracking-widest text-gray-500">
                Likes
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="font-lato text-2xl font-bold text-black">
                {(stats.reviewsCount ?? reviews.length) || 0}
              </p>
              <p className="font-inter text-[11px] uppercase tracking-widest text-gray-500">
                Reviews
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-lato font-bold text-xs text-gray-500 mb-3 uppercase tracking-widest">
              Your Reviews
            </h3>
            {reviewsLoading ? (
              <p className="font-inter text-sm text-gray-500">
                Loading your reviews...
              </p>
            ) : reviewsError ? (
              <div className="rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
                {reviewsError}
              </div>
            ) : reviews.length === 0 ? (
              <p className="font-inter text-sm text-gray-500">
                You haven&apos;t posted any reviews yet.
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
                      <p className="font-inter text-sm font-semibold text-black">
                        {review.rating}/5
                      </p>
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
        </div>
      </main>

      <Dialog
        open={socialListOpen}
        onOpenChange={(open) =>
          open ? setSocialListOpen(true) : closeSocialList()
        }
      >
        <DialogContent className="max-w-[380px] rounded-2xl border border-[#E0E0E0] bg-white p-0 shadow-2xl">
          <div className="p-6">
            <DialogHeader className="text-left space-y-2">
              <DialogTitle className="font-lato text-xl text-black">
                {socialListType === "followers" ? "Followers" : "Following"}
              </DialogTitle>
              <DialogDescription className="font-inter text-sm text-gray-500">
                {socialListType === "followers"
                  ? "People following your profile"
                  : "People you follow"}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {socialListLoading ? (
                <p className="font-inter text-sm text-gray-500">
                  Loading list...
                </p>
              ) : socialListError ? (
                <div className="rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
                  {socialListError}
                </div>
              ) : socialListItems.length === 0 ? (
                <p className="font-inter text-sm text-gray-500">
                  No {socialListType || "users"} to show yet.
                </p>
              ) : (
                socialListItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/users/${item.id}`}
                    onClick={closeSocialList}
                    className="flex items-center gap-3 rounded-2xl border border-[#E0E0E0] bg-white p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100 border border-gray-200 shrink-0">
                      {item.profilePictureUrl ? (
                        <img
                          src={item.profilePictureUrl}
                          alt={item.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-lato text-sm font-bold text-black">
                          {item.username?.slice(0, 1)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-lato font-bold text-black">
                        {item.username}
                      </p>
                      <p className="font-inter text-xs text-gray-500">
                        View profile
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
