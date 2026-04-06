# Community Feature Implementation Guide

## Overview

This document provides a comprehensive guide to the community feature implementation in Sfera. The feature supports both collaborative and informational community types with full permission management.

## Architecture

### File Structure

```
src/
├── components/
│   ├── CreateCommunity.jsx          # Community creation modal
│   ├── CommunityHome.jsx            # Collaborative community home page
│   ├── InfoCommunityHome.jsx        # Informational community home page
│   ├── CommunityPosts.jsx           # Collaborative community posts feed
│   ├── InfoCommunityPosts.jsx       # Informational community posts (admin-only posting)
│   ├── CommunityChat.jsx            # Real-time group chat (collaborative)
│   ├── AdminChat.jsx                # Private admin chat (informational)
│   ├── UserToAdminMessaging.jsx     # User-to-admin messaging (informational)
│   ├── MediaLibrary.jsx             # Shared media library
│   └── CommunitySettings.jsx        # Community management settings
├── pages/
│   ├── Communities.jsx              # Communities listing page
│   └── CommunityPage.jsx            # Individual community page with tabs
├── services/
│   ├── communityService.js          # Community CRUD operations
│   ├── communityPostService.js      # Community posts operations
│   ├── communityChatService.js      # Chat and messaging operations
│   └── communityMediaService.js     # Media upload/management
└── hooks/
    └── useCommunityPermissions.js   # Custom hooks for permission checking
```

## Features

### 1. Community Creation

- **Form fields**: Name, description, image, privacy toggle, type toggle
- **Privacy options**: Public (anyone can join) or Private (invitation only)
- **Community types**:
  - **Collaborative**: All members can post, chat, and share media
  - **Informational**: Only admins can post, members can view and comment

**Component**: `CreateCommunity.jsx`

### 2. Community Types

#### Collaborative Communities

- **Home Page**: Rich text editor for welcome content (admin-editable)
- **Posts**: All members can create posts with images/videos
- **Chat**: Real-time group chat for all members
- **Media Library**: Shared photo/video library with upload functionality
- Members can like, comment, and share posts

#### Informational Communities

- **Home Page**: Rich text editor (admin-only editing)
- **Posts**: Admin-only posting, members can view and comment
- **Admin Chat**: Private chat channel for admins only
- **User-to-Admin Messaging**: Members can send messages to admins as a group
- Focused on one-way information dissemination

### 3. Permission System

#### Custom Hooks

Located in `src/hooks/useCommunityPermissions.js`:

**`useCommunityRole(communityId, userId)`**
Returns user's role and membership status:

```javascript
const { role, loading, isAdmin, isMember } = useCommunityRole(
  communityId,
  userId,
);
```

**`useIsMember(communityId, userId)`**
Checks if user is a community member:

```javascript
const { isMember, loading, checkMembership } = useIsMember(communityId, userId);
```

**`useCommunityPermissions(communityId, userId, community)`**
Returns detailed permission flags:

```javascript
const {
  canPost,
  canEdit,
  canDelete,
  canManageMembers,
  canManageSettings,
  canAccessAdminChat,
  canViewContent,
  loading,
  role,
  isAdmin,
  isMember,
} = useCommunityPermissions(communityId, userId, community);
```

**`useCanAccessPage(communityId, userId, pageType, community)`**
Checks access to specific community pages:

```javascript
const { canAccess, loading, redirectPath } = useCanAccessPage(
  communityId,
  userId,
  "settings",
  community,
);
```

#### Role Hierarchy

1. **Creator**: Original community creator
   - All admin permissions
   - Can delete community
   - Cannot leave (must transfer ownership or delete)

2. **Admin**: Promoted by creator or other admins
   - Edit community settings
   - Manage members (promote/remove)
   - Post content (all types)
   - Access admin-only features

3. **Member**: Regular community member
   - View all content
   - Post in collaborative communities
   - Comment on posts
   - Use community features based on type

### 4. Community Services

#### communityService.js

Core community operations:

- `createCommunity(userId, communityData, imageFile)`
- `getCommunity(communityId)`
- `getCommunities(userId)` - Get user's or public communities
- `joinCommunity(communityId, userId)`
- `leaveCommunity(communityId, userId)`
- `updateCommunity(communityId, updates, newImage)`
- `deleteCommunity(communityId, userId)`
- `getUserRole(communityId, userId)`
- `isMember(communityId, userId)`
- `promoteToAdmin(communityId, userId, promoterId)`
- `removeMember(communityId, userIdToRemove, adminId)`
- `getCommunityMembers(communityId)`
- `updateHomePageContent(communityId, content)`
- `subscribeToCommunity(communityId, callback)` - Real-time updates

#### communityPostService.js

Post management:

- `createCommunityPost(communityId, userId, postData, images)`
- `getCommunityPosts(communityId)`
- `likeCommunityPost(postId, userId)`
- `addCommentToCommunityPost(postId, userId, text)`
- `getCommunityPostComments(postId)`
- `deleteCommunityPost(communityId, postId, userId)`

#### communityChatService.js

Real-time messaging:

- `sendCommunityMessage(communityId, userId, messageData)` - Group chat
- `subscribeToCommunityMessages(communityId, callback)` - Real-time listener
- `sendAdminMessage(communityId, userId, messageData)` - Admin chat
- `subscribeToAdminMessages(communityId, callback)`
- `sendUserToAdminMessage(communityId, userId, text)`
- `subscribeToUserToAdminMessages(communityId, callback)`

