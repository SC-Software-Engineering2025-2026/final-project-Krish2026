import { createContext, useContext, useState, useEffect } from "react";
import { getUserProfile, updateUserTheme } from "../services/profileService";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState("light"); // Default to light mode
  const [loading, setLoading] = useState(true);

  // Load theme from user profile when user logs in
  useEffect(() => {
    const loadUserTheme = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile && profile.theme) {
            setTheme(profile.theme);
          } else {
            // If user doesn't have a theme set, default to light
            setTheme("light");
          }
        } catch (error) {
          console.error("Error loading user theme:", error);
          setTheme("light");
        }
      } else {
        // No user logged in, default to light
        setTheme("light");
      }
      setLoading(false);
    };

    loadUserTheme();
  }, [currentUser]);

  useEffect(() => {
    // Apply theme to DOM
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

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

    // Save to Firestore if user is logged in
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
