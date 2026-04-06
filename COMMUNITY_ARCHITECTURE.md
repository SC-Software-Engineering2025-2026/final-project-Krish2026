# Community Feature Architecture Diagram

## Component Hierarchy

```
App.jsx
├── NavBar.jsx
└── Router
    ├── Communities.jsx (List View)
    │   └── CreateCommunity.jsx (Modal)
    │
    └── CommunityPage.jsx (Individual Community)
        ├── Tab: Home
        │   ├── CommunityHome.jsx (Collaborative)
        │   └── InfoCommunityHome.jsx (Informational)
        │
        ├── Tab: Posts
        │   ├── CommunityPosts.jsx (Collaborative)
        │   │   ├── PostCard
        │   │   ├── CreatePostModal
        │   │   └── CommentsModal
        │   └── InfoCommunityPosts.jsx (Informational)
        │       ├── PostCard
        │       ├── CreatePostModal (Admin Only)
        │       └── CommentsModal
        │
        ├── Tab: Chat (Collaborative Only)
        │   └── CommunityChat.jsx
        │       ├── MessageBubble
        │       └── MembersList
        │
        ├── Tab: Admin Chat (Informational Only)
        │   └── AdminChat.jsx
        │       └── MessageBubble
        │
        ├── Tab: User-to-Admin (Informational Only)
        │   └── UserToAdminMessaging.jsx
        │       └── MessageCard
        │
        ├── Tab: Media (Collaborative Only)
        │   └── MediaLibrary.jsx
        │       ├── MediaItem
        │       └── MediaViewer
        │
        └── Tab: Settings (Admin Only)
            └── CommunitySettings.jsx
                ├── GeneralSettings
                └── MembersSettings
```

## Data Flow

```
User Action
    ↓
Component (React)
    ↓
Custom Hook (useCommunityPermissions)
    ↓
Service Layer (communityService.js)
    ↓
Firebase (Firestore/Storage)
    ↓
Real-time Listeners
    ↓
State Updates
    ↓
UI Re-render
```

## Service Architecture

```
Services Layer
├── communityService.js
│   ├── CRUD Operations
│   ├── Member Management
│   ├── Permission Checks
│   └── Real-time Subscriptions
│
├── communityPostService.js
│   ├── Post Creation
│   ├── Like/Comment
│   └── Post Retrieval
│
├── communityChatService.js
│   ├── Group Chat
│   ├── Admin Chat
│   └── User-to-Admin Messages
│
└── communityMediaService.js
    ├── Upload Media
    ├── Get Media
    └── Delete Media
```

## Permission Flow

```
User Request
    ↓
useCommunityRole(communityId, userId)
    ↓
getUserRole(communityId, userId)
    ↓
Firestore Query: communities/{id}/communityMembers
    ↓
Return: { role: "admin" | "member" | null }
    ↓
Component: Conditional Rendering
    ↓
If Unauthorized: Redirect or Show Message
If Authorized: Allow Action
```

## Community Type Decision Tree

```
Community Created
    ↓
Is Collaborative?
    ↓
YES                             NO (Informational)
    ↓                               ↓
Features:                       Features:
├── Rich Home Page              ├── Rich Home Page
│   (Admin Editable)            │   (Admin Only)
├── Posts                       ├── Posts
│   (All Members)               │   (Admin Only)
├── Group Chat                  ├── Admin Chat
│   (All Members)               │   (Admins Only)
└── Media Library               └── User-to-Admin
    (All Members)                   (All Members)
```

## Real-time Update Flow

```
User A: Creates Post
    ↓
communityPostService.createCommunityPost()
    ↓
Firestore: Add Document
    ↓
onSnapshot Listener (All Users)
    ↓
User B's State: setPosts(newPosts)
    ↓
User B's UI: Post Appears Instantly
```

## File Upload Flow

```
User Selects File
    ↓
Validate File Size/Type
    ↓
Create Storage Reference
    ↓
uploadBytes(storageRef, file)
    ↓
getDownloadURL(snapshot.ref)
    ↓
Save URL to Firestore
    ↓
Return URL to Component
    ↓
Display Image in UI
```

## Community Creation Flow

