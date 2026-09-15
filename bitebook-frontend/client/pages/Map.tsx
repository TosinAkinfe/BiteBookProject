import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef, useState } from "react";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import { API_URL } from "../config/api";
import { getAuthHeaders } from "../lib/auth";

const CANTERBURY_CENTER: [number, number] = [51.2802, 1.0789];
const CANTERBURY_BOUNDS = L.latLngBounds([51.18, 0.92], [51.34, 1.22]);

type BackendRestaurant = {
  _id: string;
  name: string;
  cuisine?: string;
  image?: string;
  averageRating?: number;
  location?: {
    address?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
};

type MapRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  lat: number;
  lng: number;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Map() {
  const [restaurants, setRestaurants] = useState<MapRestaurant[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchRestaurantsByBbox = async (bounds: L.LatLngBounds) => {
    try {
      const south = bounds.getSouth();
      const north = bounds.getNorth();
      const west = bounds.getWest();
      const east = bounds.getEast();

      const res = await fetch(
        `${API_URL}/restaurants/bbox?south=${south}&north=${north}&west=${west}&east=${east}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.details || "Failed to load restaurants");
        return [];
      }

      const items = Array.isArray(data.items) ? data.items : [];
      return items;
    } catch (err) {
      console.error("Failed to load restaurants by bbox:", err);
      setError("Failed to load restaurants");
      return [];
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    if (
      (mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number })
        ._leaflet_id
    ) {
      return;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        maxZoom: 18,
        minZoom: 12,
        maxBounds: CANTERBURY_BOUNDS,
        maxBoundsViscosity: 1,
      }).setView(CANTERBURY_CENTER, 14);
      const markerLayer = L.markerClusterGroup
        ? L.markerClusterGroup({ maxClusterRadius: 80 }).addTo(map)
        : L.layerGroup().addTo(map);
      markerLayerRef.current = markerLayer;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        maxNativeZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.whenReady(() => {
        window.setTimeout(() => {
          map.invalidateSize();
        }, 0);
      });

      const handleMapMove = async () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = window.setTimeout(async () => {
          const bounds = map.getBounds();
          const items = await fetchRestaurantsByBbox(bounds);
          const mapped = items
            .map((restaurant: BackendRestaurant) => {
              const lat = restaurant.location?.coordinates?.lat;
              const lng = restaurant.location?.coordinates?.lng;

              if (typeof lat !== "number" || typeof lng !== "number") {
                return null;
              }

              if (!CANTERBURY_BOUNDS.contains([lat, lng])) {
                return null;
              }

              return {
                id: restaurant._id,
                name: restaurant.name,
                cuisine: restaurant.cuisine || "Unknown",
                address: restaurant.location?.address || "",
                rating: Number(restaurant.averageRating ?? 0),
                lat,
                lng,
              };
            })
            .filter(Boolean) as MapRestaurant[];
          setRestaurants(mapped);
          setError("");
        }, 500);
      };

      map.on("moveend", handleMapMove);
      map.on("zoomend", handleMapMove);

      handleMapMove();

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });

      resizeObserver.observe(mapContainerRef.current);

      mapRef.current = map;
      setMapReady(true);

      return () => {
        resizeObserver.disconnect();
        map.off("moveend", handleMapMove);
        map.off("zoomend", handleMapMove);
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        if (markerLayerRef.current) {
          markerLayerRef.current.clearLayers();
        }
        markerLayerRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setError("Failed to initialize map");
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) {
      return;
    }

    const markerLayer = markerLayerRef.current;
    markerLayer.clearLayers();

    restaurants.forEach((restaurant) => {
      const safeName = escapeHtml(restaurant.name);
      const safeCuisine = escapeHtml(restaurant.cuisine);
      const safeAddress = escapeHtml(restaurant.address);
      const detailsHref = `/restaurant/${encodeURIComponent(restaurant.id)}`;

      L.marker([restaurant.lat, restaurant.lng])
        .addTo(markerLayer)
        .bindPopup(
          `
            <div style="min-width: 160px">
              <strong>${safeName}</strong><br />
              <span>${safeCuisine}</span><br />
              <span>Rating: ${restaurant.rating.toFixed(1)}</span><br />
              ${restaurant.address ? `<span>${safeAddress}</span><br />` : ""}
              <a
                href="${detailsHref}"
                style="display:inline-block;margin-top:8px;padding:6px 10px;border-radius:8px;background:#111827;color:#ffffff;font-size:12px;text-decoration:none;"
              >
                View Restaurant
              </a>
            </div>
          `,
        );
    });
  }, [restaurants]);

  return (
    <div className="h-[100dvh] overflow-hidden overscroll-none bg-white flex flex-col">
      <AppTopBar />

      <main className="flex-1 pt-[84px] pb-[calc(104px+env(safe-area-inset-bottom))] px-4 overflow-hidden overscroll-none flex flex-col">
        <div className="max-w-[402px] mx-auto mb-3">
          <h1 className="font-great-vibes text-4xl text-black mb-2 text-center">
            Map View
          </h1>
          <p className="font-inter text-gray-600 text-center mb-0 max-w-xs mx-auto">
            Restaurants around Canterbury
          </p>
        </div>

        {error && (
          <div className="max-w-[402px] mx-auto mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="max-w-[402px] w-full mx-auto rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex-1 min-h-0">
          <div className="relative h-full min-h-[320px] w-full">
            <div
              ref={mapContainerRef}
              className="h-full w-full leaflet-map"
              style={{ background: "#f8fafc" }}
            />

            {!mapReady && (
              <div className="absolute inset-0 h-full flex items-center justify-center bg-gray-50">
                <p className="font-inter text-sm text-gray-500">
                  Loading map...
                </p>
              </div>
            )}
          </div>
        </div>

        {mapReady && restaurants.length === 0 && !error && (
          <div className="max-w-[402px] mx-auto mt-4 text-center">
            <p className="font-inter text-sm text-gray-500">
              No restaurants found in this area.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
