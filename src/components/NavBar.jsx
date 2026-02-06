import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <h1
                className="text-4xl font-bold"
                style={{
                  fontFamily: "UnifrakturMaguntia, cursive",
                  color: "#54524D",
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
                  className="px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    color: isActive("/") ? "#EDE8DD" : "#54524D",
                    backgroundColor: isActive("/") ? "#54524D" : "transparent",
                    borderRadius: isActive("/") ? "20px" : "0",
                  }}
                >
                  Home
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
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-gray-400 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200 hover:border-gray-400 transition-colors">
                  <span
                    className="font-semibold text-lg"
                    style={{ color: "#54524D" }}
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
