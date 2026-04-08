/**
 * Global Keyboard Navigation Component
 * Provides keyboard shortcuts and focus management for the entire application
 */

import { useEffect } from "react";
import { useTextToSpeech } from "../utils/accessibility/useTextToSpeech";
import { KEYBOARD_SHORTCUTS } from "../utils/accessibility/useKeyboardShortcut";

const GlobalKeyboardHandler = () => {
  const {
    speak,
    stop,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Guard against undefined event.key
      if (!event || !event.key) {
        return;
      }

      // Get the combination of keys pressed
      const keyCombination = [];
      if (event.ctrlKey || event.metaKey) keyCombination.push("ctrl");
      if (event.shiftKey) keyCombination.push("shift");
      if (event.altKey) keyCombination.push("alt");
      keyCombination.push(event.key.toLowerCase());

      const combo = keyCombination.join("+");

      // Toggle Text-to-Speech (Alt + S)
      if (combo === KEYBOARD_SHORTCUTS.TOGGLE_TTS && ttsSupported) {
        event.preventDefault();
        if (isSpeaking) {
          stop();
        } else {
          // Speak the current page content - target the main content area
          const mainContent = document.getElementById("main-content");
          if (mainContent) {
            const text = mainContent.textContent || mainContent.innerText;
            if (text) {
              speak(text.substring(0, 500)); // Limit to first 500 chars for performance
            }
          }
        }
      }

      // Focus to Navigation (Ctrl + M)
      if (combo === KEYBOARD_SHORTCUTS.FOCUS_NAVIGATION) {
        event.preventDefault();
        const navElement = document.querySelector("nav");
        if (navElement) {
          navElement.focus();
          navElement.setAttribute("tabindex", "0");
        }
      }

      // Focus to Search (Ctrl + K)
      if (combo === KEYBOARD_SHORTCUTS.SEARCH) {
        event.preventDefault();
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]',
        );
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Show keyboard shortcuts help (Ctrl + ?)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "?"
      ) {
        event.preventDefault();
        showKeyboardHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpeaking, ttsSupported, speak, stop]);

  return null;
};

/**
 * Show keyboard shortcuts help modal
 */
const showKeyboardHelp = () => {
  const helpText = `
Keyboard Shortcuts:

Text-to-Speech (Alt + S)
- Toggles text-to-speech for main content

Focus Navigation (Ctrl + M)
- Moves focus to main navigation

Focus Search (Ctrl + K)
- Focuses on search input

Show Help (Ctrl + Shift + ?)
- Displays this help menu

Tab Navigation
- Use Tab and Shift+Tab to navigate through interactive elements
- Focus indicator shows which element is selected

Screen Reader
- All interactive elements have ARIA labels
- Use your screen reader to get descriptions

Language Selection
- Go to Settings > Accessibility & Language to change language

Accessibility Settings
- Settings > Accessibility & Language for:
  * Language selection
  * Font size adjustment
  * High contrast mode
  * Text-to-speech control
  `;

  alert(helpText);
};

export default GlobalKeyboardHandler;
