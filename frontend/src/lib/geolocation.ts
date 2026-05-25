// export const LOCATION_CAPTURE_WINDOW_MS = 6000;
// export const LOCATION_TARGET_ACCURACY_METERS = 25;
// export const LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS = 40;
// export const LOCATION_MIN_SAMPLES = 2;
// const LOCATION_COARSE_TIMEOUT_MS = 5000;
// const LOCATION_CACHE_KEY = 'waterwatch:lastKnownLocation';
// const STALE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour — browser may return last known fix when a fresh fix fails (common on macOS)

// function getCurrentPositionOnce(options: PositionOptions): Promise<GeolocationPosition> {
//   return new Promise((resolve, reject) => {
//     navigator.geolocation.getCurrentPosition(resolve, reject, options);
//   });
// }

// type CachedLocation = {
//   latitude: number;
//   longitude: number;
//   accuracy: number;
//   timestamp: number;
// };

// function saveCachedLocation(position: GeolocationPosition) {
//   try {
//     const payload: CachedLocation = {
//       latitude: position.coords.latitude,
//       longitude: position.coords.longitude,
//       accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 150,
//       timestamp: Date.now(),
//     };
//     window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
//   } catch {
//     // ignore cache write errors
//   }
// }

// function readCachedLocation(maxAgeMs = 24 * 60 * 60 * 1000): GeolocationPosition | null {
//   try {
//     const raw = window.localStorage.getItem(LOCATION_CACHE_KEY);
//     if (!raw) return null;
//     const parsed = JSON.parse(raw) as Partial<CachedLocation>;
//     if (
//       typeof parsed.latitude !== 'number' ||
//       typeof parsed.longitude !== 'number' ||
//       typeof parsed.accuracy !== 'number' ||
//       typeof parsed.timestamp !== 'number'
//     ) {
//       return null;
//     }
//     if (Date.now() - parsed.timestamp > maxAgeMs) return null;

//     return {
//       coords: {
//         latitude: parsed.latitude,
//         longitude: parsed.longitude,
//         accuracy: parsed.accuracy,
//         altitude: null,
//         altitudeAccuracy: null,
//         heading: null,
//         speed: null,
//       },
//       timestamp: parsed.timestamp,
//     };
//   } catch {
//     return null;
//   }
// }

// /** City-level fallback when device GPS fails. Accuracy is synthetic. */
// export const APPROXIMATE_NETWORK_ACCURACY_METERS = 8000;

// async function fetchJsonWithTimeout(url: string, ms: number): Promise<unknown> {
//   const controller = new AbortController();
//   const t = window.setTimeout(() => controller.abort(), ms);
//   try {
//     const res = await fetch(url, { signal: controller.signal });
//     if (!res.ok) return null;
//     return await res.json();
//   } finally {
//     window.clearTimeout(t);
//   }
// }

// function parseLatLng(data: unknown): { lat: number; lng: number } | null {
//   if (!data || typeof data !== 'object') return null;
//   const o = data as Record<string, unknown>;
//   const rawLat = o.latitude ?? o.lat;
//   const rawLng = o.longitude ?? o.lng ?? o.lon;
//   const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : typeof rawLat === 'number' ? rawLat : NaN;
//   const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : typeof rawLng === 'number' ? rawLng : NaN;
//   if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
//   return { lat, lng };
// }

// /**
//  * IP-based rough location when GPS returns nothing. Tries several endpoints;
//  * `ipwho.is` often responds 403 from browsers — others are tried first.
//  */
// export async function fetchApproximateLocationByNetwork(): Promise<GeolocationPosition | null> {
//   const endpoints: Array<{ url: string; extract: (j: unknown) => { lat: number; lng: number } | null }> = [
//     {
//       url: 'https://get.geojs.io/v1/ip/geo.json',
//       extract: (j) => parseLatLng(j),
//     },
//     {
//       url: 'https://ipapi.co/json/',
//       extract: (j) => parseLatLng(j),
//     },
//     {
//       url: 'https://ipwho.is/json/',
//       extract: (j) => {
//         if (!j || typeof j !== 'object') return null;
//         const x = j as { success?: boolean; latitude?: number | string; longitude?: number | string };
//         if (x.success === false) return null;
//         return parseLatLng({
//           latitude: x.latitude,
//           longitude: x.longitude,
//         });
//       },
//     },
//   ];

