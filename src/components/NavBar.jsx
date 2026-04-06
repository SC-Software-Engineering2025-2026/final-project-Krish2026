// ===== Navigation Bar Component =====
// Fixed header displayed across entire app
// Shows logo, navigation links, user profile, notifications, and theme toggle

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUserProfile } from "../services/profileService";
import { subscribeToUnreadCount } from "../services/notificationService";

const NavBar = () => {
  const { t } = useTranslation(); // Get translation function
  const { currentUser } = useAuth(); // Current user from auth context
  const { isDark } = useTheme(); // Dark mode status
  const location = useLocation(); // Current route location

  // STATE MANAGEMENT
  const [userProfile, setUserProfile] = useState(null); // User's profile data
  const [unreadCount, setUnreadCount] = useState(0); // Notification badge count

  // Check if we're on login or signup pages (hide nav on auth pages)
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  // EFFECT: Load user profile when user logs in
  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    };
    loadUserProfile();
  }, [currentUser]);

  // EFFECT: Subscribe to unread notification count in real-time
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUnreadCount(currentUser.uid, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [currentUser]);

  // Helper: Check if current route is active
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only absolute top-0 left-0 z-50 bg-blue-600 text-white px-4 py-2"
      >
        Skip to main content
      </a>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-md ${!isAuthPage ? "dark:bg-gray-800" : ""}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="flex items-center gap-3"
                aria-label="Sfera Home"
              >
                <img
                  src="/Sfera-icon.png"
                  alt="Sfera"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <h1
                  className="text-4xl font-bold"
                  style={{
                    fontFamily: "UnifrakturMaguntia, cursive",
                    color: !isAuthPage && isDark ? "#EDE8DD" : "#54524D",
                  }}
                >
                  Sfera
                </h1>
              </Link>

              {/* Navigation Buttons */}
              {currentUser && (
                <div className="flex items-center gap-2" role="menubar">
                  <Link
                    to="/"
                    className="px-4 py-2 text-base font-medium transition-all duration-200"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: isActive("/")
                        ? "#EDE8DD"
                        : !isAuthPage && isDark
                          ? "#EDE8DD"
                          : "#54524D",
                      backgroundColor: isActive("/")
                        ? "#54524D"
                        : "transparent",
                      borderRadius: isActive("/") ? "20px" : "0",
                    }}
                    role="menuitem"
                  >
                    {t("nav.home")}
                  </Link>
                  <Link
                    to="/communities"
                    className="px-4 py-2 text-base font-medium transition-all duration-200"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: isActive("/communities")
                        ? "#EDE8DD"
                        : !isAuthPage && isDark
                          ? "#EDE8DD"
                          : "#54524D",
                      backgroundColor: isActive("/communities")
                        ? "#54524D"
                        : "transparent",
                      borderRadius: isActive("/communities") ? "20px" : "0",
                    }}
                    role="menuitem"
                    aria-current={isActive("/communities") ? "page" : undefined}
                    aria-label={t("nav.communities")}
                  >
                    {t("nav.communities")}
                  </Link>
                  <Link
                    to="/discover"
                    className="px-4 py-2 text-base font-medium transition-all duration-200"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: isActive("/discover")
                        ? "#EDE8DD"
                        : !isAuthPage && isDark
                          ? "#EDE8DD"
                          : "#54524D",
                      backgroundColor: isActive("/discover")
                        ? "#54524D"
                        : "transparent",
                      borderRadius: isActive("/discover") ? "20px" : "0",
                    }}
                    role="menuitem"
                    aria-current={isActive("/discover") ? "page" : undefined}
                    aria-label={t("nav.discover")}
                  >
                    {t("nav.discover")}
                  </Link>
                  <Link
                    to="/inbox"
                    className="px-4 py-2 text-base font-medium transition-all duration-200 relative"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color: isActive("/inbox")
                        ? "#EDE8DD"
                        : !isAuthPage && isDark
                          ? "#EDE8DD"
                          : "#54524D",
                      backgroundColor: isActive("/inbox")
                        ? "#54524D"
                        : "transparent",
                      borderRadius: isActive("/inbox") ? "20px" : "0",
                    }}
                    role="menuitem"
                    aria-current={isActive("/inbox") ? "page" : undefined}
                    aria-label={
                      unreadCount > 0
                        ? `${t("nav.inbox")} ${unreadCount} ${t("common.more")}`
                        : t("nav.inbox")
                    }
                  >
                    {t("nav.inbox")}
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full"
                        aria-label={`${unreadCount > 9 ? "9 or more" : unreadCount} unread notifications`}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={`/profile/${currentUser.uid}`}
                    className="px-4 py-2 text-base font-medium transition-all duration-200"
                    style={{
                      fontFamily: "Times New Roman, serif",
                      color:
                        isActive(`/profile/${currentUser.uid}`) ||
                        location.pathname === "/profile"
                          ? "#EDE8DD"
                          : !isAuthPage && isDark
                            ? "#EDE8DD"
                            : "#54524D",
                      backgroundColor:
                        isActive(`/profile/${currentUser.uid}`) ||
                        location.pathname === "/profile"
                          ? "#54524D"
                          : "transparent",
                      borderRadius:
                        isActive(`/profile/${currentUser.uid}`) ||
                        location.pathname === "/profile"
                          ? "20px"
                          : "0",
                    }}
                    role="menuitem"
                    aria-current={
                      isActive(`/profile/${currentUser.uid}`) ||
                      location.pathname === "/profile"
                        ? "page"
                        : undefined
                    }
                    aria-label={t("nav.profile")}
                  >
                    {t("nav.profile")}
                  </Link>
                </div>
              )}
            </div>

            {/* Right side - Profile Picture */}
            {currentUser && (
              <Link
                to={`/profile/${currentUser.uid}`}
                className="flex items-center"
                aria-label={`View profile for ${userProfile?.displayName || currentUser.email}`}
              >
                {userProfile?.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt={`${userProfile.displayName || "User"} profile picture`}
                    className={`w-12 h-12 rounded-full object-cover border-2 border-gray-200 hover:border-gray-400 transition-colors ${!isAuthPage ? "dark:border-gray-700 dark:hover:border-gray-500" : ""}`}
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center border-2 border-gray-200 hover:border-gray-400 transition-colors ${!isAuthPage ? "dark:bg-gray-600 dark:border-gray-700 dark:hover:border-gray-500" : ""}`}
                    aria-label="Default profile icon"
                  >
                    <span
                      className="font-semibold text-lg"
                      style={{
                        color: !isAuthPage && isDark ? "#EDE8DD" : "#54524D",
                      }}
                    >
                      {currentUser.email?.[0].toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;
