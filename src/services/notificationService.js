// ===== Notification Service =====
// Handles creation and retrieval of in-app notifications for user activities
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
 * CREATE NOTIFICATION
 * Add a new notification to a user's notification stream
 * Notifications track activities: likes, comments, follows, messages, role changes
 * @param {Object} notificationData - Notification details
 * @returns {Promise<string>} New notification ID
 */
export const createNotification = async (notificationData) => {
  try {
    const {
      userId, // Recipient of the notification
      type, // Type: "like", "comment", "follow", "message", "roleChange", etc.
      actorId, // User who performed the action
      actorName,
      actorProfileImage,
      postId,
      channelId,
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
      read: false, // Unread by default
      createdAt: serverTimestamp(),
    };

    // Add optional fields if provided
    if (postId) notification.postId = postId;
    if (channelId) notification.channelId = channelId;
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
 * SUBSCRIBE TO NOTIFICATIONS (REAL-TIME)
 * Listen to user's notifications in real-time
 * Returns an unsubscribe function to cleanup listener
 * @param {string} userId - User ID
 * @param {Function} callback - Function called when notifications change
 * @returns {Function} Unsubscribe function to stop listening
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    const notificationsRef = collection(db, "notifications");
    // Query user's notifications ordered by newest first, limit to 100
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
    return () => {}; // Return empty unsubscribe function on error
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
 * Create follow request notification
 * @param {string} requesterId - User who sent the follow request
 * @param {string} targetUserId - User receiving the follow request
 * @param {Object} requesterProfile - Requester profile data
 * @returns {Promise<string>} Notification ID
 */
export const createFollowRequestNotification = async (
  requesterId,
  targetUserId,
  requesterProfile,
) => {
  return createNotification({
    userId: targetUserId,
    type: "follow_request",
    actorId: requesterId,
    actorName: requesterProfile.displayName || requesterProfile.username,
    actorProfileImage: requesterProfile.profileImage || "",
    message: `${requesterProfile.displayName || requesterProfile.username} requested to follow you`,
  });
};

/**
 * Create follow request accepted notification
 * @param {string} acceptorId - User who accepted the follow request
 * @param {string} requesterId - User whose request was accepted
 * @param {Object} acceptorProfile - Acceptor profile data
 * @returns {Promise<string>} Notification ID
 */
export const createFollowRequestAcceptedNotification = async (
  acceptorId,
  requesterId,
  acceptorProfile,
) => {
  return createNotification({
    userId: requesterId,
    type: "follow_request_accepted",
    actorId: acceptorId,
    actorName: acceptorProfile.displayName || acceptorProfile.username,
    actorProfileImage: acceptorProfile.profileImage || "",
    message: `${acceptorProfile.displayName || acceptorProfile.username} accepted your follow request`,
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
    type: "post_like",
    actorId: likerId,
    actorName: likerProfile.displayName || likerProfile.username,
    actorProfileImage: likerProfile.profileImage || "",
    postId,
    message: `${likerProfile.displayName || likerProfile.username} liked your post`,
  });
};

/**
 * Create direct message notification
 * @param {string} senderId - User who sent the message
 * @param {string} recipientId - User receiving the message
 * @param {string} channelId - Direct message channel ID
 * @param {Object} senderProfile - Sender profile data
 * @param {string} text - Message text
 * @returns {Promise<string|null>} Notification ID
 */
export const createDirectMessageNotification = async (
  senderId,
  recipientId,
  channelId,
  senderProfile,
  text,
) => {
  if (senderId === recipientId) return null;

  const senderDisplayName = senderProfile.displayName || senderProfile.username;

  return createNotification({
    userId: recipientId,
    type: "direct_message",
    actorId: senderId,
    actorName: senderDisplayName,
    actorProfileImage: senderProfile.profileImage || "",
    channelId,
    message: `${senderDisplayName} sent you a new message`,
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
          type: "community_chat_message",
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

/**
 * Create community member joined notification for admin
 * @param {string} userId - User who joined
 * @param {string} communityId - Community ID
 * @param {string} adminId - Admin to notify
 * @param {Object} userProfile - User profile data
 * @param {Object} communityData - Community data
 * @returns {Promise<string>} Notification ID
 */
export const createCommunityMemberJoinedNotification = async (
  userId,
  communityId,
  adminId,
  userProfile,
  communityData,
) => {
  if (userId === adminId) return null;

  return createNotification({
    userId: adminId,
    type: "community_member_joined",
    actorId: userId,
    actorName: userProfile.displayName || userProfile.username,
    actorProfileImage: userProfile.profileImage || "",
    communityId,
    communityName: communityData.name,
    message: `${userProfile.displayName || userProfile.username} joined ${communityData.name}`,
  });
};

/**
 * Create community join request notification for admin
 * @param {string} userId - User requesting to join
 * @param {string} communityId - Community ID
 * @param {string} adminId - Admin to notify
 * @param {Object} userProfile - User profile data
 * @param {Object} communityData - Community data
 * @returns {Promise<string>} Notification ID
 */
export const createCommunityJoinRequestNotification = async (
  userId,
  communityId,
  adminId,
  userProfile,
  communityData,
) => {
  if (userId === adminId) return null;

  return createNotification({
    userId: adminId,
    type: "community_join_request",
    actorId: userId,
    actorName: userProfile.displayName || userProfile.username,
    actorProfileImage: userProfile.profileImage || "",
    communityId,
    communityName: communityData.name,
    message: `${userProfile.displayName || userProfile.username} requested to join ${communityData.name}`,
  });
};

/**
 * Create admin chat message notification
 * @param {string} senderId - Message sender
 * @param {string} communityId - Community ID
 * @param {Array<string>} adminIds - Admin user IDs
 * @param {Object} senderProfile - Sender profile data
 * @param {Object} communityData - Community data
 * @returns {Promise<void>}
 */
export const createAdminChatMessageNotifications = async (
  senderId,
  communityId,
  adminIds,
  senderProfile,
  communityData,
) => {
  try {
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");

    adminIds.forEach((adminId) => {
      if (adminId !== senderId) {
        const notificationRef = doc(notificationsRef);
        batch.set(notificationRef, {
          userId: adminId,
          type: "community_admin_chat_message",
          actorId: senderId,
          actorName: senderProfile.displayName || senderProfile.username,
          actorProfileImage: senderProfile.profileImage || "",
          communityId,
          communityName: communityData.name,
          message: `${senderProfile.displayName || senderProfile.username} sent an admin message in ${communityData.name}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error("Error creating admin chat messages:", error);
    throw error;
  }
};

/**
 * Create community post notification for all members
 * @param {string} authorId - Post author
 * @param {string} communityId - Community ID
 * @param {Array<string>} memberIds - All member IDs
 * @param {Object} authorProfile - Author profile data
 * @param {Object} communityData - Community data
 * @returns {Promise<void>}
 */
export const createCommunityPostNotifications = async (
  authorId,
  communityId,
  memberIds,
  authorProfile,
  communityData,
) => {
  try {
    const batch = writeBatch(db);
    const notificationsRef = collection(db, "notifications");

    memberIds.forEach((memberId) => {
      if (memberId !== authorId) {
        const notificationRef = doc(notificationsRef);
        batch.set(notificationRef, {
          userId: memberId,
          type: "community_post",
          actorId: authorId,
          actorName: authorProfile.displayName || authorProfile.username,
          actorProfileImage: authorProfile.profileImage || "",
          communityId,
          communityName: communityData.name,
          message: `${authorProfile.displayName || authorProfile.username} posted in ${communityData.name}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error("Error creating community post notifications:", error);
    throw error;
  }
};

/**
 * Create community role changed notification
 * @param {string} userId - User whose role changed
 * @param {string} communityId - Community ID
 * @param {string} changedById - Admin who changed the role
 * @param {string} newRole - New role
 * @param {Object} changedByProfile - Profile of user who changed the role
 * @param {Object} communityData - Community data
 * @returns {Promise<string>} Notification ID
 */
export const createCommunityRoleChangedNotification = async (
  userId,
  communityId,
  changedById,
  newRole,
  changedByProfile,
  communityData,
) => {
  return createNotification({
    userId,
    type: "community_role_changed",
    actorId: changedById,
    actorName: changedByProfile.displayName || changedByProfile.username,
    actorProfileImage: changedByProfile.profileImage || "",
    communityId,
    communityName: communityData.name,
    message: `Your role in ${communityData.name} was changed to ${newRole}`,
  });
};

/**
 * Create community member kicked notification
 * @param {string} userId - User who was kicked
 * @param {string} communityId - Community ID
 * @param {string} kickedById - Admin who kicked the user
 * @param {Object} kickedByProfile - Profile of user who kicked
 * @param {Object} communityData - Community data
 * @returns {Promise<string>} Notification ID
 */
export const createCommunityMemberKickedNotification = async (
  userId,
  communityId,
  kickedById,
  kickedByProfile,
  communityData,
) => {
  return createNotification({
    userId,
    type: "community_member_kicked",
    actorId: kickedById,
    actorName: kickedByProfile.displayName || kickedByProfile.username,
    actorProfileImage: kickedByProfile.profileImage || "",
    communityId,
    communityName: communityData.name,
    message: `You were removed from ${communityData.name}`,
  });
};

/**
 * Create notification when join request is approved
 * @param {string} userId - User who requested to join
 * @param {string} communityId - Community ID
 * @param {Object} communityData - Community data
 * @returns {Promise<string|null>} Notification ID
 */
export const createCommunityJoinRequestApprovedNotification = async (
  userId,
  communityId,
  communityData,
) => {
  return createNotification({
    userId,
    type: "community_join_request_approved",
    communityId,
    communityName: communityData.name,
    message: `Your request to join ${communityData.name} has been approved!`,
  });
};

/**
 * Create notification when join request is rejected
 * @param {string} userId - User who requested to join
 * @param {string} communityId - Community ID
 * @param {Object} communityData - Community data
 * @returns {Promise<string|null>} Notification ID
 */
export const createCommunityJoinRequestRejectedNotification = async (
  userId,
  communityId,
  communityData,
) => {
  return createNotification({
    userId,
    type: "community_join_request_rejected",
    communityId,
    communityName: communityData.name,
    message: `Your request to join ${communityData.name} has been declined.`,
  });
};

/**
 * Create post comment notification
 * @param {string} commenterId - User who commented
 * @param {string} postOwnerId - Post owner
 * @param {string} postId - Post ID
 * @param {Object} commenterProfile - Commenter profile data
 * @returns {Promise<string|null>} Notification ID
 */
export const createPostCommentNotification = async (
  commenterId,
  postOwnerId,
  postId,
  commenterProfile,
) => {
  if (commenterId === postOwnerId) return null;

  return createNotification({
    userId: postOwnerId,
    type: "post_comment",
    actorId: commenterId,
    actorName: commenterProfile.displayName || commenterProfile.username,
    actorProfileImage: commenterProfile.profileImage || "",
    postId,
    message: `${commenterProfile.displayName || commenterProfile.username} commented on your post`,
  });
};
