import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<string>} Notification ID
 */
export const createNotification = async (notificationData) => {
  try {
    const {
      userId,
      type,
      actorId,
      actorName,
      actorProfileImage,
      postId,
      communityId,
      communityName,
      message,
    } = notificationData;

    const notificationsRef = collection(db, "notifications");
    const notification = {
      userId,
      type,
      actorId,
      actorName: actorName || "Someone",
      actorProfileImage: actorProfileImage || "",
      message,
      read: false,
      createdAt: serverTimestamp(),
    };

    // Add optional fields
    if (postId) notification.postId = postId;
    if (communityId) notification.communityId = communityId;
    if (communityName) notification.communityName = communityName;

    const docRef = await addDoc(notificationsRef, notification);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(notifications);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
        callback([]);
      },
    );
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark a notification as unread
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsUnread = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: false,
    });
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false),
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("userId", "==", userId));

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUnreadCount = (userId, callback) => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.size);
      },
      (error) => {
        console.error("Error listening to unread count:", error);
        callback(0);
      },
    );
  } catch (error) {
    console.error("Error subscribing to unread count:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Create follow notification
 * @param {string} followerId - User who followed
 * @param {string} followedUserId - User who was followed
 * @param {Object} followerProfile - Follower profile data
 * @returns {Promise<string>} Notification ID
 */
export const createFollowNotification = async (
  followerId,
  followedUserId,
  followerProfile,
) => {
  return createNotification({
    userId: followedUserId,
    type: "follow",
    actorId: followerId,
    actorName: followerProfile.displayName || followerProfile.username,
    actorProfileImage: followerProfile.profileImage || "",
    message: `${followerProfile.displayName || followerProfile.username} started following you`,
  });
};

/**
 * Create like notification
 * @param {string} likerId - User who liked
 * @param {string} postOwnerId - Post owner
 * @param {string} postId - Post ID
 * @param {Object} likerProfile - Liker profile data
 * @returns {Promise<string>} Notification ID
 */
export const createLikeNotification = async (
  likerId,
  postOwnerId,
  postId,
  likerProfile,
) => {
  // Don't notify if user likes their own post
  if (likerId === postOwnerId) return null;

  return createNotification({
    userId: postOwnerId,
    type: "like",
    actorId: likerId,
    actorName: likerProfile.displayName || likerProfile.username,
    actorProfileImage: likerProfile.profileImage || "",
    postId,
    message: `${likerProfile.displayName || likerProfile.username} liked your post`,
  });
};

/**
 * Create community join notification
 * @param {string} userId - User who joined
 * @param {string} communityId - Community ID
 * @param {string} adminId - Admin to notify
 * @param {Object} userProfile - User profile data
 * @param {Object} communityData - Community data
 * @returns {Promise<string>} Notification ID
 */
export const createCommunityJoinNotification = async (
  userId,
  communityId,
  adminId,
  userProfile,
  communityData,
) => {
  // Don't notify if user is joining their own community
  if (userId === adminId) return null;

  return createNotification({
    userId: adminId,
    type: "community_joined",
    actorId: userId,
    actorName: userProfile.displayName || userProfile.username,
    actorProfileImage: userProfile.profileImage || "",
    communityId,
    communityName: communityData.name,
    message: `${userProfile.displayName || userProfile.username} joined ${communityData.name}`,
  });
};

/**
 * Create community message notification for all members
 * @param {string} senderId - Message sender
 * @param {string} communityId - Community ID
 * @param {Array<string>} memberIds - All member IDs
 * @param {Object} senderProfile - Sender profile data
 * @param {Object} communityData - Community data
 * @returns {Promise<void>}
 */
export const createCommunityMessageNotifications = async (
  senderId,
  communityId,
  memberIds,
  senderProfile,
  communityData,
) => {
  try {
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");

    // Create notification for each member (except sender)
    memberIds.forEach((memberId) => {
      if (memberId !== senderId) {
        const notificationRef = doc(notificationsRef);
        batch.set(notificationRef, {
          userId: memberId,
          type: "message",
          actorId: senderId,
          actorName: senderProfile.displayName || senderProfile.username,
          actorProfileImage: senderProfile.profileImage || "",
          communityId,
          communityName: communityData.name,
          message: `${senderProfile.displayName || senderProfile.username} sent a message in ${communityData.name}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error("Error creating community message notifications:", error);
    throw error;
  }
};