//   for (const { url, extract } of endpoints) {
//     try {
//       const json = await fetchJsonWithTimeout(url, 6500);
//       if (!json) continue;
//       const ll = extract(json);
//       if (!ll) continue;
//       const ts = Date.now();
//       return {
//         coords: {
//           latitude: ll.lat,
//           longitude: ll.lng,
//           accuracy: APPROXIMATE_NETWORK_ACCURACY_METERS,
//           altitude: null,
//           altitudeAccuracy: null,
//           heading: null,
//           speed: null,
//         },
//         timestamp: ts,
//       };
//     } catch {
//       continue;
//     }
//   }
//   return null;
// }

// export function getPositionErrorCode(error: unknown): number | null {
//   if (typeof error === 'object' && error !== null && 'code' in error) {
//     const code = (error as { code?: unknown }).code;
//     return typeof code === 'number' ? code : null;
//   }
//   return null;
// }

// /** For forms: good GPS keeps accuracy for gates; coarse/network/manual should use null. */
// export function normalizeCapturedPosition(position: GeolocationPosition): {
//   latitude: string;
//   longitude: string;
//   capturedAccuracyMeters: number | null;
//   isApproximateNetwork: boolean;
// } {
//   const acc = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
//   const isApproximateNetwork =
//     acc !== null && acc >= APPROXIMATE_NETWORK_ACCURACY_METERS * 0.75;
//   const latitude = position.coords.latitude.toFixed(6);
//   const longitude = position.coords.longitude.toFixed(6);
//   if (acc !== null && acc <= LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS) {
//     return { latitude, longitude, capturedAccuracyMeters: acc, isApproximateNetwork: false };
//   }
//   return { latitude, longitude, capturedAccuracyMeters: null, isApproximateNetwork };
// }

// export function geolocationFailureMessage(error: unknown): string {
//   const code = getPositionErrorCode(error);
//   if (code === 1) {
//     return 'Location permission denied. Allow location for this site in your browser settings, then retry.';
//   }
//   if (code === 2) {
//     return 'Your device could not determine position (often on desktop Wi‑Fi). Use “Pick on map”, try outdoors, or enable Wi‑Fi for location.';
//   }
//   if (code === 3) {
//     return 'Location request timed out. Try again or use “Pick on map”.';
//   }
//   return 'Unable to get GPS location. Use “Pick on map” or “Network location (approx.)” below.';
// }

// function captureViaWatchThenFallback(): Promise<GeolocationPosition> {
//   return new Promise((resolve, reject) => {
//     let settled = false;
//     let samples = 0;
//     let bestPosition: GeolocationPosition | null = null;

//     const resolveWithFallback = async () => {
//       try {
//         const coarse = await getCurrentPositionOnce({
//           enableHighAccuracy: false,
//           timeout: LOCATION_COARSE_TIMEOUT_MS,
//           maximumAge: STALE_MAX_AGE_MS,
//         });
//         saveCachedLocation(coarse);
//         resolve(coarse);
//       } catch {
//         const cached = readCachedLocation();
//         if (cached) {
//           resolve(cached);
//           return;
//         }
//         const networkPos = await fetchApproximateLocationByNetwork();
//         if (networkPos) {
//           resolve(networkPos);
//           return;
//         }
//         reject(new Error('Unable to capture your location.'));
//       }
//     };

