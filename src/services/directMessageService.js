import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

const DEFAULT_DM_SETTINGS = {
  allowDirectMessagesFrom: "everyone", // everyone | followers | nobody
  blockedUsers: [],
};

const normalizeDmSettings = (settings = {}) => ({
  ...DEFAULT_DM_SETTINGS,
  ...settings,
  blockedUsers: Array.isArray(settings.blockedUsers)
    ? settings.blockedUsers
    : [],
});

const createParticipantKey = (userAId, userBId) => {
  return [userAId, userBId].sort().join("__");
};

const getUserDoc = async (userId) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  return {
    id: userSnap.id,
    ...userSnap.data(),
  };
};

export const getDmSettings = async (userId) => {
  const user = await getUserDoc(userId);
  return normalizeDmSettings(user.dmSettings);
};

export const updateDmSettings = async (userId, updates) => {
  const currentSettings = await getDmSettings(userId);
  const merged = normalizeDmSettings({
    ...currentSettings,
    ...updates,
  });

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    dmSettings: merged,
    updatedAt: serverTimestamp(),
  });

  return merged;
};

export const blockDirectMessageUser = async (userId, blockedUserId) => {
  if (userId === blockedUserId) {
    throw new Error("You cannot block yourself");
  }

  const settings = await getDmSettings(userId);
  const blockedUsers = settings.blockedUsers.includes(blockedUserId)
    ? settings.blockedUsers
    : [...settings.blockedUsers, blockedUserId];

  return updateDmSettings(userId, { blockedUsers });
};

export const unblockDirectMessageUser = async (userId, blockedUserId) => {
  const settings = await getDmSettings(userId);
  const blockedUsers = settings.blockedUsers.filter(
    (id) => id !== blockedUserId,
  );

  return updateDmSettings(userId, { blockedUsers });
};

export const canMessageUser = async (senderId, recipientId) => {
  if (!senderId || !recipientId) {
    return {
      allowed: false,
      reason: "invalid_users",
    };
  }

  if (senderId === recipientId) {
    return {
      allowed: false,
      reason: "self_message",
    };
  }

  const [sender, recipient] = await Promise.all([
    getUserDoc(senderId),
    getUserDoc(recipientId),
  ]);

  const senderDmSettings = normalizeDmSettings(sender.dmSettings);
  const recipientDmSettings = normalizeDmSettings(recipient.dmSettings);

  if (recipientDmSettings.blockedUsers.includes(senderId)) {
    return {
      allowed: false,
      reason: "blocked_by_recipient",
    };
  }

  if (senderDmSettings.blockedUsers.includes(recipientId)) {
    return {
      allowed: false,
      reason: "sender_blocked_recipient",
    };
  }

  switch (recipientDmSettings.allowDirectMessagesFrom) {
    case "nobody":
      return {
        allowed: false,
        reason: "recipient_disallows_all",
      };
    case "followers": {
      const recipientFollowers = Array.isArray(recipient.followers)
        ? recipient.followers
        : [];
      return {
        allowed: recipientFollowers.includes(senderId),
        reason: recipientFollowers.includes(senderId)
          ? "allowed"
          : "followers_only",
      };
    }
    default:
      return {
        allowed: true,
        reason: "allowed",
      };
  }
};

export const createOrGetDirectMessageChannel = async (userAId, userBId) => {
  if (!userAId || !userBId) {
    throw new Error("Both users are required");
  }

  if (userAId === userBId) {
    throw new Error("Cannot create a DM channel with yourself");
  }

  const participantKey = createParticipantKey(userAId, userBId);
  const channelsRef = collection(db, "directMessageChannels");
  const existingQuery = query(
    channelsRef,
    where("participantKey", "==", participantKey),
  );
  const existingSnapshot = await getDocs(existingQuery);

  if (!existingSnapshot.empty) {
    const channelDoc = existingSnapshot.docs[0];
    return {
      id: channelDoc.id,
      ...channelDoc.data(),
    };
  }

  const channelData = {
    participants: [userAId, userBId],
    participantKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageText: "",
    lastMessageSenderId: null,
    lastMessageAt: null,
    lastMessageReadBy: [userAId, userBId],
  };

  const channelRef = await addDoc(channelsRef, channelData);
  return {
    id: channelRef.id,
    ...channelData,
  };
};

