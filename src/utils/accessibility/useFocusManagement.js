/**
 * Custom Hook for Focus Management
 * Provides keyboard navigation and focus management for accessibility
 */

import { useEffect, useRef, useCallback } from 'react';

export function useFocusManagement() {
  const containerRef = useRef(null);
  const focusableElementsSelector = `
    button,
    [href],
    input,
    select,
    textarea,
    [tabindex]:not([tabindex="-1"])
  `;

  /**
   * Get all focusable elements within container
   */
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll(focusableElementsSelector)
    ).filter(element => {
      return element.offsetParent !== null && // Element is visible
             !element.hasAttribute('disabled'); // Element is not disabled
    });
  }, []);

  /**
   * Focus first focusable element
   */
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  /**
   * Focus last focusable element
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  /**
   * Focus next focusable element
   */
  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const activeElement = document.activeElement;
    const currentIndex = elements.indexOf(activeElement);
    
    if (currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  /**
   * Focus previous focusable element
   */
  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const activeElement = document.activeElement;
    const currentIndex = elements.indexOf(activeElement);
    
    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
      return true;
    }
    return false;
  }, [getFocusableElements]);

  /**
   * Handle keyboard navigation (Tab, Shift+Tab)
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (!focusPrevious()) {
          event.preventDefault();
          focusLast();
        }
      } else {
        if (!focusNext()) {
          event.preventDefault();
          focusFirst();
        }
      }
    }
  }, [focusNext, focusPrevious, focusFirst, focusLast]);

  /**
   * Setup keyboard event listener
   */
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements
  };
}
