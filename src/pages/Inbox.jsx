import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import COLORS from "../theme/colors";
import NotificationCard from "../components/NotificationCard";
import {
  subscribeToNotifications,
  markAllNotificationsAsRead,
} from "../services/notificationService";

const Inbox = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "following", "activity"

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Subscribe to notifications in real-time
    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(currentUser.uid);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "following") {
      return ["follow", "community_joined"].includes(notification.type);
    }
    if (activeTab === "activity") {
      return ["like", "message"].includes(notification.type);
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Inbox
                {unreadCount > 0 && (
                  <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay updated with your latest notifications
              </p>
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {notifications.length > 0 && (
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "all"
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "following"
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "activity"
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                Activity
              </button>
            </nav>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <svg
                className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === "all"
                  ? "No notifications yet"
                  : `No ${activeTab} notifications`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                {activeTab === "all"
                  ? "When you receive notifications, they'll appear here. Stay tuned for updates on your posts, follows, and community activity!"
                  : `You don't have any ${activeTab} notifications at the moment.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
