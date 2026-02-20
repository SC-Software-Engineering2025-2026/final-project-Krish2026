import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  sendUserToAdminMessage,
  subscribeToUserToAdminMessages,
} from "../services/communityChatService";
import { getUserProfile } from "../services/profileService";

const UserToAdminMessaging = ({ communityId, userRole }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const navigate = useNavigate();

  const isAdmin = userRole === "admin";

  useEffect(() => {
    // Subscribe to user-to-admin messages
    const unsubscribe = subscribeToUserToAdminMessages(
      communityId,
      async (newMessages) => {
        if (isAdmin) {
          // Admins see all messages
          setMessages(newMessages);

          // Fetch user profiles for all message senders
          const userIds = [...new Set(newMessages.map((msg) => msg.userId))];
          const profiles = {};
          await Promise.all(
            userIds.map(async (userId) => {
              if (!userProfiles[userId]) {
                try {
                  const profile = await getUserProfile(userId);
                  profiles[userId] = profile;
                } catch (error) {
                  console.error(`Error fetching profile for ${userId}:`, error);
                }
              }
            }),
          );
          setUserProfiles((prev) => ({ ...prev, ...profiles }));
        } else {
          // Users only see their own messages
          const userMessages = newMessages.filter(
            (msg) => msg.userId === currentUser.uid,
          );
          setMessages(userMessages);
        }
      },
    );

    return () => unsubscribe();
  }, [communityId, isAdmin, currentUser.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await sendUserToAdminMessage(
        communityId,
        currentUser.uid,
        newMessage.trim(),
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900">
              {isAdmin ? "User Messages" : "Message Admins"}
            </h3>
            <p className="text-sm text-blue-800 mt-1">
              {isAdmin
                ? "You can see all messages from members. They can only see their own messages."
                : "Send a message to the community admins. Only you and the admins can see your messages."}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isAdmin ? "Member Messages" : "Your Messages to Admins"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? `${messages.length} messages from members`
              : `${messages.length} messages sent`}
          </p>
        </div>

        {/* Messages List */}
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-2 text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400">
                {isAdmin
                  ? "No members have sent messages"
                  : "Send your first message to the admins"}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                isAdmin={isAdmin}
                isOwn={message.userId === currentUser.uid}
                userProfile={userProfiles[message.userId]}
                navigate={navigate}
              />
            ))
          )}
        </div>

        {/* Message Input (Non-Admin) */}
        {!isAdmin && (
          <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message to the admins..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 self-end"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Message Card Component
const MessageCard = ({ message, isAdmin, isOwn, userProfile, navigate }) => {
  return (
    <div
      className={`p-4 hover:bg-gray-50 ${!message.read && isAdmin ? "bg-blue-50" : ""}`}
    >
      <div className="flex items-start space-x-3">
        {userProfile?.profileImage ? (
          <img
            src={userProfile.profileImage}
            alt={userProfile.displayName}
            onClick={() => navigate(`/profile/${message.userId}`)}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            title={`View ${userProfile.displayName || "user"}'s profile`}
          />
        ) : (
          <div
            onClick={() => navigate(`/profile/${message.userId}`)}
            className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            title={`View ${userProfile?.displayName || "user"}'s profile`}
          >
            <span className="text-gray-600 font-medium">
              {userProfile?.displayName?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p
              onClick={() => navigate(`/profile/${message.userId}`)}
              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              title={`View ${userProfile?.displayName || "user"}'s profile`}
            >
              {isAdmin ? (
                <>
                  {userProfile?.displayName ||
                    userProfile?.username ||
                    `User ${message.userId.slice(0, 8)}`}
                  {!message.read && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      New
                    </span>
                  )}
                </>
              ) : (
                "You"
              )}
            </p>
            <p className="text-xs text-gray-500">
              {message.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
            </p>
          </div>
          <p className="mt-1 text-gray-700 whitespace-pre-wrap">
            {message.text}
          </p>
          <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {message.createdAt?.toDate?.().toLocaleTimeString() || ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserToAdminMessaging;
