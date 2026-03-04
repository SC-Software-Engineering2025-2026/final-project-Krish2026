import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  getUserProfile,
  toggleProfilePrivacy,
  subscribeToUserProfile,
  deleteCompleteUserAccount,
} from "../services/profileService";
import {
  LockClosedIcon,
  LockOpenIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Subscribe to profile updates in real-time
    const unsubscribe = subscribeToUserProfile(
      currentUser.uid,
      async (profileData) => {
        if (!profileData) {
          setLoading(false);
          return;
        }
        setProfile(profileData);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacyStatus = !profile.isPrivate;
      await toggleProfilePrivacy(currentUser.uid, newPrivacyStatus);
      // Profile will be updated via subscription
    } catch (err) {
      console.error("Error toggling privacy:", err);
      alert("Failed to update privacy settings");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Failed to log out");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    try {
      setDeleting(true);
      await deleteCompleteUserAccount(currentUser.uid);
      // User will be automatically logged out when auth account is deleted
      navigate("/login");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert(
        "Failed to delete account. Please try again or contact support if the problem persists.",
      );
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>

        {/* Settings Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Account Settings
          </h2>

          {/* Appearance Settings Section */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isDark ? (
                      <MoonIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <SunIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    )}
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {isDark ? "Dark Mode" : "Light Mode"}
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {isDark
                      ? "Dark mode is enabled. Switch to light mode for a brighter interface."
                      : "Light mode is enabled. Switch to dark mode for a darker interface."}
                  </p>
                  <button
                    onClick={toggleTheme}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      isDark
                        ? "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                        : "bg-gray-800 hover:bg-gray-900 text-white"
                    }`}
                  >
                    {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Privacy Settings
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {profile?.isPrivate ? (
                      <LockClosedIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <LockOpenIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    )}
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {profile?.isPrivate
                        ? "Private Profile"
                        : "Public Profile"}
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {profile?.isPrivate
                      ? "Your profile is private. Only you can see your information."
                      : "Your profile is public. Anyone can see your information."}
                  </p>
                  <button
                    onClick={handleTogglePrivacy}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      profile?.isPrivate
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-600 dark:hover:bg-gray-500"
                    }`}
                  >
                    {profile?.isPrivate
                      ? "Make Profile Public"
                      : "Make Profile Private"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account Actions
            </h3>

            {/* Log Out */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRightOnRectangleIcon className="h-6 w-6 text-red-700 dark:text-red-400" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Log Out
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Sign out of your account on this device.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-6 border-2 border-red-300 dark:border-red-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrashIcon className="h-6 w-6 text-red-700 dark:text-red-400" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Delete Account
                    </h4>
                  </div>
                  <div className="flex items-start gap-2 bg-red-200 dark:bg-red-900/50 rounded-lg p-3 mb-4">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-900 dark:text-red-200 text-sm">
                      <strong>Warning:</strong> This action is permanent and
                      cannot be undone. All your data will be permanently
                      deleted, including:
                    </p>
                  </div>
                  <ul className="text-gray-700 dark:text-gray-300 text-sm mb-4 ml-8 list-disc space-y-1">
                    <li>Your profile and all personal information</li>
                    <li>All your posts, comments, and likes</li>
                    <li>
                      All communities you created (they will be deleted for all
                      members)
                    </li>
                    <li>Your membership in all communities</li>
                    <li>All your messages and media uploads</li>
                    <li>Your Firebase authentication account</li>
                  </ul>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="px-6 py-3 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-5 w-5" />
                    <span>Delete My Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirm Account Deletion
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you absolutely sure you want to delete your account? This
                action cannot be undone.
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Type <strong>DELETE</strong> to confirm:
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={deleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE"}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-5 w-5" />
                    <span>Delete Forever</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
