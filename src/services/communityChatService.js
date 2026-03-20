import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Send a message in community chat
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @param {Object} messageData - Message data (text, imageUrl, type)
 * @returns {Promise<string>} Message ID
 */
export const sendCommunityMessage = async (
  communityId,
  userId,
  messageData,
) => {
  try {
    const messagesRef = collection(db, `communities/${communityId}/messages`);
    const message = {
      userId,
      text: messageData.text || "",
      imageUrl: messageData.imageUrl || "",
      type: messageData.type || "text",
      createdAt: serverTimestamp(),
    };

    // Add reply data if present
    if (messageData.replyTo) {
      message.replyTo = messageData.replyTo;
      message.replyToText = messageData.replyToText || "";
      message.replyToUser = messageData.replyToUser || "User";
    }

    const docRef = await addDoc(messagesRef, message);
    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
};

/**
 * Subscribe to community messages in real-time
 * @param {string} communityId - Community ID
 * @param {Function} callback - Callback function to receive messages
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCommunityMessages = (communityId, callback) => {
  const messagesRef = collection(db, `communities/${communityId}/messages`);
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("Error listening to messages:", error);
    },
  );
};

/**
 * Send admin-only message
 * @param {string} communityId - Community ID
 * @param {string} userId - Admin user ID
 * @param {Object} messageData - Message data
 * @returns {Promise<string>} Message ID
 */
export const sendAdminMessage = async (communityId, userId, messageData) => {
  try {
    const messagesRef = collection(
      db,
      `communities/${communityId}/adminMessages`,
    );
    const message = {
      userId,
      text: messageData.text || "",
      imageUrl: messageData.imageUrl || "",
      type: messageData.type || "text",
      createdAt: serverTimestamp(),
    };

    // Add reply data if present
    if (messageData.replyTo) {
      message.replyTo = messageData.replyTo;
      message.replyToText = messageData.replyToText || "";
      message.replyToUser = messageData.replyToUser || "User";
    }

    const docRef = await addDoc(messagesRef, message);
    return docRef.id;
  } catch (error) {
    console.error("Error sending admin message:", error);
    throw new Error("Failed to send message");
  }
};

/**
 * Subscribe to admin messages
 * @param {string} communityId - Community ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAdminMessages = (communityId, callback) => {
  const messagesRef = collection(
    db,
    `communities/${communityId}/adminMessages`,
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("Error listening to admin messages:", error);
    },
  );
};

/**
 * Send user-to-admin message
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @param {string} text - Message text
 * @returns {Promise<string>} Message ID
 */
export const sendUserToAdminMessage = async (communityId, userId, text) => {
  try {
    const messagesRef = collection(
      db,
      `communities/${communityId}/userToAdminMessages`,
    );
    const message = {
      userId,
      text,
      read: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(messagesRef, message);
    return docRef.id;
  } catch (error) {
    console.error("Error sending user to admin message:", error);
    throw new Error("Failed to send message");
  }
};

/**
 * Subscribe to user-to-admin messages (for admins)
 * @param {string} communityId - Community ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserToAdminMessages = (communityId, callback) => {
  const messagesRef = collection(
    db,
    `communities/${communityId}/userToAdminMessages`,
  );
  const q = query(messagesRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("Error listening to user to admin messages:", error);
    },
  );
};

/**
 * Mark a user-to-admin message as read
 * @param {string} communityId - Community ID
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export const markUserToAdminMessageAsRead = async (communityId, messageId) => {
  try {
    const messageRef = doc(
      db,
      `communities/${communityId}/userToAdminMessages`,
      messageId,
    );
    await updateDoc(messageRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking user-to-admin message as read:", error);
    throw new Error("Failed to mark message as read");
  }
};

/**
 * Mark multiple user-to-admin messages as read
 * @param {string} communityId - Community ID
 * @param {string[]} messageIds - Message IDs
 * @returns {Promise<void>}
 */
export const markUserToAdminMessagesAsRead = async (
  communityId,
  messageIds,
) => {
  try {
    if (!messageIds?.length) return;

    await Promise.all(
      messageIds.map((messageId) =>
        markUserToAdminMessageAsRead(communityId, messageId),
      ),
    );
  } catch (error) {
    console.error("Error marking user-to-admin messages as read:", error);
    throw new Error("Failed to mark messages as read");
  }
};

/**
 * Delete a message from community chat
 * @param {string} communityId - Community ID
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export const deleteCommunityMessage = async (communityId, messageId) => {
  try {
    const messageRef = doc(
      db,
      `communities/${communityId}/messages`,
      messageId,
    );
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw new Error("Failed to delete message");
  }
};

/**
 * Update a message in community chat
 * @param {string} communityId - Community ID
 * @param {string} messageId - Message ID
 * @param {string} newText - New message text
 * @returns {Promise<void>}
 */
export const updateCommunityMessage = async (
  communityId,
  messageId,
  newText,
) => {
  try {
    const messageRef = doc(
      db,
      `communities/${communityId}/messages`,
      messageId,
    );
    await updateDoc(messageRef, {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating message:", error);
    throw new Error("Failed to update message");
  }
};

/**
 * Delete a message in admin chat
 * @param {string} communityId - Community ID
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export const deleteAdminMessage = async (communityId, messageId) => {
  try {
    const messageRef = doc(
      db,
      `communities/${communityId}/adminMessages`,
      messageId,
    );
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("Error deleting admin message:", error);
    throw new Error("Failed to delete message");
  }
};

/**
 * Update a message in admin chat
 * @param {string} communityId - Community ID
 * @param {string} messageId - Message ID
 * @param {string} newText - New message text
 * @returns {Promise<void>}
 */
export const updateAdminMessage = async (communityId, messageId, newText) => {
  try {
    const messageRef = doc(
      db,
      `communities/${communityId}/adminMessages`,
      messageId,
    );
    await updateDoc(messageRef, {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating admin message:", error);
    throw new Error("Failed to update message");
  }
};

export default {
  sendCommunityMessage,
  subscribeToCommunityMessages,
  deleteCommunityMessage,
  updateCommunityMessage,
  sendAdminMessage,
  subscribeToAdminMessages,
  deleteAdminMessage,
  updateAdminMessage,
  sendUserToAdminMessage,
  subscribeToUserToAdminMessages,
  markUserToAdminMessageAsRead,
  markUserToAdminMessagesAsRead,
};
