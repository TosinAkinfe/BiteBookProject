require("dotenv").config();

const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const Restaurant = require("../models/restaurant");
const { buildMenuItems } = require("../utils/menuItems");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_USER_AGENT = "BiteBook/1.0 (Canterbury import script)";
const CANTERBURY_BBOX = {
  south: 51.25,
  west: 1.03,
  north: 51.31,
  east: 1.11,
};
const DEFAULT_PRICE_BY_VENUE = {
  cafe: "££",
  restaurant: "££",
  quick_bite: "£",
  bakery: "£",
  desserts: "£",
  pub: "££",
  bar: "££",
};

const VENUE_TYPE_FROM_AMENITY = {
  cafe: "cafe",
  restaurant: "restaurant",
  fast_food: "quick_bite",
  bakery: "bakery",
  ice_cream: "desserts",
  pub: "pub",
  bar: "bar",
};

function normalizeUrl(value) {
  if (!value) {
    return "";
  }

  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function toAbsoluteUrl(url, baseUrl) {
  const normalized = normalizeUrl(url);
  if (normalized) {
    return normalized;
  }

  if (!baseUrl || !url) {
    return "";
  }

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return "";
  }
}

function isLikelyImageUrl(url) {
  if (!url) {
    return false;
  }

  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|#|$)/i.test(url);
}

function normalizeVenueName(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .replace(/\b(the|restaurant|cafe|bar|pub|ltd|limited|co|company)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function commonsFileUrl(fileName) {
  if (!fileName) {
    return "";
  }

  const cleaned = String(fileName)
    .replace(/^File:/i, "")
    .trim();
  if (!cleaned) {
    return "";
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    cleaned.replace(/ /g, "_"),
  )}`;
}

function pushUniqueUrl(list, value) {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return;
  }

  if (!list.includes(normalized)) {
    list.push(normalized);
  }
}

function buildAddress(tags = {}) {
  const parts = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  return parts.join(", ");
}

function getVenueWebsite(tags = {}) {
  return normalizeUrl(
    tags.website || tags["contact:website"] || tags.url || tags["contact:url"],
  );
}

function getDirectImageCandidate(tags = {}) {
  const candidates = [
    tags.image,
    tags["image:website"],
    tags["image:url"],
    tags["facebook:image"],
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function getDirectCommonsCandidate(tags = {}) {
  const raw = tags.wikimedia_commons || tags["wikimedia:commons"] || "";
  if (!raw) {
    return "";
  }

  if (/^File:/i.test(String(raw))) {
    return commonsFileUrl(raw);
  }

  return "";
}

function getWikidataCandidates(tags = {}) {
  return [tags.wikidata, tags["brand:wikidata"], tags["operator:wikidata"]]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function chooseVenueType(tags = {}) {
  if (tags.amenity && VENUE_TYPE_FROM_AMENITY[tags.amenity]) {
    return VENUE_TYPE_FROM_AMENITY[tags.amenity];
  }

  return "restaurant";
}

function extractMetaImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?:secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?:secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?:secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?:secure_url)?["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const resolved = toAbsoluteUrl(decodeHtmlEntities(match[1]), baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  return "";
}

function extractImgSrc(html, baseUrl) {
  const imageMatches = [
    ...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi),
  ];

  for (const match of imageMatches) {
    const candidate = toAbsoluteUrl(decodeHtmlEntities(match[1]), baseUrl);
    if (!candidate || !isLikelyImageUrl(candidate)) {
      continue;
    }

    if (/logo|icon|avatar|sprite/i.test(candidate)) {
      continue;
    }

    return candidate;
  }

  return "";
}

async function fetchWebsitePhoto(websiteUrl) {
  if (!websiteUrl) {
    return "";
  }

  try {
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": OVERPASS_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return "";
    }

    const html = await response.text();
    const metaImage = extractMetaImage(html, websiteUrl);
    if (metaImage) {
      return metaImage;
    }

    const firstImage = extractImgSrc(html, websiteUrl);
    if (firstImage) {
      return firstImage;
    }
  } catch {
    return "";
  }

  return "";
}

async function fetchWikidataImage(wikidataId) {
  if (!wikidataId) {
    return "";
  }

  try {
    const apiUrl = new URL("https://www.wikidata.org/w/api.php");
    apiUrl.searchParams.set("action", "wbgetentities");
    apiUrl.searchParams.set("ids", wikidataId);
    apiUrl.searchParams.set("props", "claims");
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("origin", "*");

    const response = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const entity = data?.entities?.[wikidataId];
    const mainsnak = entity?.claims?.P18?.[0]?.mainsnak;
    const fileName = mainsnak?.datavalue?.value;

    if (!fileName) {
      return "";
    }

    const encodedFileName = encodeURIComponent(
      String(fileName).replace(/ /g, "_"),
    );
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFileName}`;
  } catch {
    return "";
  }
}

