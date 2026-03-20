import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationCard from "../components/NotificationCard";
import {
  subscribeToNotifications,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import {
  canMessageUser,
  createOrGetDirectMessageChannel,
  deleteDirectMessage,
  getDmSettings,
  markDirectMessageChannelAsRead,
  sendDirectMessage,
  subscribeToDirectMessageChannels,
  subscribeToDirectMessages,
} from "../services/directMessageService";
import { getUserFollowing, getUserProfile } from "../services/profileService";
import COLORS from "../theme/colors";

const Inbox = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("notifications");

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [activeNotificationTab, setActiveNotificationTab] = useState("all");

  const [dmLoading, setDmLoading] = useState(true);
  const [dmChannels, setDmChannels] = useState([]);
  const [dmProfiles, setDmProfiles] = useState({});
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [dmSettings, setDmSettings] = useState(null);
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [userContextMenu, setUserContextMenu] = useState(null);

  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [startingConversation, setStartingConversation] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setNotificationsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get("section");
    const channelId = searchParams.get("channel");

    if (section === "direct_messages") {
      setActiveSection("direct_messages");
    }

    if (channelId) {
      setSelectedChannelId(channelId);
    }
  }, [location.search]);

  useEffect(() => {
    if (!currentUser) return;

    const loadSettings = async () => {
      try {
        const settings = await getDmSettings(currentUser.uid);
        setDmSettings(settings);
      } catch (error) {
        console.error("Error loading DM settings:", error);
      }
    };

    loadSettings();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToDirectMessageChannels(
      currentUser.uid,
      async (channels) => {
        const filtered = channels.filter((channel) => {
          const otherUserId = channel.participants?.find(
            (id) => id !== currentUser.uid,
          );
          return !dmSettings?.blockedUsers?.includes(otherUserId);
        });

        setDmChannels(filtered);

        const profilePromises = filtered.map(async (channel) => {
          const otherUserId = channel.participants?.find(
            (id) => id !== currentUser.uid,
          );
          if (!otherUserId) {
            return null;
          }

          try {
            const profile = await getUserProfile(otherUserId);
            return { otherUserId, profile };
          } catch (error) {
            console.error("Error loading DM profile:", error);
            return null;
          }
        });

        const profiles = await Promise.all(profilePromises);
        const profileUpdates = profiles.filter(Boolean).reduce((acc, entry) => {
          acc[entry.otherUserId] = entry.profile;
          return acc;
        }, {});

        if (Object.keys(profileUpdates).length > 0) {
          setDmProfiles((prev) => ({ ...prev, ...profileUpdates }));
        }

        setDmLoading(false);

        if (!selectedChannelId && filtered.length > 0) {
          setSelectedChannelId(filtered[0].id);
        }

        if (
          selectedChannelId &&
          !filtered.some((channel) => channel.id === selectedChannelId)
        ) {
          setSelectedChannelId(filtered[0]?.id || null);
        }
      },
    );

    return () => unsubscribe();
  }, [currentUser, dmSettings, selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId || !currentUser) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    const unsubscribe = subscribeToDirectMessages(
      selectedChannelId,
      (newMessages) => {
        setMessages(newMessages);
        setMessagesLoading(false);
      },
    );

    markDirectMessageChannelAsRead(selectedChannelId, currentUser.uid).catch(
      (error) => {
        console.error("Error marking channel as read:", error);
      },
    );

    return () => unsubscribe();
  }, [selectedChannelId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!messageContextMenu) return;

    const closeMenu = () => setMessageContextMenu(null);

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [messageContextMenu]);

  useEffect(() => {
    if (!userContextMenu) return;

    const closeMenu = () => setUserContextMenu(null);

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userContextMenu]);

  useEffect(() => {
    if (!showNewMessageModal || !currentUser) return;

    const loadFollowing = async () => {
      setUserSearchLoading(true);
      try {
        const users = await getUserFollowing(currentUser.uid);
        setFollowingUsers(users);
        setUserSearchResults(users);
      } catch (error) {
        console.error("Error loading following users:", error);
        setFollowingUsers([]);
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    };

    setUserSearchQuery("");
    loadFollowing();
  }, [currentUser, showNewMessageModal]);

  useEffect(() => {
    if (!showNewMessageModal) return;

    const query = userSearchQuery.trim().toLowerCase();
    if (!query) {
      setUserSearchResults(followingUsers);
      return;
    }

    const filtered = followingUsers.filter((user) => {
      const displayName = (user.displayName || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      const firstName = (user.firstName || "").toLowerCase();
      const lastName = (user.lastName || "").toLowerCase();
      return (
        displayName.includes(query) ||
        username.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query)
      );
    });

    setUserSearchResults(filtered);
  }, [followingUsers, showNewMessageModal, userSearchQuery]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(currentUser.uid);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeNotificationTab === "all") return true;
    if (activeNotificationTab === "following") {
      return ["follow", "follow_request", "follow_request_accepted"].includes(
        notification.type,
      );
    }
    if (activeNotificationTab === "community") {
      return [
        "community_member_joined",
        "community_join_request",
        "community_post",
        "community_chat_message",
        "community_admin_chat_message",
        "community_role_changed",
        "community_member_kicked",
      ].includes(notification.type);
    }
    if (activeNotificationTab === "activity") {
      return ["post_like", "post_comment", "direct_message"].includes(
        notification.type,
      );
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadDmCount = dmChannels.filter((channel) => {
    const readBy = channel.lastMessageReadBy || [];
    const hasLastMessage = !!channel.lastMessageAt;
    return hasLastMessage && !readBy.includes(currentUser?.uid);
  }).length;

  const selectedChannel = useMemo(
    () =>
      dmChannels.find((channel) => channel.id === selectedChannelId) || null,
    [dmChannels, selectedChannelId],
  );

  const getOtherUserId = (channel) => {
    return channel?.participants?.find((id) => id !== currentUser?.uid);
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSendMessage = async () => {
    if (!currentUser || !selectedChannel || !messageText.trim()) return;

    const recipientId = getOtherUserId(selectedChannel);
    if (!recipientId) return;

    try {
      setSendingMessage(true);
      await sendDirectMessage({
        senderId: currentUser.uid,
        recipientId,
        text: messageText,
        replyToMessage: replyingToMessage,
      });
      setMessageText("");
      setReplyingToMessage(null);
      await markDirectMessageChannelAsRead(selectedChannel.id, currentUser.uid);
    } catch (error) {
      console.error("Error sending direct message:", error);
      alert(error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!selectedChannel || !currentUser) return;

    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) return;

    try {
      setDeletingMessageId(message.id);
      await deleteDirectMessage({
        channelId: selectedChannel.id,
        messageId: message.id,
        userId: currentUser.uid,
      });

      if (replyingToMessage?.id === message.id) {
        setReplyingToMessage(null);
      }
    } catch (error) {
      console.error("Error deleting direct message:", error);
      alert(error.message || "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleMessageRightClick = (event, message) => {
    if (message.isDeleted) return;

    event.preventDefault();
    setMessageContextMenu({
      message,
      x: event.clientX,
      y: event.clientY,
      canDelete: message.senderId === currentUser?.uid,
    });
  };

  const handleContextReply = () => {
    if (!messageContextMenu?.message) return;
    setReplyingToMessage(messageContextMenu.message);
    setMessageContextMenu(null);
  };

  const handleContextDelete = async () => {
    if (!messageContextMenu?.message || !messageContextMenu?.canDelete) return;
    const message = messageContextMenu.message;
    setMessageContextMenu(null);
    await handleDeleteMessage(message);
  };

  const handleUserRightClick = (event, userId) => {
    event.preventDefault();
    setUserContextMenu({
      userId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleContextViewProfile = () => {
    if (!userContextMenu?.userId) return;
    setUserContextMenu(null);
    navigate(`/profile/${userContextMenu.userId}`);
  };

  const handleStartConversation = async (targetUserId) => {
    if (!currentUser) return;

    try {
      setStartingConversation(true);
      const permission = await canMessageUser(currentUser.uid, targetUserId);
      if (!permission.allowed) {
        alert("This user is not accepting direct messages from you.");
        return;
      }

      const channel = await createOrGetDirectMessageChannel(
        currentUser.uid,
        targetUserId,
      );

      setSelectedChannelId(channel.id);
      setActiveSection("direct_messages");
      setShowNewMessageModal(false);
      setUserSearchQuery("");
      setFollowingUsers([]);
      setUserSearchResults([]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation");
    } finally {
      setStartingConversation(false);
    }
  };

  if (notificationsLoading || dmLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Inbox
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Notifications and direct messages in one place
              </p>
            </div>
            {activeSection === "notifications" &&
              notifications.length > 0 &&
              unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Mark all as read
                </button>
              )}
            {activeSection === "direct_messages" && (
              <button
                onClick={() => setShowNewMessageModal(true)}
                style={{
                  backgroundColor: COLORS.Dark_Gray,
                  color: COLORS.Beige,
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                New Message
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSection("notifications")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === "notifications"
                  ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSection("direct_messages")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === "direct_messages"
                  ? ""
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              style={
                activeSection === "direct_messages"
                  ? {
                      borderBottomColor: COLORS.Dark_Gray,
                      color: COLORS.Dark_Gray,
                    }
                  : undefined
              }
            >
              Direct Messages
              {unreadDmCount > 0 && (
                <span
                  className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: COLORS.Dark_Gray,
                    color: COLORS.Beige,
                  }}
                >
                  {unreadDmCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {activeSection === "notifications" && (
          <>
            {notifications.length > 0 && (
              <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveNotificationTab("all")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeNotificationTab === "all"
                        ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveNotificationTab("following")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeNotificationTab === "following"
                        ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    Following
                  </button>
                  <button
                    onClick={() => setActiveNotificationTab("community")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeNotificationTab === "community"
                        ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    Community
                  </button>
                  <button
                    onClick={() => setActiveNotificationTab("activity")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeNotificationTab === "activity"
                        ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    Activity
                  </button>
                </nav>
              </div>
            )}

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
                    {activeNotificationTab === "all"
                      ? "No notifications yet"
                      : `No ${activeNotificationTab} notifications`}
                  </h3>
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
          </>
        )}

        {activeSection === "direct_messages" && (
          <div
            className="rounded-lg shadow h-[70vh] overflow-hidden grid grid-cols-12"
            style={{ backgroundColor: COLORS.Beige }}
          >
            <div className="col-span-4 border-r border-gray-300 overflow-y-auto">
              {dmChannels.length === 0 ? (
                <div
                  className="p-6 text-center"
                  style={{ color: COLORS.Dark_Gray }}
                >
                  <p className="font-medium mb-2">No direct messages yet</p>
                  <p className="text-sm mb-4 opacity-80">
                    Following someone creates a DM channel automatically.
                  </p>
                  <button
                    onClick={() => setShowNewMessageModal(true)}
                    style={{
                      backgroundColor: COLORS.Dark_Gray,
                      color: COLORS.Beige,
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg"
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                dmChannels.map((channel) => {
                  const otherUserId = getOtherUserId(channel);
                  const profile = dmProfiles[otherUserId];
                  const isUnread =
                    !!channel.lastMessageAt &&
                    !(channel.lastMessageReadBy || []).includes(
                      currentUser.uid,
                    );

                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      onContextMenu={(e) =>
                        handleUserRightClick(e, otherUserId)
                      }
                      className="w-full text-left px-4 py-3 border-b border-gray-300 transition"
                      style={
                        selectedChannelId === channel.id
                          ? {
                              backgroundColor: COLORS.Dark_Gray,
                              color: COLORS.Beige,
                            }
                          : {
                              backgroundColor: "transparent",
                              color: COLORS.Dark_Gray,
                            }
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-shrink-0">
                          {profile?.profileImage ? (
                            <img
                              src={profile.profileImage}
                              alt={
                                profile?.displayName ||
                                profile?.username ||
                                "User"
                              }
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-sm"
                              style={{
                                backgroundColor:
                                  selectedChannelId === channel.id
                                    ? COLORS.Beige
                                    : COLORS.Dark_Gray,
                                color:
                                  selectedChannelId === channel.id
                                    ? COLORS.Dark_Gray
                                    : COLORS.Beige,
                              }}
                            >
                              {(profile?.displayName ||
                                profile?.username ||
                                "U")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold truncate">
                              {profile?.displayName ||
                                profile?.username ||
                                "Unknown User"}
                            </p>
                            {isUnread && (
                              <span
                                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    selectedChannelId === channel.id
                                      ? COLORS.Beige
                                      : COLORS.Dark_Gray,
                                }}
                              ></span>
                            )}
                          </div>
                          <p className="text-sm truncate mt-1 opacity-80">
                            {channel.lastMessageText || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div
              className="col-span-8 flex flex-col"
              style={{ backgroundColor: COLORS.Beige }}
            >
              {!selectedChannel ? (
                <div
                  className="flex-1 flex items-center justify-center"
                  style={{ color: COLORS.Dark_Gray }}
                >
                  Select a conversation
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-gray-300">
                    <p
                      className="font-semibold"
                      style={{ color: COLORS.Dark_Gray }}
                    >
                      {dmProfiles[getOtherUserId(selectedChannel)]
                        ?.displayName ||
                        dmProfiles[getOtherUserId(selectedChannel)]?.username ||
                        "Direct Message"}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messagesLoading ? (
                      <div
                        className="text-center"
                        style={{ color: COLORS.Dark_Gray }}
                      >
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div
                        className="text-center"
                        style={{ color: COLORS.Dark_Gray }}
                      >
                        No messages yet. Say hello.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = message.senderId === currentUser.uid;
                        const isDeleted = !!message.isDeleted;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              onContextMenu={(event) =>
                                handleMessageRightClick(event, message)
                              }
                              className={`max-w-[75%] rounded-lg px-3 py-2 relative group ${
                                isOwn ? "" : "border border-gray-300"
                              }`}
                              style={
                                isOwn
                                  ? {
                                      backgroundColor: COLORS.Dark_Gray,
                                      color: COLORS.Beige,
                                    }
                                  : {
                                      backgroundColor: COLORS.Beige,
                                      color: COLORS.Dark_Gray,
                                    }
                              }
                            >
                              {!isDeleted && message.replyToText && (
                                <div
                                  className={`mb-2 rounded px-2 py-1 border-l-2 text-xs ${
                                    isOwn ? "" : ""
                                  }`}
                                  style={
                                    isOwn
                                      ? {
                                          backgroundColor:
                                            "rgba(237, 232, 221, 0.2)",
                                          borderColor: COLORS.Beige,
                                          color: COLORS.Beige,
                                        }
                                      : {
                                          backgroundColor:
                                            "rgba(84, 82, 77, 0.08)",
                                          borderColor: COLORS.Dark_Gray,
                                          color: COLORS.Dark_Gray,
                                        }
                                  }
                                >
                                  {message.replyToText}
                                </div>
                              )}
                              <p
                                className={`whitespace-pre-wrap break-words text-sm ${
                                  isDeleted ? "italic opacity-80" : ""
                                }`}
                              >
                                {isDeleted ? "Message deleted" : message.text}
                              </p>
                              <p
                                className={`text-[11px] mt-1 ${
                                  isOwn ? "" : ""
                                }`}
                                style={{
                                  color: isOwn
                                    ? "rgba(237, 232, 221, 0.85)"
                                    : "rgba(84, 82, 77, 0.8)",
                                }}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-300">
                    {replyingToMessage && (
                      <div
                        className="mb-2 flex items-start justify-between gap-2 rounded-lg px-3 py-2 border"
                        style={{
                          backgroundColor: COLORS.Beige,
                          borderColor: COLORS.Dark_Gray,
                        }}
                      >
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: COLORS.Dark_Gray }}
                          >
                            Replying to message
                          </p>
                          <p
                            className="text-xs line-clamp-2"
                            style={{ color: COLORS.Dark_Gray }}
                          >
                            {replyingToMessage.text}
                          </p>
                        </div>
                        <button
                          onClick={() => setReplyingToMessage(null)}
                          className="text-xs hover:underline"
                          style={{ color: COLORS.Dark_Gray }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={2}
                        placeholder="Type a message..."
                        style={{
                          borderColor: COLORS.Dark_Gray,
                          backgroundColor: COLORS.Beige,
                          color: COLORS.Dark_Gray,
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg resize-none"
                        disabled={sendingMessage}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !messageText.trim()}
                        style={{
                          backgroundColor: COLORS.Dark_Gray,
                          color: COLORS.Beige,
                        }}
                        className="px-4 py-2 self-end rounded-lg disabled:opacity-50"
                      >
                        {sendingMessage ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewMessageModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewMessageModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg shadow-xl border"
            style={{
              backgroundColor: COLORS.Beige,
              borderColor: COLORS.Dark_Gray,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-4 border-b"
              style={{ borderColor: COLORS.Dark_Gray }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: COLORS.Dark_Gray }}
              >
                Start Direct Message
              </h3>
            </div>

            <div
              className="p-4 border-b"
              style={{ borderColor: COLORS.Dark_Gray }}
            >
              <input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users"
                style={{
                  borderColor: COLORS.Dark_Gray,
                  backgroundColor: COLORS.Beige,
                  color: COLORS.Dark_Gray,
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {userSearchLoading ? (
                <p className="p-4" style={{ color: COLORS.Dark_Gray }}>
                  Searching...
                </p>
              ) : userSearchResults.length === 0 ? (
                <p className="p-4" style={{ color: COLORS.Dark_Gray }}>
                  No users found
                </p>
              ) : (
                userSearchResults.map((user) => {
                  const isBlockedByYou = dmSettings?.blockedUsers?.includes(
                    user.id,
                  );
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user.id)}
                      disabled={startingConversation || isBlockedByYou}
                      className="w-full text-left p-4 border-b disabled:opacity-50"
                      style={{
                        borderColor: "rgba(84, 82, 77, 0.25)",
                        color: COLORS.Dark_Gray,
                      }}
                    >
                      <p className="font-medium">
                        {user.displayName || user.username || "Unknown User"}
                      </p>
                      <p className="text-sm opacity-80">
                        @{user.username || "user"}
                      </p>
                      {isBlockedByYou && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Unblock in settings before messaging
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {messageContextMenu && (
        <div
          className="fixed z-50 min-w-36 rounded-lg border shadow-lg py-1"
          style={{
            left: messageContextMenu.x,
            top: messageContextMenu.y,
            backgroundColor: COLORS.Beige,
            borderColor: COLORS.Dark_Gray,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={handleContextReply}
            className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
            style={{ color: COLORS.Dark_Gray }}
          >
            Reply
          </button>
          {messageContextMenu.canDelete && (
            <button
              onClick={handleContextDelete}
              disabled={deletingMessageId === messageContextMenu.message.id}
              className="w-full text-left px-3 py-2 text-sm hover:opacity-80 disabled:opacity-50"
              style={{ color: COLORS.Dark_Gray }}
            >
              {deletingMessageId === messageContextMenu.message.id
                ? "Deleting..."
                : "Delete"}
            </button>
          )}
        </div>
      )}

      {userContextMenu && (
        <div
          className="fixed z-50 min-w-48 rounded-lg border shadow-lg py-1"
          style={{
            left: userContextMenu.x,
            top: userContextMenu.y,
            backgroundColor: COLORS.Beige,
            borderColor: COLORS.Dark_Gray,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={handleContextViewProfile}
            className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
            style={{ color: COLORS.Dark_Gray }}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Inbox;
