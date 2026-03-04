# Notification System Documentation

## Overview

The notification system provides real-time updates to users about important events such as follows, post likes, community joins, and messages. Notifications are stored in Firestore and displayed in the Inbox tab with two distinct sections.

---

## Features

### Notification Types

1. **Follow Notifications** (`type: 'follow'`)
   - Triggered when: A user follows another user
   - Recipients: The followed user
   - Shows: Actor's profile image, name, and "started following you"

2. **Like Notifications** (`type: 'like'`)
   - Triggered when: A user likes a post
   - Recipients: The post owner
   - Shows: Actor's profile image, name, and "liked your post"
   - Action: Clicking navigates to the post

3. **Community Join Notifications** (`type: 'community_joined'`)
   - Triggered when: A user joins a public community
   - Recipients: All admins of the community
   - Shows: Actor's profile image, name, and "joined [community name]"
   - Action: Clicking navigates to the community

4. **Message Notifications** (`type: 'message'`) - Future Feature
   - Triggered when: A user sends a message in a community
   - Recipients: All community members (except sender)
   - Shows: Actor's profile image, name, and "sent a message in [community name]"

---

## Database Structure

### Firestore Collection: `notifications`

```javascript
{
  userId: string,                // Recipient user ID
  type: string,                  // 'follow', 'like', 'community_joined', 'message'
  actorId: string,               // User who triggered the notification
  actorName: string,             // Display name of actor
  actorProfileImage: string,     // Profile image URL of actor
  postId?: string,               // (Optional) Post ID for like notifications
  communityId?: string,          // (Optional) Community ID
  communityName?: string,        // (Optional) Community name
  message: string,               // Notification message text
  read: boolean,                 // Whether notification has been read
  createdAt: timestamp           // Notification creation date
}
```

### Firestore Indexes

Required indexes for optimal performance:

1. **User notifications by creation date** (for real-time feed)
   - Fields: `userId` (ASC), `createdAt` (DESC)

2. **Unread notifications count** (for badge)
   - Fields: `userId` (ASC), `read` (ASC)

### Security Rules