//     const finish = () => {
//       if (settled) return;
//       settled = true;
//       navigator.geolocation.clearWatch(watchId);
//       window.clearTimeout(timeoutId);

//       if (bestPosition) {
//         saveCachedLocation(bestPosition);
//         resolve(bestPosition);
//       } else {
//         void resolveWithFallback();
//       }
//     };

//     const watchId = navigator.geolocation.watchPosition(
//       (position) => {
//         samples += 1;
//         const currentAccuracy = Number.isFinite(position.coords.accuracy)
//           ? position.coords.accuracy
//           : Number.POSITIVE_INFINITY;
//         const bestAccuracy =
//           bestPosition && Number.isFinite(bestPosition.coords.accuracy)
//             ? bestPosition.coords.accuracy
//             : Number.POSITIVE_INFINITY;

//         if (!bestPosition || currentAccuracy < bestAccuracy) {
//           bestPosition = position;
//         }

//         // Prefer “something usable” over waiting forever: first sample can settle when accuracy is poor (desktop)
//         if (samples === 1 && currentAccuracy > LOCATION_TARGET_ACCURACY_METERS * 2) {
//           finish();
//           return;
//         }

//         if (currentAccuracy <= LOCATION_TARGET_ACCURACY_METERS && samples >= LOCATION_MIN_SAMPLES) {
//           finish();
//         }
//       },
//       (error) => {
//         if (!settled && error.code === error.PERMISSION_DENIED) {
//           settled = true;
//           navigator.geolocation.clearWatch(watchId);
//           window.clearTimeout(timeoutId);
//           reject(error);
//         }
//       },
//       { enableHighAccuracy: true, timeout: LOCATION_CAPTURE_WINDOW_MS, maximumAge: 0 },
//     );

//     const timeoutId = window.setTimeout(finish, LOCATION_CAPTURE_WINDOW_MS);
//   });
// }

// /**
//  * Order matches “works everywhere” over perfect accuracy:
//  * 1) Stale/low-accuracy friendly (often succeeds on macOS when high-accuracy stalls)
//  * 2) Single high-accuracy request (similar to older one-shot behavior)
//  * 3) Short watch + coarse + cache + IP
//  */
// export async function captureBestPosition(): Promise<GeolocationPosition> {
//   if (!navigator.geolocation) {
//     throw new Error('Geolocation is not supported by your browser.');
//   }

//   try {
//     const stale = await getCurrentPositionOnce({
//       enableHighAccuracy: false,
//       maximumAge: STALE_MAX_AGE_MS,
//       timeout: 7000,
//     });
//     saveCachedLocation(stale);
//     return stale;
//   } catch {
//     /* continue */
//   }

//   try {
//     const single = await getCurrentPositionOnce({
//       enableHighAccuracy: true,
//       maximumAge: 0,
//       timeout: 12000,
//     });
//     saveCachedLocation(single);
//     return single;
//   } catch {
//     /* continue */
//   }

//   return captureViaWatchThenFallback();
// }





























/**
 * geolocation.ts — Robust cross-platform location capture.
 *
 * Progressive strategy (in order):
 *   1. Fresh cache   — Return immediately if a good fix was stored < 5 min ago.
 *   2. Live capture  — Run a quick Wi-Fi shot AND a GPS watch in PARALLEL.
 *                      Accept whichever reaches target accuracy first, or the
 *                      best result after the window closes.
 *   3. Stale cache   — Up to 1 hour old — better than nothing.
 *   4. IP geolocation — City-level, third-party API fallback.
 *
 * Key fixes vs. the previous version:
 *   • OLD BUG: First attempt used `maximumAge: 1h` — silently returned a
 *     1-hour-old browser-cached position (the "wrong location on macOS" bug).
 *     Now `maximumAge: 0` everywhere on live requests.
 *   • GPS watch window extended from 6 s → 15 s to let GPS chips warm up on
 *     mobile (Android/iOS need up to 10–15 s for a quality fix).
 *   • Watch no longer bails out on the first bad sample. It waits for the
 *     window or for a good fix, whichever comes first.
 *   • Parallel low-accuracy shot lets desktop/Wi-Fi users get a result quickly
 *     without blocking on the full GPS window.
 *   • Fresh-cache fast-path (< 5 min) avoids an unnecessary round-trip when
 *     the user opens the form multiple times in quick succession.
 */