#### communityMediaService.js

Media library management:

- `uploadCommunityMedia(communityId, userId, file)`
- `getCommunityMedia(communityId)`
- `deleteCommunityMedia(communityId, mediaId, userId)`

### 5. Firestore Data Structure

```
communities/
  {communityId}/
    - name: string
    - description: string
    - imageUrl: string
    - isPublic: boolean
    - isCollaborative: boolean
    - creatorId: string
    - admins: array<string>
    - members: array<string>
    - memberCount: number
    - homePageContent: string (HTML from rich text editor)
    - createdAt: timestamp
    - updatedAt: timestamp

    communityMembers/
      {memberId}/
        - userId: string
        - role: "admin" | "member"
        - joinedAt: timestamp

    posts/
      {postId}/
        - userId: string
        - content: string
        - images: array<string>
        - videos: array<string>
        - likes: array<string>
        - likesCount: number
        - commentsCount: number
        - createdAt: timestamp

        comments/
          {commentId}/
            - userId: string
            - text: string
            - createdAt: timestamp

    messages/              # Group chat (collaborative)
      {messageId}/
        - userId: string
        - text: string
        - imageUrl: string
        - type: "text" | "image"
        - createdAt: timestamp

    adminMessages/         # Admin-only chat (informational)
      {messageId}/
        - userId: string
        - text: string
        - imageUrl: string
        - type: "text" | "image"
        - createdAt: timestamp

    userToAdminMessages/   # User-to-admin messaging (informational)
      {messageId}/
        - userId: string
        - text: string
        - read: boolean
        - createdAt: timestamp

    media/                 # Media library
      {mediaId}/
        - userId: string
        - url: string
        - type: "image" | "video"
        - fileName: string
        - fileSize: number
        - storagePath: string
        - createdAt: timestamp
```

### 6. Storage Structure

```
storage/
  communities/
    {communityId}/
      - community image
      posts/
        - post images
      chat/
        - chat images
      adminChat/
        - admin chat images
      media/
        - media library files
```

## Usage Examples

### Creating a Community

```javascript
import CreateCommunity from "./components/CreateCommunity";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Create Community</button>
      {showModal && <CreateCommunity onClose={() => setShowModal(false)} />}
    </>
  );
}
```

### Using Permission Hooks

```javascript
import { useCommunityPermissions } from "./hooks/useCommunityPermissions";

function CommunityComponent({ communityId, community }) {
  const { currentUser } = useAuth();
  const { canPost, canEdit, isAdmin } = useCommunityPermissions(
    communityId,
    currentUser?.uid,
    community,
  );

  return (
    <>
      {canPost && <CreatePostButton />}
      {canEdit && <EditButton />}
      {isAdmin && <AdminPanel />}
    </>
  );
}
```

### Subscribing to Real-time Updates

```javascript
useEffect(() => {
  const unsubscribe = subscribeToCommunity(communityId, (communityData) => {
    setCommunity(communityData);
  });

  return () => unsubscribe();
}, [communityId]);
```

## Key Features

1. **Rich Text Editing**: Home pages use ReactQuill for formatted content with images, videos, and links
2. **Real-time Updates**: Chat and community data use Firestore listeners for instant updates
3. **Permission-based UI**: Components conditionally render based on user permissions
4. **Image Upload**: Support for community images, post images, chat images, and media library
5. **Member Management**: Admins can promote members, remove users, and manage community
6. **Flexible Community Types**: Same codebase supports both collaborative and informational models

## Security Considerations

1. All permission checks are enforced at the service layer
2. Firestore security rules should mirror permission logic
3. Image uploads validate file size and type
4. Admin actions verify caller's role before execution
5. Creator-only actions (delete community) are protected

## Dependencies

- `react-quill`: Rich text editor for home pages
- `firebase`: Firestore, Storage, and Auth
- `react-router-dom`: Navigation between community pages

## Future Enhancements

- Direct messaging between members
- Community events and calendar
- Polls and surveys
- File sharing (documents, PDFs)
- Community analytics for admins
- Notification system for community updates
- Email invitations for private communities
- Community badges and achievements
- Integration with external services

## Testing Checklist

- [ ] Create collaborative community
- [ ] Create informational community
- [ ] Join public community
- [ ] Leave community
- [ ] Post in collaborative community (member)
- [ ] Post in informational community (admin)
- [ ] Send chat message
- [ ] Upload media to library
- [ ] Edit community home page
- [ ] Promote member to admin
- [ ] Remove member (admin)
- [ ] Update community settings
- [ ] Delete community (creator)
- [ ] Test permission restrictions
- [ ] Test real-time updates

## Troubleshooting

**Issue**: Can't see real-time updates

- Ensure Firestore listeners are properly subscribed
- Check cleanup functions in useEffect

**Issue**: Permission denied errors

- Verify user is logged in
- Check user role in community
- Ensure Firestore rules match permission logic

**Issue**: Images not uploading

- Check file size limits (5MB default)
- Verify Storage rules allow uploads
- Check network connectivity

**Issue**: Rich text editor not working

- Ensure react-quill is installed
- Import quill.snow.css stylesheet
- Check browser console for errors
