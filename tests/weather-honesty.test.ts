import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const SRC = path.join(process.cwd(), 'src');

/** Files with a code (non-comment) match for `pattern`. */
function grepSrc(pattern: string): string[] {
  let out: string;
  try {
    out = execSync(
      `grep -rnE ${JSON.stringify(pattern)} ${JSON.stringify(SRC)} --include=*.ts --include=*.tsx`,
      { encoding: 'utf8' }
    );
  } catch {
    return []; // grep exits 1 when there are no matches
  }

  return [
    ...new Set(
      out
        .split('\n')
        .filter(Boolean)
        .filter((line) => {
          const code = line.split(':').slice(2).join(':').trim();
          return !code.startsWith('//') && !code.startsWith('*') && !code.startsWith('/*');
        })
        .map((line) => path.relative(process.cwd(), line.split(':')[0]))
    ),
  ].sort();
}

/**
 * The app previously shipped three separate weather implementations, none of which
 * called a weather API — they returned Math.random() forecasts, or a hardcoded 72°F,
 * and rendered them as if measured. These guards keep fabricated weather out.
 */
describe('weather honesty', () => {
  it('generates no random weather anywhere in src/', () => {
    const offenders = grepSrc('Math\\.random').filter((f) => /weather|forecast/i.test(f));
    expect(offenders).toEqual([]);
  });

  it('defines no mock weather generator', () => {
    const offenders = grepSrc('(getMockWeather|generateMockWeatherForecast|mockWeather)');
    expect(offenders).toEqual([]);
  });

  it('never exposes the OpenWeather key to the browser', () => {
    // A NEXT_PUBLIC_ key is inlined into the client bundle and is world-readable.
    const offenders = grepSrc('NEXT_PUBLIC_OPENWEATHER');
    expect(offenders).toEqual([]);
  });

  it('does not IP-geolocate from the server (that resolves the datacenter, not the user)', () => {
    const offenders = grepSrc('ipapi\\.co|ip-api\\.com|ipinfo\\.io');
    expect(offenders).toEqual([]);
  });

  it('hardcodes no fallback coordinates', () => {
    // The old code silently fell back to San Francisco (37.7749) or New York (40.7128)
    // and presented that city's weather as the user's own.
    const offenders = grepSrc('37\\.7749|-122\\.4194|40\\.7128|-74\\.0060');
    expect(offenders).toEqual([]);
  });

  it('does not log any part of an API key', () => {
    const offenders = grepSrc('console\\.log\\(.*[Aa]pi ?[Kk]ey');
    expect(offenders).toEqual([]);
  });
});
