// ===== Main App Component =====
// Handles routing and theme/auth context setup for entire application
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/i18n";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import NavBar from "./components/NavBar";
import GlobalKeyboardHandler from "./components/GlobalKeyboardHandler";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ProfilePage from "./pages/ProfilePage";
import PostDetail from "./pages/PostDetail";
import Communities from "./pages/Communities";
import CommunityPage from "./pages/CommunityPage";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import ResetCommunitiesPage from "./pages/ResetCommunitiesPage";

// Temporary utility component
import SyncUserCommunities from "./components/SyncUserCommunities";

function App() {
  return (
    // Wrap entire app with i18n, auth & theme providers for global state
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ThemeProvider>
          <GlobalKeyboardHandler />
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <NavBar />
              {/* Main content area with padding to account for fixed navbar */}
              <main
                id="main-content"
                className="pt-16"
                role="main"
                aria-label="Main content"
              >
                <Routes>
                  {/* Authentication routes - login/signup pages */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* Main App Routes - core user-facing features */}
                  <Route path="/" element={<Home />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<ProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  {/* Community routes - view and manage communities */}
                  <Route path="/communities" element={<Communities />} />
                  <Route
                    path="/communities/:communityId"
                    element={<CommunityPage />}
                  />
                  <Route path="/discover" element={<Discover />} />
                  {/* Messaging routes - user-to-user and group communication */}
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/messages" element={<Messages />} />

                  {/* Temporary utility routes - remove after use */}
                  <Route
                    path="/sync-communities"
                    element={<SyncUserCommunities />}
                  />
                  <Route
                    path="/reset-communities"
                    element={<ResetCommunitiesPage />}
                  />
                </Routes>
              </main>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