// ─── Accuracy thresholds ─────────────────────────────────────────────────────

/** Target precision — settle early when GPS reaches this. */
export const LOCATION_TARGET_ACCURACY_METERS = 20;

/** Accuracy warning threshold. If accuracy exceeds this, we warn the user. */
export const LOCATION_WARNING_THRESHOLD_METERS = 50;

/** Maximum accuracy we'll record as valid before fallback/nulling. */
export const LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS = 150;

/** Minimum GPS watch samples before we accept a "target" reading. */
export const LOCATION_MIN_SAMPLES = 2;

// ─── Timing ──────────────────────────────────────────────────────────────────

/**
 * Total window for the GPS watch.
 * 15 s gives GPS chips enough time to warm up on mobile devices.
 */
const GPS_WATCH_WINDOW_MS = 15_000;

/**
 * Timeout for the parallel low-accuracy (Wi-Fi / network) quick shot.
 * Fires alongside the GPS watch; useful on desktops that have no GPS.
 */
const WIFI_QUICK_TIMEOUT_MS = 7_000;

// ─── Cache ────────────────────────────────────────────────────────────────────

const LOCATION_CACHE_KEY = 'waterwatch:lastKnownLocation';

/** Age threshold for "fresh enough to return immediately". */
const FRESH_CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 min

/** Age threshold for "stale but usable as a last resort". */
const STALE_CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

// ─── Network fallback ────────────────────────────────────────────────────────

/** Synthetic accuracy assigned to IP-geolocation results. */
export const APPROXIMATE_NETWORK_ACCURACY_METERS = 8_000;

// ─── Progress reporting ───────────────────────────────────────────────────────

/**
 * Optional callback passed to `captureBestPosition` so the UI can show
 * what is happening during a longer GPS acquisition.
 *
 * Phases:
 *   'wifi'    — trying fast Wi-Fi / network positioning
 *   'gps'     — GPS watch running, waiting for a good fix
 *   'cache'   — returning a recently cached location
 */
export type LocationPhase = 'wifi' | 'gps' | 'cache';

// ─── Internal helpers ─────────────────────────────────────────────────────────

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

function saveCachedLocation(position: GeolocationPosition): void {
  try {
    const payload: CachedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : 150,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore — localStorage may be unavailable in private browsing.
  }
}

function readCachedLocation(maxAgeMs: number): GeolocationPosition | null {
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

    // Reconstruct a GeolocationPosition-like object.
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
    } as GeolocationPosition;
  } catch {
    return null;
  }
}

// ─── Network (IP-based) fallback ─────────────────────────────────────────────

async function fetchJsonWithTimeout(url: string, ms: number): Promise<unknown> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

function parseLatLng(data: unknown): { lat: number; lng: number } | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const rawLat = o.latitude ?? o.lat;
  const rawLng = o.longitude ?? o.lng ?? o.lon;
  const lat =
    typeof rawLat === 'string' ? parseFloat(rawLat) : typeof rawLat === 'number' ? rawLat : NaN;
  const lng =
    typeof rawLng === 'string' ? parseFloat(rawLng) : typeof rawLng === 'number' ? rawLng : NaN;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * IP-based rough location when GPS/Wi-Fi returns nothing.
 * Tries multiple endpoints in order; returns the first successful one.
 */