export const subscribeToDirectMessageChannels = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const channelsRef = collection(db, "directMessageChannels");
  const channelsQuery = query(
    channelsRef,
    where("participants", "array-contains", userId),
  );

  return onSnapshot(
    channelsQuery,
    (snapshot) => {
      const channels = snapshot.docs
        .map((channelDoc) => ({
          id: channelDoc.id,
          ...channelDoc.data(),
        }))
        .sort((a, b) => {
          const timeA = a.lastMessageAt?.toMillis?.() || 0;
          const timeB = b.lastMessageAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

      callback(channels);
    },
    (error) => {
      console.error("Error subscribing to DM channels:", error);
      callback([]);
    },
  );
};

export const subscribeToDirectMessages = (channelId, callback) => {
  if (!channelId) {
    callback([]);
    return () => {};
  }

  const messagesRef = collection(
    db,
    "directMessageChannels",
    channelId,
    "messages",
  );
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error("Error subscribing to direct messages:", error);
      callback([]);
    },
  );
};

export const markDirectMessageChannelAsRead = async (channelId, userId) => {
  if (!channelId || !userId) return;

  const channelRef = doc(db, "directMessageChannels", channelId);
  await updateDoc(channelRef, {
    lastMessageReadBy: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
};

export const sendDirectMessage = async ({
  senderId,
  recipientId,
  text,
  replyToMessage = null,
}) => {
  const trimmedText = (text || "").trim();
  if (!trimmedText) {
    throw new Error("Message cannot be empty");
  }

  const permission = await canMessageUser(senderId, recipientId);
  if (!permission.allowed) {
    throw new Error("This user is not accepting direct messages from you");
  }

  const channel = await createOrGetDirectMessageChannel(senderId, recipientId);
  const channelRef = doc(db, "directMessageChannels", channel.id);
  const messagesRef = collection(
    db,
    "directMessageChannels",
    channel.id,
    "messages",
  );

  const messagePayload = {
    channelId: channel.id,
    senderId,
    recipientId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  };

  if (replyToMessage?.id) {
    messagePayload.replyToMessageId = replyToMessage.id;
    messagePayload.replyToSenderId = replyToMessage.senderId || null;
    messagePayload.replyToText = (replyToMessage.text || "")
      .trim()
      .slice(0, 120);
  }

  await addDoc(messagesRef, messagePayload);

  await updateDoc(channelRef, {
    updatedAt: serverTimestamp(),
    lastMessageText: trimmedText,
    lastMessageSenderId: senderId,
    lastMessageAt: serverTimestamp(),
    lastMessageReadBy: [senderId],
  });

  try {
    const [senderProfile, { createDirectMessageNotification }] =
      await Promise.all([
        getUserDoc(senderId),
        import("./notificationService"),
      ]);

    await createDirectMessageNotification(
      senderId,
      recipientId,
      channel.id,
      senderProfile,
      trimmedText,
    );
  } catch (notificationError) {
    console.error(
      "Error creating direct message notification:",
      notificationError,
    );
  }

  return channel.id;
};

export const deleteDirectMessage = async ({ channelId, messageId, userId }) => {
  if (!channelId || !messageId || !userId) {
    throw new Error("Missing required delete parameters");
  }

  const messageRef = doc(
    db,
    "directMessageChannels",
    channelId,
    "messages",
    messageId,
  );
  const messageSnap = await getDoc(messageRef);

  if (!messageSnap.exists()) {
    throw new Error("Message not found");
  }

  const messageData = messageSnap.data();
  if (messageData.senderId !== userId) {
    throw new Error("You can only delete your own messages");
  }

  if (messageData.isDeleted) {
    return;
  }

  await updateDoc(messageRef, {
    text: "Message deleted",
    isDeleted: true,
    deletedBy: userId,
    deletedAt: serverTimestamp(),
    replyToMessageId: null,
    replyToSenderId: null,
    replyToText: "",
  });

  const messagesRef = collection(
    db,
    "directMessageChannels",
    channelId,
    "messages",
  );
  const latestMessageQuery = query(
    messagesRef,
    orderBy("createdAt", "desc"),
    limit(1),
  );
  const latestSnapshot = await getDocs(latestMessageQuery);
  const channelRef = doc(db, "directMessageChannels", channelId);

  if (latestSnapshot.empty) {
    await updateDoc(channelRef, {
      updatedAt: serverTimestamp(),
      lastMessageText: "",
      lastMessageSenderId: null,
      lastMessageAt: null,
      lastMessageReadBy: [],
    });
    return;
  }

  const latestMessage = latestSnapshot.docs[0].data();
  await updateDoc(channelRef, {
    updatedAt: serverTimestamp(),
    lastMessageText: latestMessage.text || "",
    lastMessageSenderId: latestMessage.senderId || null,
    lastMessageAt: latestMessage.createdAt || null,
    lastMessageReadBy: [],
  });
};
