import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { type Location, useLocation, useNavigate } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import { API_URL } from "../config/api";
import { fetchCurrentUser, getToken } from "../lib/auth";

type FormState = {
  name: string;
  cuisine: string;
  address: string;
  priceRange: string;
  lat: string;
  lng: string;
  hasStudentDiscount: boolean;
  discountDetail: string;
  isStudyFriendly: boolean;
  wifiStrength: string;
  powerOutlets: string;
  noiseLevel: string;
};

const initialState: FormState = {
  name: "",
  cuisine: "",
  address: "",
  priceRange: "££",
  lat: "",
  lng: "",
  hasStudentDiscount: false,
  discountDetail: "",
  isStudyFriendly: false,
  wifiStrength: "Strong",
  powerOutlets: "Many",
  noiseLevel: "Moderate",
};

function AddRestaurantForm({
  form,
  setForm,
  imageFile,
  setImageFile,
  loading,
  message,
  error,
  onSubmit,
}: {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  imageFile: File | null;
  setImageFile: Dispatch<SetStateAction<File | null>>;
  loading: boolean;
  message: string;
  error: string;
  onSubmit: (e: FormEvent) => Promise<void> | void;
}) {
  return (
    <>
      <h1 className="font-lato font-bold text-2xl text-black mb-2">
        Add Restaurant
      </h1>
      <p className="font-inter text-sm text-gray-600 mb-6">
        Upload photo, add details, and publish to the app.
      </p>

      {message && (
        <div className="mb-4 rounded border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          placeholder="Restaurant name"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <input
          value={form.cuisine}
          onChange={(e) => setForm((s) => ({ ...s, cuisine: e.target.value }))}
          placeholder="Cuisine"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <input
          value={form.address}
          onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
          placeholder="Address"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.lat}
            onChange={(e) => setForm((s) => ({ ...s, lat: e.target.value }))}
            placeholder="Latitude"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <input
            value={form.lng}
            onChange={(e) => setForm((s) => ({ ...s, lng: e.target.value }))}
            placeholder="Longitude"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.priceRange}
            onChange={(e) =>
              setForm((s) => ({ ...s, priceRange: e.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="£">£</option>
            <option value="££">££</option>
            <option value="£££">£££</option>
            <option value="££££">££££</option>
          </select>

          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <select
            value={form.wifiStrength}
            onChange={(e) =>
              setForm((s) => ({ ...s, wifiStrength: e.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="None">No Wifi</option>
            <option value="Weak">Weak Wifi</option>
            <option value="Strong">Strong Wifi</option>
          </select>

          <select
            value={form.powerOutlets}
            onChange={(e) =>
              setForm((s) => ({ ...s, powerOutlets: e.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="None">No Sockets</option>
            <option value="Few">Few Sockets</option>
            <option value="Many">Many Sockets</option>
          </select>

          <select
            value={form.noiseLevel}
            onChange={(e) =>
              setForm((s) => ({ ...s, noiseLevel: e.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="Quiet">Quiet</option>
            <option value="Moderate">Moderate</option>
            <option value="Loud">Loud</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.hasStudentDiscount}
            onChange={(e) =>
              setForm((s) => ({ ...s, hasStudentDiscount: e.target.checked }))
            }
          />
          Has student discount
        </label>

        {form.hasStudentDiscount && (
          <input
            value={form.discountDetail}
            onChange={(e) =>
              setForm((s) => ({ ...s, discountDetail: e.target.value }))
            }
            placeholder="Discount detail (example: 10% off with student ID)"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isStudyFriendly}
            onChange={(e) =>
              setForm((s) => ({ ...s, isStudyFriendly: e.target.checked }))
            }
          />
          Study friendly spot
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-[#FF7B00] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Restaurant"}
        </button>
      </form>
    </>
  );
}

export default function AddRestaurant() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as
    | { backgroundLocation?: Location }
    | undefined;
  const backgroundLocation = locationState?.backgroundLocation;
  const isOverlay = Boolean(backgroundLocation);

  const [form, setForm] = useState<FormState>(initialState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const currentUser = await fetchCurrentUser();
      setIsAdmin(currentUser?.role === "admin");
      setCheckingAccess(false);
    };

    verifyAccess();
  }, []);

  useEffect(() => {
    if (!isOverlay) {
      return;
    }

    const openTimer = window.setTimeout(() => {
      setIsOpen(true);
    }, 10);

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
      window.clearTimeout(openTimer);
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOverlay]);

  const closeTray = () => {
    setIsOpen(false);

    window.setTimeout(() => {
      if (backgroundLocation) {
        navigate(-1);
      } else {
        navigate("/");
      }
    }, 260);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const token = getToken();
    if (!token) {
      setError("You must be signed in to add a restaurant.");
      return;
    }

    if (!isAdmin) {
      setError("Only admin accounts can add restaurants.");
      return;
    }

    try {
      setLoading(true);

      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("cuisine", form.cuisine.trim());
      body.append("address", form.address.trim());
      body.append("priceRange", form.priceRange);
      body.append("lat", form.lat.trim());
      body.append("lng", form.lng.trim());
      body.append("hasStudentDiscount", String(form.hasStudentDiscount));
      body.append("discountDetail", form.discountDetail.trim());
      body.append("isStudyFriendly", String(form.isStudyFriendly));
      body.append("wifiStrength", form.wifiStrength);
      body.append("powerOutlets", form.powerOutlets);
      body.append("noiseLevel", form.noiseLevel);

      if (imageFile) {
        body.append("image", imageFile);
      }

      const res = await fetch(`${API_URL}/restaurants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.details || data?.error || "Failed to create restaurant");
        return;
      }

      setMessage("Restaurant created successfully.");
      setForm(initialState);
      setImageFile(null);

      if (data?._id) {
        navigate(`/restaurant/${data._id}`);
      }
    } catch (err) {
      console.error("Create restaurant failed:", err);
      setError("Something went wrong while creating the restaurant.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <AddRestaurantForm
      form={form}
      setForm={setForm}
      imageFile={imageFile}
      setImageFile={setImageFile}
      loading={loading}
      message={message}
      error={error}
      onSubmit={onSubmit}
    />
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-[2200] flex items-end overscroll-none">
        <div className="absolute inset-0 bg-black/20" onClick={closeTray} />

        <div
          className={`relative w-full max-w-[402px] mx-auto bg-white rounded-t-[40px] max-h-[92vh] overflow-y-auto pointer-events-auto transform transition-transform duration-300 ease-out will-change-transform pb-[calc(20px+env(safe-area-inset-bottom))] ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-3 pb-2 rounded-t-[40px]">
            <div className="flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-5 pt-4">
              <h1 className="font-lato font-bold text-2xl text-black">
                Add Restaurant
              </h1>
              <button
                onClick={closeTray}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600"
              >
                Close
              </button>
            </div>
          </div>

          <div className="px-5 pb-5">
            {checkingAccess ? (
              <div className="py-12 text-center">
                <p className="font-inter text-sm text-gray-500">
                  Checking access...
                </p>
              </div>
            ) : !isAdmin ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
                <h1 className="font-lato font-bold text-2xl text-black mb-2">
                  Admin only
                </h1>
                <p className="font-inter text-sm text-gray-600 mb-5">
                  Only admin accounts can add restaurants.
                </p>
                <button
                  onClick={closeTray}
                  className="rounded-full bg-[#FF7B00] px-5 py-3 font-semibold text-white"
                >
                  Back to Home
                </button>
              </div>
            ) : (
              content
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar showBack onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pt-[140px] pb-[100px] max-w-[402px] mx-auto w-full px-4">
        {checkingAccess ? (
          <div className="py-12 text-center">
            <p className="font-inter text-sm text-gray-500">
              Checking access...
            </p>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
            <h1 className="font-lato font-bold text-2xl text-black mb-2">
              Admin only
            </h1>
            <p className="font-inter text-sm text-gray-600 mb-5">
              Only admin accounts can add restaurants.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-full bg-[#FF7B00] px-5 py-3 font-semibold text-white"
            >
              Back to Home
            </button>
          </div>
        ) : (
          content
        )}
      </main>

      <BottomNav />
    </div>
  );
}
