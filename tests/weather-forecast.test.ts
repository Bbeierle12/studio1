import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildDailyForecasts,
  toDateKey,
  roundCoord,
  addDaysToKey,
  enumerateDateKeys,
  isWeatherConfigured,
  WeatherUnavailableError,
  type OpenWeatherBlock,
} from '@/lib/weather-forecast';

/** UTC offset for Pacific Daylight Time, as OpenWeather reports it (`city.timezone`). */
const PDT = -7 * 3600;

/** Build an OpenWeather 3-hour block from a *local* wall-clock time. */
function block(
  localISO: string,
  tzOffsetSeconds: number,
  opts: Partial<{
    temp: number;
    tempMin: number;
    tempMax: number;
    main: string;
    description: string;
    icon: string;
    pop: number;
    humidity: number;
    windSpeed: number;
  }> = {}
): OpenWeatherBlock {
  // localISO is the wall clock at the location; convert to a real UTC epoch.
  const asIfUtc = Date.parse(`${localISO}Z`) / 1000;
  const dt = asIfUtc - tzOffsetSeconds;

  const temp = opts.temp ?? 300;
  return {
    dt,
    main: {
      temp,
      temp_min: opts.tempMin ?? temp,
      temp_max: opts.tempMax ?? temp,
      humidity: opts.humidity ?? 50,
    },
    weather: [
      {
        main: opts.main ?? 'Clear',
        description: opts.description ?? 'clear sky',
        icon: opts.icon ?? '01d',
      },
    ],
    wind: { speed: opts.windSpeed ?? 0 },
    pop: opts.pop ?? 0,
  };
}

describe('buildDailyForecasts — day bucketing', () => {
  it("groups blocks by the LOCATION's local day, not the UTC day", () => {
    // Every one of these is Monday July 13 in Pacific time. The last three fall on
    // July 14 in UTC — the old code filed them under Tuesday, which moved the entire
    // dinner window onto the wrong day.
    const blocks = [
      block('2026-07-13T11:00:00', PDT, { temp: 313 }),
      block('2026-07-13T14:00:00', PDT, { temp: 315 }),
      block('2026-07-13T17:00:00', PDT, { temp: 311 }),
      block('2026-07-13T20:00:00', PDT, { temp: 304 }),
      block('2026-07-13T23:00:00', PDT, { temp: 299 }),
    ];

    const days = buildDailyForecasts(blocks, PDT);

    expect(days).toHaveLength(1);
    expect(days[0].dateKey).toBe('2026-07-13');
  });

  it('keeps the evening blocks on the same day as the afternoon blocks', () => {
    const blocks = [
      block('2026-07-13T14:00:00', PDT, { tempMax: 315, tempMin: 313 }), // hot afternoon
      block('2026-07-13T23:00:00', PDT, { tempMax: 300, tempMin: 299 }), // cool night, UTC=Jul 14
    ];

    const days = buildDailyForecasts(blocks, PDT);

    // One day, spanning both. Under the UTC bug this produced two days, each with a
    // single block, and Monday's low was wrong by ~28°F.
    expect(days).toHaveLength(1);
    expect(days[0].temperature.high).toBeGreaterThan(days[0].temperature.low);
  });

  it('does not shift days for a location east of Greenwich', () => {
    const JST = 9 * 3600;
    const blocks = [
      block('2026-07-13T00:00:00', JST), // UTC = Jul 12 15:00
      block('2026-07-13T09:00:00', JST),
    ];

    const days = buildDailyForecasts(blocks, JST);

    expect(days).toHaveLength(1);
    expect(days[0].dateKey).toBe('2026-07-13');
  });

  it('returns days in ascending date order', () => {
    const blocks = [
      block('2026-07-15T12:00:00', PDT),
      block('2026-07-13T12:00:00', PDT),
      block('2026-07-14T12:00:00', PDT),
    ];

    const keys = buildDailyForecasts(blocks, PDT).map(d => d.dateKey);

    expect(keys).toEqual(['2026-07-13', '2026-07-14', '2026-07-15']);
  });

  it('returns an empty array for no blocks', () => {
    expect(buildDailyForecasts([], PDT)).toEqual([]);
  });
});

describe('buildDailyForecasts — precipitation', () => {
  it('reports the MAX chance of rain across the day, not the mean', () => {
    // A dry day with one very wet evening block. The mean is 11% — which would tell the
    // user it is fine to grill — but the day is 90% likely to rain at dinner.
    const blocks = [
      block('2026-07-13T05:00:00', PDT, { pop: 0 }),
      block('2026-07-13T08:00:00', PDT, { pop: 0 }),
      block('2026-07-13T11:00:00', PDT, { pop: 0 }),
      block('2026-07-13T14:00:00', PDT, { pop: 0 }),
      block('2026-07-13T17:00:00', PDT, { pop: 0 }),
      block('2026-07-13T20:00:00', PDT, { pop: 0.9 }),
    ];

    const [day] = buildDailyForecasts(blocks, PDT);

    expect(day.precipitation).toBe(90);
  });

  it('expresses pop as a 0-100 percentage', () => {
    const [day] = buildDailyForecasts([block('2026-07-13T12:00:00', PDT, { pop: 0.35 })], PDT);
    expect(day.precipitation).toBe(35);
  });
});

