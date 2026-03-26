/**
 * Keyboard Shortcut Hook
 * Provides keyboard shortcut functionality for accessibility
 */

import { useEffect } from "react";

export function useKeyboardShortcut(keys, callback, options = {}) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const keyCombination = [];

      if (event.ctrlKey || event.metaKey) keyCombination.push("ctrl");
      if (event.shiftKey) keyCombination.push("shift");
      if (event.altKey) keyCombination.push("alt");

      keyCombination.push(event.key.toLowerCase());

      // Check if current key combination matches expected keys
      const normalizedKeys = keys.map((k) => k.toLowerCase());
      const currentCombo = keyCombination.join("+");

      if (normalizedKeys.includes(currentCombo)) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keys, callback, enabled, preventDefault]);
}

// Common keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEARCH: "ctrl+k",
  FOCUS_NAVIGATION: "ctrl+m",
  TOGGLE_TTS: "alt+s", // Alt + S for Speech
  INCREASE_FONT: "ctrl+=",
  DECREASE_FONT: "ctrl+-",
};
