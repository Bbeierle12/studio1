'use client';

import { useEffect, useState } from 'react';

export type GeolocationStatus = 'loading' | 'granted' | 'denied' | 'unsupported';

export interface GeolocationState {
  coords: { lat: number; lon: number } | null;
  status: GeolocationStatus;
}

/**
 * The user's coordinates, from the browser.
 *
 * There is deliberately no fallback location. Weather for a city the user is not in is
 * not weather — it is a plausible-looking wrong answer, and the previous implementation
 * shipped exactly that (San Francisco on the client, New York or the Vercel datacenter on
 * the server). When we do not know where the user is, we say so.
 */
export function useGeolocation(enabled: boolean = true): GeolocationState {
  const [state, setState] = useState<GeolocationState>({ coords: null, status: 'loading' });

  useEffect(() => {
    if (!enabled) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ coords: null, status: 'unsupported' });
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setState({
          coords: { lat: position.coords.latitude, lon: position.coords.longitude },
          status: 'granted',
        });
      },
      () => {
        if (cancelled) return;
        setState({ coords: null, status: 'denied' });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30 * 60 * 1000 }
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