```javascript
match /notifications/{notificationId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

---

## Implementation

### Service Layer

**File:** `/src/services/notificationService.js`

Key functions:

- `createNotification(notificationData)` - Create a new notification
- `subscribeToNotifications(userId, callback)` - Real-time notification subscription
- `markNotificationAsRead(notificationId)` - Mark single notification as read
- `markAllNotificationsAsRead(userId)` - Mark all notifications as read
- `deleteNotification(notificationId)` - Delete a notification
- `subscribeToUnreadCount(userId, callback)` - Real-time unread count

Helper functions for specific notification types:

- `createFollowNotification(followerId, followedUserId, followerProfile)`
- `createLikeNotification(likerId, postOwnerId, postId, likerProfile)`
- `createCommunityJoinNotification(userId, communityId, adminId, userProfile, communityData)`
- `createCommunityMessageNotifications(senderId, communityId, memberIds, senderProfile, communityData)`

### Component Layer

#### NotificationCard Component

**File:** `/src/components/NotificationCard.jsx`

**Props:**

- `notification`: Notification object

**Features:**

- Displays profile image (or placeholder)
- Shows actor name and action
- Displays time ago (e.g., "5m ago", "2h ago", "3d ago")
- Color-coded icons by notification type
- Visual indicator for unread notifications (blue left border)
- Click to navigate to relevant content
- Auto-marks as read on click

#### Inbox Page

**File:** `/src/pages/Inbox.jsx`

**Features:**

- Three tabs: All, Following, Activity
- Real-time notification updates
- Unread count badge in header
- "Mark all as read" button
- Empty state for each tab
- Responsive design

**Tab Filtering:**

- **All**: Shows all notifications
- **Following**: Shows follow and community_joined notifications
- **Activity**: Shows like and message notifications

---

## Integration Points

### 1. Follow Action

**File:** `/src/services/profileService.js`

```javascript
export const followUser = async (currentUserId, targetUserId) => {
  // ... existing follow logic ...

  // Create notification
  await createFollowNotification(currentUserId, targetUserId, currentUserData);
};
```

### 2. Like Action

**File:** `/src/services/postService.js`

```javascript
export const likePost = async (postId, userId) => {
  // ... existing like logic ...

  // Create notification (skip if user likes own post)
  const likerProfile = await getUserProfile(userId);
  await createLikeNotification(userId, postOwnerId, postId, likerProfile);
};
```

### 3. Community Join

**File:** `/src/services/communityService.js`

```javascript
export const joinCommunity = async (communityId, userId) => {
  // ... existing join logic ...

  // Notify all admins
  const userProfile = await getUserProfile(userId);
  const admins = communityData.admins || [communityData.createdBy];

  for (const adminId of admins) {
    await createCommunityJoinNotification(
      userId,
      communityId,
      adminId,
      userProfile,
      communityData,
    );
  }
};
```

---

## User Experience Flow

### Receiving Notifications

1. User performs an action (follow, like, join)
2. System creates notification in Firestore
3. Real-time listener in Inbox updates notification list
4. Unread count badge appears (if implemented in NavBar)

### Viewing Notifications

1. User navigates to Inbox tab
2. Notifications displayed in chronological order (newest first)
3. Unread notifications have blue left border
4. User can filter by All/Following/Activity tabs

### Interacting with Notifications

1. User clicks notification card
2. Notification marked as read
3. User navigated to relevant page:
   - Follow → Actor's profile
   - Like → Post detail page
   - Community Join → Community page
   - Message → Community page

### Managing Notifications

- Click "Mark all as read" to mark all at once
- Notifications persist until user deletes them (future feature)
- Real-time updates as new notifications arrive

---

## Performance Considerations

### Optimizations

1. **Limit Queries**: Maximum 100 notifications fetched
2. **Real-time Subscriptions**: Use onSnapshot for live updates
3. **Batch Operations**: Use writeBatch for marking multiple as read
4. **Error Handling**: Non-blocking - notification failures don't stop main actions

### Scalability

- Consider pagination for users with 100+ notifications
- Optional: Auto-delete old read notifications after 30 days
- Optional: Notification preferences (enable/disable types)

### Future Enhancements

1. **Push Notifications**: Browser push notifications
2. **Email Notifications**: Daily digest option
3. **Notification Preferences**: Per-type enable/disable
4. **Notification Grouping**: "X and 5 others liked your post"
5. **Mark as Archived**: Keep history without cluttering inbox
6. **Search/Filter**: Search notification content
7. **Sound/Visual Alerts**: Real-time notification toast

---

## Testing Checklist

- [ ] Follow a user → Notification appears in followed user's inbox
- [ ] Like a post → Notification appears in post owner's inbox
- [ ] Join a community → Notification appears in all admins' inboxes
- [ ] Click notification → Navigates to correct page and marks as read
- [ ] Mark all as read → All notifications marked
- [ ] Filter tabs → Correct notifications shown
- [ ] Real-time updates → New notifications appear without refresh
- [ ] Unread indicator → Blue border shows on unread notifications
- [ ] Empty states → Correct messages for each tab
- [ ] Profile images → Display correctly or show placeholder

---

## Deployment

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### Full Deployment

```bash
firebase deploy
```

---

## Troubleshooting

### Notifications Not Appearing

1. Check Firestore security rules are deployed
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure indexes are created in Firebase Console

### Real-time Updates Not Working

1. Verify onSnapshot subscription is active
2. Check network tab for WebSocket connection
3. Ensure component unmount cleanup (unsubscribe)

### Navigation Not Working

1. Verify postId/communityId exist in notification
2. Check routes are configured in App.jsx
3. Ensure user has permission to view target page

---

## Code Examples

### Creating a Custom Notification

```javascript
import { createNotification } from "../services/notificationService";

await createNotification({
  userId: targetUserId,
  type: "custom",
  actorId: currentUser.uid,
  actorName: currentUser.displayName,
  actorProfileImage: currentUser.profileImage,
  message: "Custom notification message",
  // Optional fields
  postId: "post123",
  communityId: "community456",
  communityName: "My Community",
});
```

### Subscribing to Notifications

```javascript
import { subscribeToNotifications } from "../services/notificationService";

useEffect(() => {
  const unsubscribe = subscribeToNotifications(
    currentUser.uid,
    (notifications) => {
      setNotifications(notifications);
    },
  );

  return () => unsubscribe();
}, [currentUser]);
```

### Getting Unread Count

```javascript
import { subscribeToUnreadCount } from "../services/notificationService";

useEffect(() => {
  const unsubscribe = subscribeToUnreadCount(currentUser.uid, (count) => {
    setUnreadCount(count);
  });

  return () => unsubscribe();
}, [currentUser]);
```

---

## Conclusion

The notification system is now fully integrated and provides a comprehensive solution for keeping users informed about important events. The system is scalable, performant, and follows Firebase best practices for real-time updates and security.
