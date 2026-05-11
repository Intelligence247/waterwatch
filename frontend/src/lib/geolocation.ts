export const LOCATION_CAPTURE_WINDOW_MS = 6000;
export const LOCATION_TARGET_ACCURACY_METERS = 25;
export const LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS = 40;
export const LOCATION_MIN_SAMPLES = 2;
const LOCATION_COARSE_TIMEOUT_MS = 5000;
const LOCATION_CACHE_KEY = 'waterwatch:lastKnownLocation';
const STALE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour — browser may return last known fix when a fresh fix fails (common on macOS)

function getCurrentPositionOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

type CachedLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

function saveCachedLocation(position: GeolocationPosition) {
  try {
    const payload: CachedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 150,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache write errors
  }
}

function readCachedLocation(maxAgeMs = 24 * 60 * 60 * 1000): GeolocationPosition | null {
  try {
    const raw = window.localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedLocation>;
    if (
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number' ||
      typeof parsed.accuracy !== 'number' ||
      typeof parsed.timestamp !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.timestamp > maxAgeMs) return null;

    return {
      coords: {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        accuracy: parsed.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

/** City-level fallback when device GPS fails. Accuracy is synthetic. */
export const APPROXIMATE_NETWORK_ACCURACY_METERS = 8000;

async function fetchJsonWithTimeout(url: string, ms: number): Promise<unknown> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    window.clearTimeout(t);
  }
}

function parseLatLng(data: unknown): { lat: number; lng: number } | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const rawLat = o.latitude ?? o.lat;
  const rawLng = o.longitude ?? o.lng ?? o.lon;
  const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : typeof rawLat === 'number' ? rawLat : NaN;
  const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : typeof rawLng === 'number' ? rawLng : NaN;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * IP-based rough location when GPS returns nothing. Tries several endpoints;
 * `ipwho.is` often responds 403 from browsers — others are tried first.
 */
export async function fetchApproximateLocationByNetwork(): Promise<GeolocationPosition | null> {
  const endpoints: Array<{ url: string; extract: (j: unknown) => { lat: number; lng: number } | null }> = [
    {
      url: 'https://get.geojs.io/v1/ip/geo.json',
      extract: (j) => parseLatLng(j),
    },
    {
      url: 'https://ipapi.co/json/',
      extract: (j) => parseLatLng(j),
    },
    {
      url: 'https://ipwho.is/json/',
      extract: (j) => {
        if (!j || typeof j !== 'object') return null;
        const x = j as { success?: boolean; latitude?: number | string; longitude?: number | string };
        if (x.success === false) return null;
        return parseLatLng({
          latitude: x.latitude,
          longitude: x.longitude,
        });
      },
    },
  ];

  for (const { url, extract } of endpoints) {
    try {
      const json = await fetchJsonWithTimeout(url, 6500);
      if (!json) continue;
      const ll = extract(json);
      if (!ll) continue;
      const ts = Date.now();
      return {
        coords: {
          latitude: ll.lat,
          longitude: ll.lng,
          accuracy: APPROXIMATE_NETWORK_ACCURACY_METERS,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: ts,
      };
    } catch {
      continue;
    }
  }
  return null;
}

export function getPositionErrorCode(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : null;
  }
  return null;
}

/** For forms: good GPS keeps accuracy for gates; coarse/network/manual should use null. */
export function normalizeCapturedPosition(position: GeolocationPosition): {
  latitude: string;
  longitude: string;
  capturedAccuracyMeters: number | null;
  isApproximateNetwork: boolean;
} {
  const acc = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
  const isApproximateNetwork =
    acc !== null && acc >= APPROXIMATE_NETWORK_ACCURACY_METERS * 0.75;
  const latitude = position.coords.latitude.toFixed(6);
  const longitude = position.coords.longitude.toFixed(6);
  if (acc !== null && acc <= LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS) {
    return { latitude, longitude, capturedAccuracyMeters: acc, isApproximateNetwork: false };
  }
  return { latitude, longitude, capturedAccuracyMeters: null, isApproximateNetwork };
}

export function geolocationFailureMessage(error: unknown): string {
  const code = getPositionErrorCode(error);
  if (code === 1) {
    return 'Location permission denied. Allow location for this site in your browser settings, then retry.';
  }
  if (code === 2) {
    return 'Your device could not determine position (often on desktop Wi‑Fi). Use “Pick on map”, try outdoors, or enable Wi‑Fi for location.';
  }
  if (code === 3) {
    return 'Location request timed out. Try again or use “Pick on map”.';
  }
  return 'Unable to get GPS location. Use “Pick on map” or “Network location (approx.)” below.';
}

function captureViaWatchThenFallback(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let samples = 0;
    let bestPosition: GeolocationPosition | null = null;

    const resolveWithFallback = async () => {
      try {
        const coarse = await getCurrentPositionOnce({
          enableHighAccuracy: false,
          timeout: LOCATION_COARSE_TIMEOUT_MS,
          maximumAge: STALE_MAX_AGE_MS,
        });
        saveCachedLocation(coarse);
        resolve(coarse);
      } catch {
        const cached = readCachedLocation();
        if (cached) {
          resolve(cached);
          return;
        }
        const networkPos = await fetchApproximateLocationByNetwork();
        if (networkPos) {
          resolve(networkPos);
          return;
        }
        reject(new Error('Unable to capture your location.'));
      }
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);

      if (bestPosition) {
        saveCachedLocation(bestPosition);
        resolve(bestPosition);
      } else {
        void resolveWithFallback();
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        samples += 1;
        const currentAccuracy = Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : Number.POSITIVE_INFINITY;
        const bestAccuracy =
          bestPosition && Number.isFinite(bestPosition.coords.accuracy)
            ? bestPosition.coords.accuracy
            : Number.POSITIVE_INFINITY;

        if (!bestPosition || currentAccuracy < bestAccuracy) {
          bestPosition = position;
        }

        // Prefer “something usable” over waiting forever: first sample can settle when accuracy is poor (desktop)
        if (samples === 1 && currentAccuracy > LOCATION_TARGET_ACCURACY_METERS * 2) {
          finish();
          return;
        }

        if (currentAccuracy <= LOCATION_TARGET_ACCURACY_METERS && samples >= LOCATION_MIN_SAMPLES) {
          finish();
        }
      },
      (error) => {
        if (!settled && error.code === error.PERMISSION_DENIED) {
          settled = true;
          navigator.geolocation.clearWatch(watchId);
          window.clearTimeout(timeoutId);
          reject(error);
        }
      },
      { enableHighAccuracy: true, timeout: LOCATION_CAPTURE_WINDOW_MS, maximumAge: 0 },
    );

    const timeoutId = window.setTimeout(finish, LOCATION_CAPTURE_WINDOW_MS);
  });
}

/**
 * Order matches “works everywhere” over perfect accuracy:
 * 1) Stale/low-accuracy friendly (often succeeds on macOS when high-accuracy stalls)
 * 2) Single high-accuracy request (similar to older one-shot behavior)
 * 3) Short watch + coarse + cache + IP
 */
export async function captureBestPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  try {
    const stale = await getCurrentPositionOnce({
      enableHighAccuracy: false,
      maximumAge: STALE_MAX_AGE_MS,
      timeout: 7000,
    });
    saveCachedLocation(stale);
    return stale;
  } catch {
    /* continue */
  }

  try {
    const single = await getCurrentPositionOnce({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12000,
    });
    saveCachedLocation(single);
    return single;
  } catch {
    /* continue */
  }

  return captureViaWatchThenFallback();
}
