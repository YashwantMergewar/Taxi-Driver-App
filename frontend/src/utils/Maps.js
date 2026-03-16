// ─── maps.js ────────────────────────────────────────────────────────────────
// 100% FREE — No API key, No credit card, No signup required
//
// Services used:
//   Autocomplete  → Nominatim (OpenStreetMap)  — nominatim.openstreetmap.org
//   Distance      → OSRM                       — router.project-osrm.org
//   Reverse Geo   → Nominatim
//
// Rate limits (be respectful):
//   Nominatim → max 1 request/second (we handle this with 350ms debounce)
//   OSRM      → no strict limit for reasonable use
//
// Usage Policy:
//   Add your app name to the User-Agent header (required by Nominatim ToS)
//   Set APP_NAME below to your actual app name
// ─────────────────────────────────────────────────────────────────────────────

const APP_NAME   = 'Taxi-Driver';      // ← change to your app name
const APP_EMAIL  = 'yashwantmergewar@gmail.com';   // ← change to your email (Nominatim ToS)

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE      = 'https://router.project-osrm.org';

// Nominatim requires a descriptive User-Agent — do not skip this
const NOMINATIM_HEADERS = {
  'User-Agent':    `${APP_NAME} (${APP_EMAIL})`,
  'Accept':        'application/json',
  'Accept-Language': 'en',
};

// ── Fare config — adjust to your city ─────────────────────────────────────
const FARE_CONFIG = {
  BASE_FARE:        30,   // ₹ base/minimum charge
  PER_KM_RATE:      12,   // ₹ per km
  PER_MIN_RATE:      1,   // ₹ per minute of travel time
  SURGE_MULTIPLIER:  1,   // 1 = normal | 1.5 = 50% surge
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTOCOMPLETE — search places by text
//    Returns array of { placeId, description, mainText, secondaryText, lat, lng }
// ─────────────────────────────────────────────────────────────────────────────
export const getPlaceSuggestions = async (input) => {
  if (!input || input.trim().length < 3) return [];

  const params = new URLSearchParams({
    q:               input.trim(),
    format:          'json',
    addressdetails:  '1',
    limit:           '6',
    countrycodes:    'in',        // restrict to India — remove or change for other countries
    'accept-language': 'en',
  });

  const url = `${NOMINATIM_BASE}/search?${params}`;

  const res  = await fetch(url, { headers: NOMINATIM_HEADERS });
  const json = await res.json();

  if (!Array.isArray(json)) return [];

  return json.map((place) => {
    // Build readable short name from address parts
    const addr    = place.address || {};
    const mainText =
      addr.road        ||
      addr.suburb      ||
      addr.neighbourhood ||
      addr.city_district ||
      place.name       ||
      place.display_name.split(',')[0];

    const secondaryParts = [
      addr.suburb      || addr.neighbourhood || addr.city_district,
      addr.city        || addr.town || addr.village,
      addr.state,
    ].filter(Boolean);

    return {
      placeId:       place.place_id.toString(),
      description:   place.display_name,
      mainText:      mainText.trim(),
      secondaryText: secondaryParts.join(', '),
      lat:           parseFloat(place.lat),
      lng:           parseFloat(place.lon),
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET PLACE DETAILS — get lat/lng + full address from a placeId
//    (Nominatim returns lat/lng directly in search results,
//     so this just returns what we already have from suggestion)
// ─────────────────────────────────────────────────────────────────────────────
export const getPlaceDetails = async (placeId) => {
  const params = new URLSearchParams({
    place_id:        placeId,
    format:          'json',
    addressdetails:  '1',
    'accept-language': 'en',
  });

  const url  = `${NOMINATIM_BASE}/details?${params}`;
  const res  = await fetch(url, { headers: NOMINATIM_HEADERS });
  const json = await res.json();

  return {
    lat:     parseFloat(json.centroid?.coordinates?.[1] ?? 0),
    lng:     parseFloat(json.centroid?.coordinates?.[0] ?? 0),
    address: json.localname || json.names?.name || placeId,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET DISTANCE & DURATION — real driving route via OSRM
//    originCoords  → { lat, lng }
//    destCoords    → { lat, lng }
//    Returns { distanceKm, durationMin, distanceText, durationText }
// ─────────────────────────────────────────────────────────────────────────────
export const getDistanceAndDuration = async (originCoords, destCoords) => {
  // OSRM coordinate order is lng,lat (not lat,lng)
  const origin = `${originCoords.lng},${originCoords.lat}`;
  const dest   = `${destCoords.lng},${destCoords.lat}`;

  const url = `${OSRM_BASE}/route/v1/driving/${origin};${dest}?overview=false`;

  const res  = await fetch(url);
  const json = await res.json();

  if (json.code !== 'Ok' || !json.routes?.length) {
    throw new Error('No driving route found between these locations');
  }

  const route       = json.routes[0];
  const distanceKm  = parseFloat((route.distance / 1000).toFixed(1)); // metres → km
  const durationMin = Math.ceil(route.duration / 60);                  // seconds → min

  // Format readable strings
  const distanceText = distanceKm >= 1
    ? `${distanceKm} km`
    : `${Math.round(route.distance)} m`;

  const durationText = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
    : `${durationMin} min`;

  return { distanceKm, durationMin, distanceText, durationText };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CALCULATE FARE — pure function, no API call
// ─────────────────────────────────────────────────────────────────────────────
export const calculateFare = (distanceKm, durationMin) => {
  const { BASE_FARE, PER_KM_RATE, PER_MIN_RATE, SURGE_MULTIPLIER } = FARE_CONFIG;
  const raw = BASE_FARE + (distanceKm * PER_KM_RATE) + (durationMin * PER_MIN_RATE);
  return Math.ceil(raw * SURGE_MULTIPLIER); // round up to nearest ₹
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET FULL ESTIMATE — combines OSRM distance + fare calculation
//    Pass origin + destination coords → returns everything at once
// ─────────────────────────────────────────────────────────────────────────────
export const getFareEstimate = async (originCoords, destCoords) => {
  const { distanceKm, durationMin, distanceText, durationText } =
    await getDistanceAndDuration(originCoords, destCoords);

  const fare = calculateFare(distanceKm, durationMin);

  return { fare, distanceKm, durationMin, distanceText, durationText };
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SESSION TOKEN — kept for API compatibility with LocationInput
//    (Nominatim doesn't need sessions but LocationInput passes one)
// ─────────────────────────────────────────────────────────────────────────────
export const generateSessionToken = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);