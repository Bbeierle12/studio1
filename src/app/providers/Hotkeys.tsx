"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Hotkeys() {
  const pathname = usePathname();

  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      // Command/Ctrl+K to open voice overlay
      const isCommandK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      // Shift+Space for push-to-talk
      const isPushToTalk = e.shiftKey && e.code === 'Space';

      if (!isCommandK && !isPushToTalk) return;

      // Don't activate on input fields unless it's Command+K
      const target = e.target as HTMLElement;
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInputField && !isCommandK) return;

      e.preventDefault();

      // Dynamically import the voice overlay only when needed
      const { openVoiceOverlay } = await import("@/components/voice/quick-open");

      openVoiceOverlay({
        mode: isPushToTalk ? "ptt" : "full",
        context: {
          currentPath: pathname,
          // Pass any context that might be useful
        }
      });
    }

    // Only add listeners on recipe-related pages or if user explicitly wants global access
    // For now, we'll make it available everywhere but you can restrict it
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname]);

  // No visual component, just the keyboard listener
  return null;
}