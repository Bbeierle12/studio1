import { kelvinToFahrenheit, metersPerSecondToMph } from './conversion-constants';
import type { WeatherForecast } from './types';

/** A single 3-hour entry from OpenWeather's /data/2.5/forecast response. */
export interface OpenWeatherBlock {
  dt: number; // UTC epoch seconds
  main: {
    temp: number; // Kelvin
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{ main: string; description: string; icon: string }>;
  wind: { speed: number }; // m/s
  pop: number; // probability of precipitation, 0..1
}

export interface OpenWeatherForecastResponse {
  list: OpenWeatherBlock[];
  city: {
    /** Shift in seconds from UTC. This is what makes local-day bucketing possible. */
    timezone: number;
  };
}

export type WeatherUnavailableReason = 'not_configured' | 'upstream_error' | 'no_location';

/**
 * Weather could not be determined. Thrown rather than substituting invented data —
 * the app previously fell back to random forecasts, which are indistinguishable from
 * real ones to the user.
 */
export class WeatherUnavailableError extends Error {
  constructor(public readonly reason: WeatherUnavailableReason, message?: string) {
    super(message ?? reason);
    this.name = 'WeatherUnavailableError';
  }
}

export function isWeatherConfigured(): boolean {
  return true;
}

/**
 * "YYYY-MM-DD" for a Date, read in the *local* calendar. Calendar cells are built from
 * local components, so they must be keyed the same way. Using toISOString() here (as the
 * old code did) reinterprets the date in UTC and rolls back a day for every timezone
 * east of Greenwich.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Coordinates rounded to ~1.1km, so GPS jitter maps onto one stable cache key. */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Shift a "YYYY-MM-DD" key by whole days. Pure calendar arithmetic, no timezone involved. */
export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** Every "YYYY-MM-DD" from start to end, inclusive. Empty if end precedes start. */
export function enumerateDateKeys(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = startKey;
  // Guard against a malformed range spinning forever; a calendar view is never this wide.
  for (let i = 0; i < 400 && cursor <= endKey; i++) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return keys;
}

/**
 * The calendar day a UTC instant falls on *at the forecast location*. Shifting the
 * instant by the location's UTC offset lets us read the local date off the UTC fields.
 */
function localDateKey(dt: number, tzOffsetSeconds: number): string {
  return new Date((dt + tzOffsetSeconds) * 1000).toISOString().slice(0, 10);
}

/** Local hour-of-day (0-23) at the forecast location. */
function localHour(dt: number, tzOffsetSeconds: number): number {
  return new Date((dt + tzOffsetSeconds) * 1000).getUTCHours();
}

/**
 * The block that best represents a whole day: one that actually exhibits the day's
 * headline condition, taken as close to local noon as possible. The old code took the
 * headline condition from a frequency count but the description and icon from
 * whichever block happened to come first, so a rainy day could render "Rain" beside
 * "clear sky" and a sun icon.
 */
function pickSummaryBlock(
  blocks: OpenWeatherBlock[],
  condition: string,
  tzOffsetSeconds: number
): OpenWeatherBlock {
  const matching = blocks.filter(b => b.weather[0]?.main === condition);
  const candidates = matching.length > 0 ? matching : blocks;

  return candidates.reduce((best, curr) => {
    const bestDistance = Math.abs(localHour(best.dt, tzOffsetSeconds) - 12);
    const currDistance = Math.abs(localHour(curr.dt, tzOffsetSeconds) - 12);
    return currDistance < bestDistance ? curr : best;
  });
}

/** OpenWeather icons come in day (`01d`) and night (`01n`) variants. A daily summary is a day. */
function toDayIcon(icon: string): string {
  return icon.replace(/n$/, 'd');
}

/**
 * Collapse OpenWeather's 3-hourly blocks into one forecast per day, bucketed by the
 * calendar day *at the forecast location*.
 */
export function buildDailyForecasts(
  blocks: OpenWeatherBlock[],
  tzOffsetSeconds: number
): WeatherForecast[] {
  const byDay = new Map<string, OpenWeatherBlock[]>();

  for (const b of blocks) {
    const key = localDateKey(b.dt, tzOffsetSeconds);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(b);
    else byDay.set(key, [b]);
  }

  const forecasts: WeatherForecast[] = [];

  for (const [dateKey, dayBlocks] of byDay) {
    const conditionCounts = new Map<string, number>();
    for (const b of dayBlocks) {
      const cond = b.weather[0]?.main;
      if (cond) conditionCounts.set(cond, (conditionCounts.get(cond) ?? 0) + 1);
    }
    const condition = [...conditionCounts.entries()].reduce(
      (max, curr) => (curr[1] > max[1] ? curr : max),
      ['Clear', 0] as [string, number]
    )[0];

    const summary = pickSummaryBlock(dayBlocks, condition, tzOffsetSeconds);

    // Max, not mean: a day that is 0% for seven blocks and 90% at dinner is a day you
    // should not plan to grill on. Averaging reports 11% and hides that entirely.
    const precipitation = Math.round(Math.max(...dayBlocks.map(b => b.pop ?? 0)) * 100);

    forecasts.push({
      dateKey,
      temperature: {
        high: kelvinToFahrenheit(Math.max(...dayBlocks.map(b => b.main.temp_max))),
        low: kelvinToFahrenheit(Math.min(...dayBlocks.map(b => b.main.temp_min))),
        current: kelvinToFahrenheit(summary.main.temp),
      },
      condition,
      description: summary.weather[0]?.description,
      precipitation,
      humidity: Math.round(
        dayBlocks.reduce((sum, b) => sum + b.main.humidity, 0) / dayBlocks.length
      ),
      windSpeed: metersPerSecondToMph(
        dayBlocks.reduce((sum, b) => sum + b.wind.speed, 0) / dayBlocks.length
      ),
      icon: summary.weather[0]?.icon ? toDayIcon(summary.weather[0].icon) : undefined,
    });
  }

  return forecasts.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
