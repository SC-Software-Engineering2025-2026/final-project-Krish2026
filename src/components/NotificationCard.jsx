import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  markNotificationAsRead,
  markNotificationAsUnread,
  deleteNotification,
} from "../services/notificationService";
import {
  acceptFollowRequest,
  rejectFollowRequest,
  getUserProfile,
} from "../services/profileService";
import { useAuth } from "../context/AuthContext";

const NotificationCard = ({ notification }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [processingRequest, setProcessingRequest] = useState(false);
  const [actorProfileImage, setActorProfileImage] = useState(
    notification.actorProfileImage || "",
  );
  const menuRef = useRef(null);
  const cardRef = useRef(null);

  // Fetch the actor's current profile image
  useEffect(() => {
    const fetchActorProfile = async () => {
      try {
        const profile = await getUserProfile(notification.actorId);
        if (profile && profile.profileImage) {
          setActorProfileImage(profile.profileImage);
        }
      } catch (error) {
        console.error("Error fetching actor profile:", error);
        // Keep the cached image if fetch fails
      }
    };

    if (notification.actorId) {
      fetchActorProfile();
    }
  }, [notification.actorId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    const handleScroll = () => {
      setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    const cardRect = cardRef.current.getBoundingClientRect();
    setMenuPosition({
      x: e.clientX - cardRect.left,
      y: e.clientY - cardRect.top,
    });
    setShowMenu(true);
  };

  const handleClick = async (e) => {
    // Don't navigate if clicking on the menu or buttons
    if (showMenu || processingRequest) return;

    // Don't navigate if clicking on a button element
    if (e.target.tagName === "BUTTON" || e.target.closest("button")) return;

    try {
      // Mark as read
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
      }

      // Navigate based on notification type
      if (notification.type === "follow") {
        navigate(`/profile/${notification.actorId}`);
      } else if (notification.type === "follow_request") {
        navigate(`/profile/${notification.actorId}`);
      } else if (notification.type === "follow_request_accepted") {
        navigate(`/profile/${notification.actorId}`);
      } else if (notification.type === "like" && notification.postId) {
        navigate(`/post/${notification.postId}`);
      } else if (notification.type === "message" && notification.channelId) {
        navigate(
          `/inbox?section=direct_messages&channel=${notification.channelId}`,
        );
      } else if (
        (notification.type === "community_joined" ||
          notification.type === "message") &&
        notification.communityId
      ) {
        navigate(`/communities/${notification.communityId}`);
      } else if (notification.type === "message") {
        navigate("/inbox?section=direct_messages");
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleAcceptRequest = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      setProcessingRequest(true);
      await acceptFollowRequest(currentUser.uid, notification.actorId);
      // Mark notification as read
      await markNotificationAsRead(notification.id);
      // Optionally delete the notification after accepting
      await deleteNotification(notification.id);
    } catch (error) {
      console.error("Error accepting follow request:", error);
      alert("Failed to accept follow request");
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleDeclineRequest = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      setProcessingRequest(true);
      await rejectFollowRequest(currentUser.uid, notification.actorId);
      // Delete the notification after declining
      await deleteNotification(notification.id);
    } catch (error) {
      console.error("Error declining follow request:", error);
      alert("Failed to decline follow request");
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(notification.id);
      setShowMenu(false);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAsUnread = async (e) => {
    e.stopPropagation();
    try {
      await markNotificationAsUnread(notification.id);
      setShowMenu(false);
    } catch (error) {
      console.error("Error marking as unread:", error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
      setShowMenu(false);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "follow":
        return (
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        );
      case "follow_request":
        return (
          <svg
            className="w-5 h-5 text-amber-600 dark:text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
            <path d="M16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            <circle cx="16" cy="4" r="1" className="text-amber-300" />
          </svg>
        );
      case "follow_request_accepted":
        return (
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414 0l-1.5-1.5a1 1 0 111.414-1.414L13 7.586l2.293-2.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "post_like":
        return (
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "post_comment":
        return (
          <svg
            className="w-5 h-5 text-orange-600 dark:text-orange-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "direct_message":
        return (
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "community_member_joined":
      case "community_join_request":
      case "community_post":
      case "community_chat_message":
      case "community_admin_chat_message":
      case "community_role_changed":
      case "community_member_kicked":
        return (
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 relative ${
        notification.read
          ? "border-transparent"
          : "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          {actorProfileImage ? (
            <img
              src={actorProfileImage}
              alt={notification.actorName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-semibold text-lg">
                {notification.actorName?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">{notification.actorName}</span>{" "}
                {notification.type === "follow" && "started following you"}
                {notification.type === "follow_request" &&
                  "requested to follow you"}
                {notification.type === "follow_request_accepted" &&
                  "accepted your follow request"}
                {notification.type === "post_like" && "liked your post"}
                {notification.type === "post_comment" &&
                  "commented on your post"}
                {notification.type === "direct_message" &&
                  "sent you a direct message"}
                {notification.type === "community_member_joined" &&
                  `joined ${notification.communityName}`}
                {notification.type === "community_join_request" &&
                  `requested to join ${notification.communityName}`}
                {notification.type === "community_post" &&
                  `posted in ${notification.communityName}`}
                {notification.type === "community_chat_message" &&
                  `sent a message in ${notification.communityName}`}
                {notification.type === "community_admin_chat_message" &&
                  `sent an admin message in ${notification.communityName}`}
                {notification.type === "community_role_changed" &&
                  `your role changed in ${notification.communityName}`}
                {notification.type === "community_member_kicked" &&
                  `you were removed from ${notification.communityName}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTimestamp(notification.createdAt)}
              </p>
            </div>

            {/* Icon */}
            <div className="flex-shrink-0 ml-2">{getNotificationIcon()}</div>
          </div>

          {/* Follow Request Action Buttons */}
          {notification.type === "follow_request" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAcceptRequest}
                disabled={processingRequest}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRequest ? "Processing..." : "Accept"}
              </button>
              <button
                onClick={handleDeclineRequest}
                disabled={processingRequest}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRequest ? "Processing..." : "Decline"}
              </button>
            </div>
          )}
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            zIndex: 1000,
          }}
          className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[160px]"
        >
          {!notification.read ? (
            <button
              onClick={handleMarkAsRead}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Mark as read
            </button>
          ) : (
            <button
              onClick={handleMarkAsUnread}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Mark as unread
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCard;
