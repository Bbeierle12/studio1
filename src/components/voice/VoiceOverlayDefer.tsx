"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Lazy load the voice overlay to avoid loading voice code until needed
const VoiceOverlay = dynamic(() => import("./Overlay"), {
  ssr: false,
  loading: () => null,
});

interface VoiceOverlayDeferProps {
  recipe?: any;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onTimerRequest?: (minutes: number, label: string) => void;
  completedSteps?: Set<number>;
  onToggleStepComplete?: (step: number) => void;
}

export default function VoiceOverlayDefer(props: VoiceOverlayDeferProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to load voice code when browser is idle
    // This ensures voice doesn't block initial page render
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(
        () => setReady(true),
        { timeout: 2000 } // Fallback to load within 2 seconds
      );
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeout = setTimeout(() => setReady(true), 200);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Only render voice overlay once browser is idle
  return ready ? <VoiceOverlay {...props} /> : null;
}