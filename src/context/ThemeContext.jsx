// ===== Theme Context =====
// Global state management for dark/light theme preference with Firebase persistence
import { createContext, useContext, useState, useEffect } from "react";
import { getUserProfile, updateUserTheme } from "../services/profileService";
import { useAuth } from "./AuthContext";

// Create theme context for global theme access
const ThemeContext = createContext();

// Hook to access theme context throughout the app
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState("light"); // Current theme: "light" or "dark"
  const [loading, setLoading] = useState(true); // Theme loading state

  // EFFECT: Load user's theme preference from Firestore when they log in
  useEffect(() => {
    const loadUserTheme = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          // Use saved theme or default to light mode
          if (profile && profile.theme) {
            setTheme(profile.theme);
          } else {
            setTheme("light");
          }
        } catch (error) {
          console.error("Error loading user theme:", error);
          setTheme("light");
        }
      } else {
        // No user logged in - use light mode
        setTheme("light");
      }
      setLoading(false);
    };

    loadUserTheme();
  }, [currentUser]);

  // EFFECT: Apply current theme to DOM by adding/removing dark class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Toggle between light and dark theme
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";

    // Update DOM immediately for instant visual feedback
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    setTheme(newTheme);

    // Persist theme preference to Firestore if user is logged in
    if (currentUser) {
      try {
        await updateUserTheme(currentUser.uid, newTheme);
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === "dark",
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