export async function fetchApproximateLocationByNetwork(): Promise<GeolocationPosition | null> {
  const endpoints: Array<{
    url: string;
    extract: (j: unknown) => { lat: number; lng: number } | null;
  }> = [
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
        return parseLatLng({ latitude: x.latitude, longitude: x.longitude });
      },
    },
  ];

  for (const { url, extract } of endpoints) {
    try {
      const json = await fetchJsonWithTimeout(url, 6_500);
      if (!json) continue;
      const ll = extract(json);
      if (!ll) continue;
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
        timestamp: Date.now(),
      } as GeolocationPosition;
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Core live capture ────────────────────────────────────────────────────────

/**
 * Captures a fresh position using a parallel two-shot strategy:
 *
 *   Shot A — `getCurrentPosition` with low accuracy (Wi-Fi / network).
 *             Fast on desktops and mobiles with Wi-Fi. Returns in ~1–3 s.
 *
 *   Shot B — `watchPosition` with high accuracy (GPS).
 *             Runs for up to GPS_WATCH_WINDOW_MS (15 s). Each new sample
 *             replaces the previous if more accurate.
 *
 * Resolution rules (first match wins):
 *   • Shot A or B hits LOCATION_TARGET_ACCURACY_METERS → settle immediately.
 *   • Shot B has LOCATION_MIN_SAMPLES ≥ 2 and accuracy ≤ target → settle.
 *   • Shot B accumulates 5+ samples (desktop Wi-Fi plateau) → settle.
 *   • Window timer fires → settle with the best position seen so far.
 *
 * Rejects only on PERMISSION_DENIED or if no position was obtained at all.
 */
function captureWithProgressiveStrategy(
  onProgress?: (phase: LocationPhase) => void,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let bestPosition: GeolocationPosition | null = null;
    let gpsSamples = 0;
    let watchId: ReturnType<typeof navigator.geolocation.watchPosition> | null = null;
    let windowTimer: ReturnType<typeof setTimeout> | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    /** Update bestPosition if `pos` has better (lower) accuracy. */
    const tryUpdate = (pos: GeolocationPosition): void => {
      const acc = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : Infinity;
      const best = bestPosition && Number.isFinite(bestPosition.coords.accuracy)
        ? bestPosition.coords.accuracy
        : Infinity;
      if (!bestPosition || acc < best) {
        bestPosition = pos;
      }
    };

    const cleanup = (): void => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (windowTimer !== null) {
        clearTimeout(windowTimer);
        windowTimer = null;
      }
      if (settleTimer !== null) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const finish = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (bestPosition) {
        resolve(bestPosition);
      } else {
        reject(new Error('No position obtained within the capture window.'));
      }
    };

    const rejectWith = (err: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    // ── Shot A: Quick low-accuracy (Wi-Fi / network positioning) ─────────────
    onProgress?.('wifi');
    getCurrentPositionOnce({
      enableHighAccuracy: false,
      maximumAge: 0, // ← must be 0 to avoid stale browser cache
      timeout: WIFI_QUICK_TIMEOUT_MS,
    })
      .then((pos) => {
        if (settled) return;
        tryUpdate(pos);
        const acc = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : Infinity;
        
        const isDesktop = !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // If Wi-Fi already hit the target, or if desktop hits max acceptable accuracy, settle immediately.
        if (acc <= LOCATION_TARGET_ACCURACY_METERS || (isDesktop && acc <= LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS)) {
          finish();
        }
        // Otherwise keep the GPS watch running — it may produce a better fix.
      })
      .catch(() => {
        // Shot A failed (e.g. POSITION_UNAVAILABLE on desktop without Wi-Fi).
        // The GPS watch handles this case.
      });

    // ── Shot B: High-accuracy GPS watch ──────────────────────────────────────
    onProgress?.('gps');
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (settled) return;
        gpsSamples += 1;
        tryUpdate(pos);

        const acc = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : Infinity;
        
        const isDesktop = !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Desktop quick-settle: if accuracy is acceptable (<= 150m), settle on the first sample.
        if (isDesktop && acc <= LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS) {
          finish();
          return;
        }

        // Excellent fix with enough samples → done.
        if (acc <= LOCATION_TARGET_ACCURACY_METERS && gpsSamples >= LOCATION_MIN_SAMPLES) {
          finish();
          return;
        }

        // Acceptable fix after a few attempts (handles slow GPS warm-up).
        if (acc <= LOCATION_WARNING_THRESHOLD_METERS && gpsSamples >= 3) {
          finish();
          return;
        }

        // Desktop / Wi-Fi plateau: accuracy has stopped improving, settle.
        if (gpsSamples >= 5) {
          finish();
          return;
        }

        // Settle timer: if no new updates arrive within 2.5 seconds, settle with the best so far.
        if (settleTimer !== null) {
          clearTimeout(settleTimer);
        }
        settleTimer = setTimeout(finish, 2500);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          // Hard stop — fallback chain cannot work around a denied permission.
          rejectWith(err);
          return;
        }
        // POSITION_UNAVAILABLE or TIMEOUT from the watch — let the window
        // timer settle with whatever Shot A produced (if anything).
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, // ← must be 0
        timeout: GPS_WATCH_WINDOW_MS,
      },
    );

    // ── Window timer: settle with the best position seen so far ───────────────
    windowTimer = setTimeout(finish, GPS_WATCH_WINDOW_MS);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Call this from any UI that needs the user's location.
 *
 * The optional `onProgress` callback receives phase strings so the UI can
 * show a meaningful status message instead of a generic spinner.
 *
 * @throws If the user has denied permission (code 1) — do not fall back
 *         silently in this case; show a settings prompt instead.
 */