describe('buildDailyForecasts — summary coherence', () => {
  it('takes description and icon from a block that MATCHES the headline condition', () => {
    // Old code used the modal condition but pulled description/icon from blocks[0],
    // so a rainy day could render "Rain" next to "clear sky" and a sun icon.
    const blocks = [
      block('2026-07-13T02:00:00', PDT, { main: 'Clear', description: 'clear sky', icon: '01n' }),
      block('2026-07-13T11:00:00', PDT, { main: 'Rain', description: 'light rain', icon: '10d' }),
      block('2026-07-13T14:00:00', PDT, { main: 'Rain', description: 'moderate rain', icon: '10d' }),
      block('2026-07-13T17:00:00', PDT, { main: 'Rain', description: 'heavy intensity rain', icon: '10d' }),
    ];

    const [day] = buildDailyForecasts(blocks, PDT);

    expect(day.condition).toBe('Rain');
    expect(day.description).toMatch(/rain/i);
    expect(day.description).not.toBe('clear sky');
  });

  it('never uses a night icon for a daily summary', () => {
    const blocks = [
      block('2026-07-13T02:00:00', PDT, { main: 'Clear', icon: '01n' }),
      block('2026-07-13T23:00:00', PDT, { main: 'Clear', icon: '01n' }),
    ];

    const [day] = buildDailyForecasts(blocks, PDT);

    expect(day.icon).toBeDefined();
    expect(day.icon!.endsWith('n')).toBe(false);
  });

  it('prefers the block nearest local noon as the representative summary', () => {
    const blocks = [
      block('2026-07-13T05:00:00', PDT, { main: 'Clouds', description: 'early haze', icon: '50d' }),
      block('2026-07-13T12:00:00', PDT, { main: 'Clouds', description: 'broken clouds', icon: '04d' }),
      block('2026-07-13T21:00:00', PDT, { main: 'Clouds', description: 'late overcast', icon: '04n' }),
    ];

    const [day] = buildDailyForecasts(blocks, PDT);

    expect(day.description).toBe('broken clouds');
  });
});

describe('buildDailyForecasts — temperatures', () => {
  it('uses temp_max / temp_min rather than the spot temp', () => {
    const blocks = [
      block('2026-07-13T11:00:00', PDT, { temp: 300, tempMin: 298, tempMax: 305 }),
      block('2026-07-13T14:00:00', PDT, { temp: 310, tempMin: 308, tempMax: 316 }),
    ];

    const [day] = buildDailyForecasts(blocks, PDT);

    // 316 K = 109.1 F, 298 K = 76.7 F
    expect(day.temperature.high).toBeCloseTo(109.1, 1);
    expect(day.temperature.low).toBeCloseTo(76.7, 1);
  });

  it('converts Kelvin to Fahrenheit', () => {
    const [day] = buildDailyForecasts([block('2026-07-13T12:00:00', PDT, { temp: 273.15 })], PDT);
    expect(day.temperature.current).toBeCloseTo(32, 1);
  });
});

describe('toDateKey', () => {
  it('keys off the LOCAL calendar day, so a calendar cell matches its forecast', () => {
    // A cell for July 13 is constructed client-side as local midnight. The old code
    // ran .toISOString() on it, which rolls back a day for any UTC+ timezone.
    expect(toDateKey(new Date(2026, 6, 13))).toBe('2026-07-13');
    expect(toDateKey(new Date(2026, 6, 13, 23, 59))).toBe('2026-07-13');
    expect(toDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2026, 8, 5))).toBe('2026-09-05');
  });
});

describe('roundCoord', () => {
  it('rounds to 2dp so the cache key is stable across GPS jitter', () => {
    expect(roundCoord(35.37329)).toBe(35.37);
    expect(roundCoord(-119.01871)).toBe(-119.02);
  });

  it('collapses nearby readings onto the same key', () => {
    expect(roundCoord(35.3732)).toBe(roundCoord(35.3741));
  });
});

describe('date-key range math', () => {
  it('crosses month boundaries', () => {
    expect(addDaysToKey('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('crosses a leap day', () => {
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('enumerates an inclusive range', () => {
    expect(enumerateDateKeys('2026-07-13', '2026-07-16')).toEqual([
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
    ]);
  });

  it('returns a single day when start equals end', () => {
    expect(enumerateDateKeys('2026-07-13', '2026-07-13')).toEqual(['2026-07-13']);
  });

  it('returns nothing when the range is inverted', () => {
    expect(enumerateDateKeys('2026-07-16', '2026-07-13')).toEqual([]);
  });
});

describe('isWeatherConfigured', () => {
  it('is always true because Open-Meteo requires no API key', () => {
    expect(isWeatherConfigured()).toBe(true);
  });
});

describe('WeatherUnavailableError', () => {
  it('carries a machine-readable reason so the UI can say what is wrong', () => {
    const err = new WeatherUnavailableError('not_configured');
    expect(err).toBeInstanceOf(Error);
    expect(err.reason).toBe('not_configured');
  });
});
