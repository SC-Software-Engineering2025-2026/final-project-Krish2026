import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  sendAdminMessage,
  subscribeToAdminMessages,
  deleteAdminMessage,
  updateAdminMessage,
} from "../services/communityChatService";
import { getCommunityMembers } from "../services/communityService";
import { getUserProfile } from "../services/profileService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase";

const AdminChat = ({ communityId }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});
  const textareaRef = useRef(null);

  useEffect(() => {
    loadMembers();

    // Subscribe to real-time messages
    const unsubscribe = subscribeToAdminMessages(
      communityId,
      async (newMessages) => {
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
      },
    );

    return () => unsubscribe();
  }, [communityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMembers = async () => {
    try {
      const membersData = await getCommunityMembers(communityId);
      setMembers(membersData);

      // Fetch user profiles for all members
      const profiles = {};
      await Promise.all(
        membersData.map(async (member) => {
          try {
            const profile = await getUserProfile(member.userId);
            profiles[member.userId] = profile;
          } catch (error) {
            console.error(
              `Error fetching profile for ${member.userId}:`,
              error,
            );
          }
        }),
      );
      setUserProfiles((prev) => ({ ...prev, ...profiles }));
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const messageData = {
        text: newMessage.trim(),
        type: "text",
      };

      // Add reply reference if replying to a message
      if (replyingTo) {
        messageData.replyTo = replyingTo.id;
        messageData.replyToText = replyingTo.text;
        messageData.replyToUser =
          userProfiles[replyingTo.userId]?.displayName || "User";
        console.log("Sending message with reply data:", messageData);
      }

      await sendAdminMessage(communityId, currentUser.uid, messageData);
      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageDoubleClick = (message, event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedMessage(message);
    setContextMenuPosition({
      x: event.clientX,
      y: rect.bottom + 5,
    });
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteAdminMessage(communityId, selectedMessage.id);
        setContextMenuPosition(null);
        setSelectedMessage(null);
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message");
      }
    }
  };

  const handleEditMessage = () => {
    if (!selectedMessage || selectedMessage.type !== "text") return;

    setEditingMessage(selectedMessage);
    setEditText(selectedMessage.text);
    setContextMenuPosition(null);
    setSelectedMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await updateAdminMessage(communityId, editingMessage.id, editText.trim());
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating message:", error);
      alert("Failed to update message");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;

    setReplyingTo(selectedMessage);
    setContextMenuPosition(null);
    setSelectedMessage(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleClickReply = (replyToId) => {
    if (!replyToId) return;

    // Scroll to the original message
    const messageElement = messageRefs.current[replyToId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight the message temporarily
      setHighlightedMessageId(replyToId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuPosition(null);
      setSelectedMessage(null);
    };

    if (contextMenuPosition) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenuPosition]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Upload image to storage
      const imageRef = ref(
        storage,
        `communities/${communityId}/chat/${Date.now()}_${file.name}`,
      );
      const snapshot = await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // Send message with image
      await sendAdminMessage(communityId, currentUser.uid, {
        imageUrl,
        type: "image",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold dark:text-white">
              Admin Discussion
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {members.filter((m) => m.role === "admin").length} admins
            </p>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="lg:hidden px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg"
          >
            {showMembers ? "Hide" : "Show"} Members
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                No messages yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.userId === currentUser.uid}
                userProfile={userProfiles[message.userId]}
                onDoubleClick={handleMessageDoubleClick}
                isEditing={editingMessage?.id === message.id}
                editText={editText}
                onEditTextChange={setEditText}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                replyToProfile={
                  message.replyTo
                    ? userProfiles[
                        messages.find((m) => m.id === message.replyTo)?.userId
                      ]
                    : null
                }
                onClickReply={handleClickReply}
                isHighlighted={highlightedMessageId === message.id}
                messageRef={(el) => (messageRefs.current[message.id] = el)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t dark:border-gray-700"
        >
          {/* Reply indicator */}
          {replyingTo && (
            <div
              className="mb-2 p-2 rounded-lg flex items-center justify-between"
              style={{ backgroundColor: "#54524D" }}
            >
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: "#EDE8DD" }}>
                  Replying to{" "}
                  {userProfiles[replyingTo.userId]?.displayName || "User"}
                </p>
                <p className="text-sm truncate" style={{ color: "#EDE8DD" }}>
                  {replyingTo.text
                    ? replyingTo.text.length > 50
                      ? `${replyingTo.text.substring(0, 50)}...`
                      : replyingTo.text
                    : "Image"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelReply}
                className="p-1 hover:opacity-80 rounded"
              >
                <svg
                  className="w-4 h-4"
                  style={{ color: "#EDE8DD" }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              {uploadingImage ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={loading}
              rows={1}
              style={{
                minHeight: "42px",
                maxHeight: "120px",
              }}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-64 border-l dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Admins
            </h3>
            {/* Admins Section */}
            {members.filter((m) => m.role === "admin").length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Admins
                </p>
                <div className="space-y-2 mb-4">
                  {members
                    .filter((m) => m.role === "admin")
                    .map((member) => {
                      const profile = userProfiles[member.userId];
                      return (
                        <div
                          key={member.id}
                          onClick={() => navigate(`/profile/${member.userId}`)}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        >
                          {profile?.profileImage ? (
                            <img
                              src={profile.profileImage}
                              alt={profile.displayName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {profile?.displayName?.[0]?.toUpperCase() ||
                                  "U"}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {profile?.displayName ||
                                profile?.username ||
                                `User ${member.userId.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {member.role}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenuPosition && selectedMessage && (
        <div
          className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleReplyMessage}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex items-center space-x-2"
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
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span>Reply</span>
          </button>
          {selectedMessage.userId === currentUser.uid &&
            selectedMessage.type === "text" && (
              <button
                onClick={handleEditMessage}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex items-center space-x-2"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit</span>
              </button>
            )}
          {selectedMessage.userId === currentUser.uid && (
            <button
              onClick={handleDeleteMessage}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-2"
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
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({
  message,
  isOwn,
  userProfile,
  onDoubleClick,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  replyToProfile,
  onClickReply,
  isHighlighted,
  messageRef,
}) => {
  const navigate = useNavigate();

  if (isEditing) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-md w-full">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <textarea
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-800 dark:text-white"
              rows="3"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} transition-all ${
        isHighlighted ? "bg-yellow-100 py-2 -mx-2 px-2 rounded-lg" : ""
      }`}
    >
      <div
        className={`flex items-end space-x-2 max-w-md ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}
        onDoubleClick={(e) => onDoubleClick(message, e)}
      >
        {userProfile?.profileImage ? (
          <img
            src={userProfile.profileImage}
            alt={userProfile.displayName}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${message.userId}`);
            }}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            title={`View ${userProfile.displayName || "user"}'s profile`}
          />
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${message.userId}`);
            }}
            className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            title={`View ${userProfile?.displayName || "user"}'s profile`}
          >
            <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
              {userProfile?.displayName?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div className="flex-1">
          {!isOwn && (
            <p
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${message.userId}`);
              }}
              className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1 font-medium cursor-pointer hover:text-blue-600 transition-colors"
              title={`View ${userProfile?.displayName || "user"}'s profile`}
            >
              {userProfile?.displayName || userProfile?.username || "User"}
            </p>
          )}
          {/* Container for message with reply indicator */}
          <div
            className={`rounded-lg overflow-hidden shadow-sm ${
              isOwn ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            {/* Reply indicator - clickable container showing original message */}
            {message.replyTo && (
              <div
                className="px-3 py-2.5 cursor-pointer transition hover:opacity-90 border-b-2 border-gray-500"
                style={{ backgroundColor: "#54524D" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClickReply(message.replyTo);
                }}
                title="Click to view original message"
              >
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "#EDE8DD" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: "#EDE8DD" }}
                    >
                      {message.replyToUser || "User"}
                    </p>
                    <div
                      className="text-sm px-2 py-1.5 rounded bg-black bg-opacity-20"
                      style={{ color: "#EDE8DD" }}
                    >
                      <p className="break-words whitespace-pre-wrap line-clamp-3">
                        {message.replyToText || "Message"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Actual message content */}
            {message.type === "text" && (
              <div
                className={`px-4 py-2 ${
                  isOwn ? "text-white" : "text-gray-900 dark:text-white"
                }`}
              >
                <p>{message.text}</p>
                {message.edited && (
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    (edited)
                  </p>
                )}
              </div>
            )}
            {message.type === "image" && (
              <div className="overflow-hidden">
                <img src={message.imageUrl} alt="Shared" className="max-w-xs" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            {message.createdAt && formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper function outside component
const formatTime = (timestamp) => {
  if (!timestamp?.toDate) return "";
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default AdminChat;