async function searchWikidataEntity(name, venueType) {
  if (!name) {
    return "";
  }

  try {
    const query = `${name} Canterbury ${venueType}`.trim();
    const apiUrl = new URL("https://www.wikidata.org/w/api.php");
    apiUrl.searchParams.set("action", "wbsearchentities");
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("language", "en");
    apiUrl.searchParams.set("type", "item");
    apiUrl.searchParams.set("limit", "5");
    apiUrl.searchParams.set("search", query);
    apiUrl.searchParams.set("origin", "*");

    const response = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const normalizedName = normalizeVenueName(name);
    const candidates = Array.isArray(data?.search) ? data.search : [];

    for (const item of candidates) {
      const label = normalizeVenueName(item?.label || "");
      const description = normalizeVenueName(item?.description || "");
      if (
        normalizedName &&
        label &&
        !label.includes(normalizedName) &&
        !normalizedName.includes(label)
      ) {
        continue;
      }

      if (
        description &&
        !description.includes("canterbury") &&
        !description.includes("kent")
      ) {
        continue;
      }

      const image = await fetchWikidataImage(item.id);
      if (image) {
        return image;
      }
    }
  } catch {
    return "";
  }

  return "";
}

async function searchCommonsImage(name, venueType) {
  if (!name) {
    return "";
  }

  try {
    const search = `${name} Canterbury ${venueType}`.trim();
    const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
    apiUrl.searchParams.set("action", "query");
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("generator", "search");
    apiUrl.searchParams.set("gsrnamespace", "6");
    apiUrl.searchParams.set("gsrsearch", search);
    apiUrl.searchParams.set("gsrlimit", "5");
    apiUrl.searchParams.set("prop", "imageinfo");
    apiUrl.searchParams.set("iiprop", "url");
    apiUrl.searchParams.set("origin", "*");

    const response = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {});
    for (const page of pages) {
      const imageUrl = page?.imageinfo?.[0]?.url;
      if (imageUrl && isLikelyImageUrl(imageUrl)) {
        return imageUrl;
      }
    }
  } catch {
    return "";
  }

  return "";
}

async function resolveActualPhotoCandidates(tags = {}, venueType, name) {
  const candidates = [];

  const directImage = getDirectImageCandidate(tags);
  if (directImage) {
    pushUniqueUrl(candidates, directImage);
  }

  const commonsDirect = getDirectCommonsCandidate(tags);
  if (commonsDirect) {
    pushUniqueUrl(candidates, commonsDirect);
  }

  for (const wikidataId of getWikidataCandidates(tags)) {
    const wikidataImage = await fetchWikidataImage(wikidataId);
    if (wikidataImage) {
      pushUniqueUrl(candidates, wikidataImage);
    }
  }

  const wikidataBySearch = await searchWikidataEntity(name, venueType);
  if (wikidataBySearch) {
    pushUniqueUrl(candidates, wikidataBySearch);
  }

  const commonsBySearch = await searchCommonsImage(name, venueType);
  if (commonsBySearch) {
    pushUniqueUrl(candidates, commonsBySearch);
  }

  const websiteUrl = getVenueWebsite(tags);
  const websiteImage = await fetchWebsitePhoto(websiteUrl);
  if (websiteImage) {
    pushUniqueUrl(candidates, websiteImage);
  }

  return candidates;
}

function chooseCuisine(tags = {}, venueType) {
  if (tags.cuisine) {
    return String(tags.cuisine)
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" / ");
  }

  const labelMap = {
    cafe: "Coffee & Snacks",
    restaurant: "Restaurant",
    quick_bite: "Quick Bite",
    bakery: "Bakery",
    desserts: "Desserts",
    pub: "Pub Food",
    bar: "Bar Snacks",
  };

  return labelMap[venueType] || "Restaurant";
}

async function uploadSeedPhoto(imageUrl, venueType, name) {
  const folder = `bitebook-imports/${venueType}`;
  let lastError = null;
  let response = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(imageUrl, {
        headers: {
          "User-Agent": OVERPASS_USER_AGENT,
          Accept: "image/*,*/*",
        },
      });

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`Image fetch failed with ${response.status}`);
      } else {
        break;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error("Image fetch failed");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Image fetch returned ${contentType || "unknown content"}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}

