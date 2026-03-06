import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import NavBar from "./components/NavBar";

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

// Temporary utility component
import SyncUserCommunities from "./components/SyncUserCommunities";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <NavBar />
            <div className="pt-16">
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Main App Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/post/:postId" element={<PostDetail />} />
                <Route path="/communities" element={<Communities />} />
                <Route
                  path="/communities/:communityId"
                  element={<CommunityPage />}
                />
                <Route path="/discover" element={<Discover />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/messages" element={<Messages />} />

                {/* Temporary utility route - remove after use */}
                <Route
                  path="/sync-communities"
                  element={<SyncUserCommunities />}
                />
              </Routes>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
