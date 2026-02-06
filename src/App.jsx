import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages (will be created)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Communities from "./pages/Communities";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Main App Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