```
User Fills Form
    ↓
Validates Input
    ↓
Upload Community Image (if provided)
    ↓
createCommunity(userId, data, image)
    ↓
Create Firestore Document
    ├── Community Data
    ├── Creator as First Member
    └── Creator as Admin
    ↓
Add to communityMembers Subcollection
    ↓
Return Community ID
    ↓
Navigate to Community Page
```

## Permission Matrix Visual

```
┌─────────────────┬─────────┬─────────┬──────────┐
│     Action      │ Member  │  Admin  │ Creator  │
├─────────────────┼─────────┼─────────┼──────────┤
│ View Content    │    ✓    │    ✓    │    ✓     │
│ Post (Collab)   │    ✓    │    ✓    │    ✓     │
│ Post (Info)     │    ✗    │    ✓    │    ✓     │
│ Edit Home       │    ✗    │    ✓    │    ✓     │
│ Manage Members  │    ✗    │    ✓    │    ✓     │
│ Edit Settings   │    ✗    │    ✓    │    ✓     │
│ Delete Community│    ✗    │    ✗    │    ✓     │
└─────────────────┴─────────┴─────────┴──────────┘
```

## State Management

```
Component Level State
├── Local UI State (forms, modals, tabs)
├── Loading States (fetching, submitting)
└── Error States (validation, network)

Hook Level State
├── useCommunityRole → { role, isAdmin, isMember }
├── useIsMember → { isMember, loading }
└── useCommunityPermissions → { permissions object }

Context Level State
└── AuthContext → { currentUser, login, logout }

Server State (Firestore)
├── Real-time Listeners (onSnapshot)
├── Query Results (getDocs)
└── Single Documents (getDoc)
```

## Component Communication

```
Parent → Child: Props
    CommunityPage → CommunityHome
    { communityId, userRole }

Child → Parent: Callbacks
    CreateCommunity → Communities
    onClose={() => setShowModal(false)}

Sibling → Sibling: Context/State Lift
    CommunityHome ← CommunityPage → CommunityPosts
    Share: communityId, userRole via props

Global: Context
    Any Component → AuthContext
    { currentUser, login, logout }
```

## Routing Structure

```
/communities
    └── List of all communities
        ├── My Communities Tab
        └── Explore Tab

/communities/:communityId
    └── Individual Community
        ├── /home (default)
        ├── /posts
        ├── /chat (collaborative)
        ├── /adminChat (informational)
        ├── /userToAdmin (informational)
        ├── /media (collaborative)
        └── /settings (admin only)
```

## Firebase Structure

```
Firestore
├── communities/
│   └── {communityId}/
│       ├── [community data]
│       ├── communityMembers/
│       ├── posts/
│       │   └── {postId}/
│       │       └── comments/
│       ├── messages/
│       ├── adminMessages/
│       ├── userToAdminMessages/
│       └── media/

Storage
└── communities/
    └── {communityId}/
        ├── [community-image].jpg
        ├── posts/
        ├── chat/
        ├── adminChat/
        └── media/
```

## Lifecycle Hooks

```
Component Mount
    ↓
useEffect(() => {
    loadData()
    subscribe()
    return () => unsubscribe()
}, [dependencies])
    ↓
Data Loads → State Updates → Render
    ↓
User Interaction
    ↓
Event Handler → Service Call → State Update
    ↓
Re-render
    ↓
Component Unmount
    ↓
Cleanup (unsubscribe listeners)
```

## Error Handling Flow

```
User Action
    ↓
Try Block
    ↓
Service Call
    ↓
Success?
├── YES → Update State → Success UI
└── NO → Catch Block
        ↓
    Log Error
        ↓
    Set Error State
        ↓
    Display Error Message
        ↓
    User Can Retry
```

## Testing Strategy

```
Unit Tests
├── Service Functions
├── Custom Hooks
└── Utility Functions

Integration Tests
├── Component + Service
├── Permission Checks
└── Data Flow

E2E Tests
├── User Flows
├── Permission Scenarios
└── Real-time Updates

Manual Testing
├── UI/UX
├── Responsive Design
└── Edge Cases
```

---

This architecture ensures:

- ✅ Clear separation of concerns
- ✅ Reusable components and services
- ✅ Scalable permission system
- ✅ Real-time data synchronization
- ✅ Type-safe data flow
- ✅ Maintainable codebase
