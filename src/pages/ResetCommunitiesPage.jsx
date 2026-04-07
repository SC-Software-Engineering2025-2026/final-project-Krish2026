import { useState } from "react";
import {
  resetCurrentUserCommunities,
  checkUserCommunities,
} from "../utils/resetUserCommunities";
import COLORS from "../theme/colors";

/**
 * Temporary component to reset logged-in user's communities
 * Add this to your app, visit this page, click the button, then remove it
 * Route: /reset-communities
 */
const ResetCommunitiesPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState(null);

  const handleCheck = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const result = await checkUserCommunities();
      setStatus(result);
      if (result.hasGhosts) {
        setMessage({
          type: "warning",
          text: `Found ${result.ghostCount} ghost communities. Click "Reset Now" to fix.`,
        });
      } else {
        setMessage({
          type: "success",
          text: "✅ No ghost communities detected!",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const result = await resetCurrentUserCommunities();
      setMessage({
        type: "success",
        text: `✅ Reset complete! You're now in ${result.count} communities: ${result.communities.map((c) => c.name).join(", ")}`,
      });
      setStatus(null);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-stone-200">
          Reset Communities
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Remove ghost communities from your profile
        </p>

        {/* Status Display */}
        {status && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              📊 Current Status
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>
                Profile count:{" "}
                <span className="font-semibold">{status.profileCount}</span>
              </li>
              <li>
                Actual memberships:{" "}
                <span className="font-semibold">{status.actualCount}</span>
              </li>
              {status.hasGhosts && (
                <li className="text-red-600 dark:text-red-400 font-semibold">
                  Ghost communities: {status.ghostCount}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
                : message.type === "warning"
                  ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300"
                  : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
            style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
          >
            {loading ? "Checking..." : "Check Communities"}
          </button>

          {status?.hasGhosts && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg font-medium text-white transition disabled:opacity-50"
              style={{ backgroundColor: "#dc2626" }}
            >
              {loading ? "Resetting..." : "Reset Now"}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
          Page will reload after reset to show updated count
        </p>
      </div>
    </div>
  );
};

export default ResetCommunitiesPage;
