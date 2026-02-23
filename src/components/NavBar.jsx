import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUserProfile } from "../services/profileService";

const NavBar = () => {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState(null);

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

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <h1
                className="text-4xl font-bold"
                style={{
                  fontFamily: "UnifrakturMaguntia, cursive",
                  color: isDark ? "#EDE8DD" : "#54524D",
                }}
              >
                Sfera
              </h1>
            </Link>

            {/* Navigation Buttons */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 text-base font-medium transition-all duration-200"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: isActive("/")
                      ? "#EDE8DD"
                      : isDark
                        ? "#EDE8DD"
                        : "#54524D",
                    backgroundColor: isActive("/") ? "#54524D" : "transparent",
                    borderRadius: isActive("/") ? "20px" : "0",
                  }}
                >
                  Home
                </Link>
                <Link
                  to="/communities"
                  className="px-4 py-2 text-base font-medium transition-all duration-200"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: isActive("/communities")
                      ? "#EDE8DD"
                      : isDark
                        ? "#EDE8DD"
                        : "#54524D",
                    backgroundColor: isActive("/communities")
                      ? "#54524D"
                      : "transparent",
                    borderRadius: isActive("/communities") ? "20px" : "0",
                  }}
                >
                  Communities
                </Link>
                <Link
                  to="/discover"
                  className="px-4 py-2 text-base font-medium transition-all duration-200"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: isActive("/discover")
                      ? "#EDE8DD"
                      : isDark
                        ? "#EDE8DD"
                        : "#54524D",
                    backgroundColor: isActive("/discover")
                      ? "#54524D"
                      : "transparent",
                    borderRadius: isActive("/discover") ? "20px" : "0",
                  }}
                >
                  Discover
                </Link>
                <Link
                  to="/inbox"
                  className="px-4 py-2 text-base font-medium transition-all duration-200"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: isActive("/inbox")
                      ? "#EDE8DD"
                      : isDark
                        ? "#EDE8DD"
                        : "#54524D",
                    backgroundColor: isActive("/inbox")
                      ? "#54524D"
                      : "transparent",
                    borderRadius: isActive("/inbox") ? "20px" : "0",
                  }}
                >
                  Inbox
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
                        : isDark
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
                >
                  Profile
                </Link>
              </div>
            )}
          </div>

          {/* Right side - Profile Picture */}
          {currentUser && (
            <Link
              to={`/profile/${currentUser.uid}`}
              className="flex items-center"
            >
              {userProfile?.profileImage ? (
                <img
                  src={userProfile.profileImage}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <span
                    className="font-semibold text-lg"
                    style={{ color: isDark ? "#EDE8DD" : "#54524D" }}
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
  );
};

export default NavBar;