export async function captureBestPosition(
  onProgress?: (phase: LocationPhase) => void,
): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  // 1. Fresh cache — avoids a round-trip when the form is opened repeatedly.
  const freshCache = readCachedLocation(FRESH_CACHE_MAX_AGE_MS);
  if (freshCache && freshCache.coords.accuracy <= LOCATION_MAX_ACCEPTABLE_ACCURACY_METERS) {
    onProgress?.('cache');
    return freshCache;
  }

  // 2. Live capture — parallel Wi-Fi + GPS watch.
  try {
    const pos = await captureWithProgressiveStrategy(onProgress);
    saveCachedLocation(pos);
    return pos;
  } catch (err) {
    // Do not fall back when the user explicitly denied permission.
    if (getPositionErrorCode(err) === 1) throw err;
    // All other errors (unavailable, timeout, etc.) — try cached.
  }

  // 3. Stale cache — up to 1 hour old.
  const staleCache = readCachedLocation(STALE_CACHE_MAX_AGE_MS);
  if (staleCache) {
    onProgress?.('cache');
    return staleCache;
  }

  throw new Error('Unable to capture your location. Please pick it on the map instead.');
}

// ─── Error helpers ────────────────────────────────────────────────────────────

export function getPositionErrorCode(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : null;
  }
  return null;
}

export function geolocationFailureMessage(error: unknown): string {
  const code = getPositionErrorCode(error);
  if (code === 1) {
    return (
      'Location permission denied. ' +
      'Allow location for this site in your browser settings, then retry.'
    );
  }
  if (code === 2) {
    return (
      'Your device could not determine its position (common on desktop Wi-Fi). ' +
      'Use "Pick on map", try outdoors, or enable Wi-Fi for location.'
    );
  }
  if (code === 3) {
    return 'Location request timed out. Try again or use "Pick on map".';
  }
  return 'Unable to get location. Use "Pick on map" or "Network location (approx.)" below.';
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalises a captured position for form fields.
 *
 * Returns:
 *   capturedAccuracyMeters — null when accuracy is too coarse to gate on (the
 *     UI should NOT block submission, but should warn the user).
 *   isApproximateNetwork   — true when the fix came from IP geolocation.
 */
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