async function fetchOverpassPlaces() {
  const query = `
    [out:json][timeout:120];
    (
      node["amenity"~"restaurant|cafe|fast_food|pub|bar|bakery|ice_cream"](${CANTERBURY_BBOX.south},${CANTERBURY_BBOX.west},${CANTERBURY_BBOX.north},${CANTERBURY_BBOX.east});
      way["amenity"~"restaurant|cafe|fast_food|pub|bar|bakery|ice_cream"](${CANTERBURY_BBOX.south},${CANTERBURY_BBOX.west},${CANTERBURY_BBOX.north},${CANTERBURY_BBOX.east});
      relation["amenity"~"restaurant|cafe|fast_food|pub|bar|bakery|ice_cream"](${CANTERBURY_BBOX.south},${CANTERBURY_BBOX.west},${CANTERBURY_BBOX.north},${CANTERBURY_BBOX.east});
    );
    out center tags;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": OVERPASS_USER_AGENT,
      Accept: "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.elements) ? data.elements : [];
}

function mapElementToRestaurant(element) {
  const tags = element.tags || {};
  const venueType = chooseVenueType(tags);
  const name = tags.name || tags.brand || `Canterbury ${venueType}`;
  const coords =
    element.lat && element.lon
      ? { lat: element.lat, lng: element.lon }
      : element.center
        ? { lat: element.center.lat, lng: element.center.lon }
        : null;

  if (
    !coords ||
    typeof coords.lat !== "number" ||
    typeof coords.lng !== "number"
  ) {
    return null;
  }

  return {
    name,
    cuisine: chooseCuisine(tags, venueType),
    venueType,
    imageSource: null,
    priceRange: tags.price || DEFAULT_PRICE_BY_VENUE[venueType] || "££",
    location: {
      address: buildAddress(tags) || tags.address || "Canterbury, Kent",
      coordinates: {
        lat: coords.lat,
        lng: coords.lng,
      },
    },
    studentPerks: {
      hasStudentDiscount: false,
      discountDetail: "",
      isStudyFriendly: venueType === "cafe" || venueType === "bakery",
    },
    amenities: {
      wifiStrength: tags.internet_access === "wlan" ? "Strong" : "None",
      powerOutlets:
        venueType === "cafe" || venueType === "bakery" ? "Many" : "Few",
      noiseLevel:
        venueType === "bar" || venueType === "pub" ? "Loud" : "Moderate",
    },
    source: {
      provider: "openstreetmap",
      placeId: String(element.id),
      url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    },
  };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 8000,
  });

  console.log("🌱 Connected to MongoDB for Canterbury import...");

  const elements = await fetchOverpassPlaces();
  console.log(
    `📍 Found ${elements.length} Canterbury food/drink places in Overpass`,
  );

  const imported = [];
  const skippedNoCoordinates = [];
  const skippedNoRealPhoto = [];
  const imageCache = new Map();

  for (const element of elements) {
    const mapped = mapElementToRestaurant(element);
    if (!mapped) {
      skippedNoCoordinates.push(element.id);
      continue;
    }

    const actualPhotoSources = await resolveActualPhotoCandidates(
      element.tags || {},
      mapped.venueType,
      mapped.name,
    );

    if (actualPhotoSources.length === 0) {
      skippedNoRealPhoto.push(`${element.id}:${mapped.name}`);
      continue;
    }

    let cloudinaryImage = "";
    let selectedImageSource = "";

    for (const candidate of actualPhotoSources) {
      const imageKey = `${mapped.venueType}:${candidate}`;
      const cached = imageCache.get(imageKey);
      if (cached) {
        cloudinaryImage = cached;
        selectedImageSource = candidate;
        break;
      }

      try {
        const uploaded = await uploadSeedPhoto(
          candidate,
          mapped.venueType,
          mapped.name,
        );
        imageCache.set(imageKey, uploaded);
        cloudinaryImage = uploaded;
        selectedImageSource = candidate;
        break;
      } catch {
        continue;
      }
    }

    if (!cloudinaryImage) {
      skippedNoRealPhoto.push(`${element.id}:${mapped.name}`);
      continue;
    }

    mapped.imageSource = selectedImageSource;

    const existing = await Restaurant.findOne({
      "source.provider": "openstreetmap",
      "source.placeId": mapped.source.placeId,
    });

    const payload = {
      name: mapped.name,
      cuisine: mapped.cuisine,
      venueType: mapped.venueType,
      image: cloudinaryImage,
      priceRange: mapped.priceRange,
      menuItems: buildMenuItems({
        name: mapped.name,
        cuisine: mapped.cuisine,
        venueType: mapped.venueType,
      }),
      location: mapped.location,
      studentPerks: mapped.studentPerks,
      amenities: mapped.amenities,
      source: mapped.source,
      averageRating: existing?.averageRating || 0,
    };

    if (existing) {
      await Restaurant.updateOne({ _id: existing._id }, { $set: payload });
      imported.push({ action: "updated", name: mapped.name });
    } else {
      await Restaurant.create(payload);
      imported.push({ action: "created", name: mapped.name });
    }
  }

  console.log(`✅ Imported/updated ${imported.length} places`);
  console.log(
    `⚪ Skipped ${skippedNoCoordinates.length} records without coordinates`,
  );
  console.log(
    `⚪ Skipped ${skippedNoRealPhoto.length} records without a real photo source`,
  );

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("❌ Canterbury import failed:", error.message);
  await mongoose.connection.close().catch(() => {});
  process.exitCode = 1;
});
