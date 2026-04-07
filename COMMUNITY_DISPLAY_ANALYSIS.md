# Community Display Architecture Analysis

## Overview

This document provides a comprehensive analysis of how communities are displayed and fetched in the Sfera application.

---

## 1. File Locations & Page Structure

### Community-Related Pages (Source Files Referenced)

#### **Communities.jsx** - User's Communities Page

- **Purpose**: Displays all communities the logged-in user has joined
- **Route**: `/communities`
- **Key Features**:
  - Shows "My Communities" grid
  - "Create Community" button
  - Community cards with image, name, description, member count, category badges
  - Loading states and empty states

#### **Discover.jsx** - Discover & Join New Communities

- **Purpose**: Browse and discover communities not yet joined
- **Route**: `/discover`
- **Key Features**:
  - Two tabs: "Communities" and "Users"
  - Displays communities user hasn't joined
  - Search functionality
  - "Join Community" action button
  - Filters out already-joined communities

#### **CommunityPage.jsx** - Community Detail Page

- **Purpose**: Main community viewing and interaction page
- **Route**: `/communities/:communityId`
- **Key Features**:
  - Displays community header with image, name, member count
  - Tabbed navigation: Home, Posts, Chat (if collaborative), Media, Settings
  - Handles membership verification
  - Ban status checking
  - Access control for private communities

#### **Home.jsx** - Home Feed

- **Purpose**: User's main feed with personal and community posts
- **Key Features**:
  - Loads community posts (grouped by community)
  - Displays personal posts
  - Community feeds mixed with personal content

#### **ProfilePage.jsx** - User Profile

- **Purpose**: User profile with communities section
- **Key Features**:
  - "Communities" tab/modal showing user's communities
  - Searchable communities list
  - Community privacy status display

---

## 2. Community Display Logic & Data Flow

### Service Layer - `communityService.js`

**Key Functions Found:**

```javascript
// Fetch communities for a user
getCommunities(userId)
  → Returns user's joined communities
  → Used in: Communities.jsx, Home.jsx

// Fetch all communities (for discovery)
getAllCommunities()
  → Returns all public communities + private communities user isn't in
  → Filters to exclude already-joined communities
  → Used in: Discover.jsx

// Fetch community details
getCommunity(communityId)
  → Subscribes to real-time community data
  → Used in: CommunityPage.jsx

// Join/Leave operations
joinCommunity(userId, communityId, isPublic)
  → Adds user to community members list
  → Handles private community requests

leaveCommunity(userId, communityId)
  → Removes user from community members list

// Ban status checking
isUserBanned(communityId, userId)
subscribeToUserBanStatus(communityId, userId)
  → Real-time ban status monitoring

// Get community members
getCommunityMembers(communityId)
  → Returns members and admins arrays

// Role & permission checking
getUserRole(communityId, userId)
  → Returns: role type, admin status, member status
```

### Data Structure - Community Object

```javascript
Community {
  id: string,
  name: string,
  description: string,
  imageUrl: string,
  members: string[], // array of user IDs
  admins: string[],  // array of admin user IDs
  isPublic: boolean,
  isCollaborative: boolean,
  categories: string[],
  chatEnabled: boolean,
  mediaEnabled: boolean,
  createdAt: timestamp,
  createdBy: userId,
  isPrivate: boolean,
  ...
}
```

### Data Fetching Flow Diagram

```
User Navigation
      ↓
Communities.jsx (User's communities)
      ↓
getCommunities(currentUser.uid)
      ↓
Firestore: /communities (query by user membership)
      ↓
Display: Grid of community cards
```

```
Discover.jsx
      ↓
getAllCommunities()
      ↓
Firestore: /communities (get all docs)
      ↓
Filter: Remove communities where user is member
      ↓
Display: Grid of discoverable communities
```

```
CommunityPage.jsx
      ↓
subscribeToCommunity(communityId)
      ↓
Firestore: Real-time listener on /communities/{id}
      ↓
Check: isMember, userRole, banStatus
      ↓
Render: Community details + conditional tabs
```

---

## 3. Community Display Implementation

### Communities.jsx - Display Structure

```
┌─ Header Section
│  ├─ Title: "Communities"
│  └─ Create Community button
├─ Empty State (if no communities)
│  ├─ Icon + text
│  ├─ "Create Your First Community" button
│  └─ "Go to Discover Page" button
└─ Grid Layout (if communities exist)
   ├─ CommunityCard (repeated)
   │  ├─ Image (community.imageUrl)
   │  ├─ Name (community.name)
   │  ├─ Description (community.description)
   │  ├─ Member count (members.length + admins.length)
   │  ├─ Type badge (Public/Private)
   │  ├─ Collaboration badge (Collaborative/Informational)
   │  └─ Category bubbles (first 3)
   └─ onClick → Navigate to /communities/{communityId}
```

### Discover.jsx - Community Cards Display

```
┌─ Header with search & tabs
├─ Search input (filters communities in real-time)
├─ Tabs: Communities | Users
└─ Community Grid (if Communities tab)
   ├─ Community Card
   │  ├─ Image placeholder
   │  ├─ Name
   │  ├─ Public/Private badge
   │  ├─ Description (line-clamped)
   │  ├─ Member count with icon
   │  ├─ "View Community" button
   │  └─ "Join Community" button (if not member)
   └─ Empty state: "You've joined all available communities!"
```

### CommunityPage.jsx - Detail Display

```
┌─ Header Section
│  ├─ Back button
│  ├─ Community image
│  ├─ Community name
│  ├─ Member count
│  └─ Action buttons: Join/Leave/Request Access
├─ Tab Navigation
│  ├─ Home (always)
│  ├─ Posts (if member)
│  ├─ Chat (if member & collaborative & enabled)
│  ├─ Media (if member & collaborative & enabled)
│  ├─ Members (if member)
│  ├─ Admin Chat (if admin)
│  └─ Settings (if admin)
└─ Tab Content (dynamic based on active tab)
```

---

## 4. Error Messages & Error Handling

### Console Error Messages Found in Compiled Code

**Community-Related Errors:**

```
"Error creating community message notifications:"
"Error creating community post notifications:"
"Error joining community:"
"Error leaving community:"
"Error deleting community post image:"
"Error deleting community cover image:"
"Error loading user profile:"
"Error creating community post:"
"Error fetching user profile:"
"Error getting user communities posts:"
"Error listening to community posts:"
```

### Error Handling Patterns in Source Code

**From Home.jsx:**

```javascript
try {
    const communityPostsData = await getUserCommunitiesPosts(currentUser.uid);
    setCommunityPosts(...);
} catch (error) {
    console.error("Error loading community posts:", error);
} finally {
    setLoading(false);
}
```

**From Discover.jsx:**

```javascript
try {
  setLoading(true);
  const data = await getAllCommunities();
  // Filter out already-joined communities
  const unjoined = currentUser
    ? data.filter((c) => !c.members?.includes(currentUser.uid))
    : data;
  setCommunities(unjoined);
} catch (err) {
  console.error("Error fetching communities:", err);
  setError("Failed to load communities");
}
```

**From Communities.jsx:**

```javascript
try {
  if (currentUser) {
    const myComms = await getCommunities(currentUser.uid);
    console.log("My Communities:", myComms);
    setMyCommunities(myComms);
  }
} catch (error) {
  console.error("Error loading communities:", error);
}
```

---

## 5. Firestore Debug Log Analysis

**Log File:** `/Users/krishc7/version-control/Software_Engineering/final-project-Krish2026/firestore-debug.log`

**Recent Log Entries (Apr 05-06, 2026):**

```
Apr 05, 2026 11:34:47 PM: Started WebSocket server on ws://127.0.0.1:9150
API endpoint: http://127.0.0.1:8080
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080

Apr 06, 2026 12:07:04 AM: Detected non-HTTP/2 connection
*** shutting down gRPC server since JVM is shutting down
*** server shut down
```

**Note:** Firestore emulator is running locally - no critical errors logged

---

## 6. Community Data Flow Architecture

### State Management Pattern

**Communities.jsx State:**

```javascript
const [myCommunities, setMyCommunities] = useState([]); // Displayed communities
const [loading, setLoading] = useState(true); // Loading indicator
const [showCreateModal, setShowCreateModal] = useState(false); // Modal control
```

**Discover.jsx State:**

```javascript
const [communities, setCommunities] = useState([]); // All communities
const [filteredCommunities, setFilteredCommunities] = useState([]); // Filtered results
const [users, setUsers] = useState([]); // Discovered users
const [loading, setLoading] = useState(true); // Loading state
const [error, setError] = useState(null); // Error state
const [joiningCommunityId, setJoiningCommunityId] = useState(null); // Join action state
```

**CommunityPage.jsx State:**

```javascript
const [community, setCommunity] = useState(null); // Current community
const [loading, setLoading] = useState(true); // Data loading
const [activeTab, setActiveTab] = useState("home"); // Tab navigation
const [joining, setJoining] = useState(false); // Join button state
const [isBanned, setIsBanned] = useState(false); // Ban status
```

### Real-Time Data Subscriptions

**CommunityPage uses Firestore listeners:**

```javascript
useEffect(() => {
  // Subscribe to real-time community data updates
  const unsubscribe = subscribeToCommunity(communityId, (data) => {
    setCommunity(data);
  });

  return () => unsubscribe();
}, [communityId]);
```

**Home.jsx uses real-time post updates:**

```javascript
const unsubscribePosts = subscribeToPersonalPosts(currentUser.uid, (posts) =>
  setPersonalPosts(posts),
);

const unsubscribeLikes = subscribeToUserLikes(currentUser.uid, (likes) =>
  setUserLikes(likes),
);
```

---

## 7. Compiled Code Location

**Compiled JavaScript Bundle:**

- **File:** `/Users/krishc7/version-control/Software_Engineering/final-project-Krish2026/dist/assets/index-wrf5o26R.js`
- **Size:** ~3999 lines
- **Contains:** All React components, services, translations, and Firestore logic (minified/bundled)

**Key Functions in Bundle:**

- Community service functions (getAllCommunities, getCommunities, joinCommunity, etc.)
- Community component renderers
- State management hooks
- Firestore integration code
- Internationalization (English, Spanish, French, Italian, Chinese, Japanese)

---

## 8. Community Access Control

### Permission Levels:

1. **Non-Member**: Can view public community home
2. **Member**: Full access to community + posts/chat/media
3. **Admin**: Member + Settings access + Moderation tools
4. **Owner**: Admin + Delete community + Transfer ownership
5. **Banned**: No access (except owner/admins can unban)

### Privacy Handling:

```javascript
// Private communities
- Non-members see "Request Access" button
- Access requires admin approval
- Private community data not in getAllCommunities results

// Public communities
- Anyone can join directly
- All community info visible to non-members
- Listed in Discover page
```

---

## 9. Image/Asset Handling

**Community Images:**

- `community.imageUrl` - Community profile image
- Displayed in cards, headers, and listings
- Stored in Firebase Storage
- Error: "Error deleting community cover image:" indicates image management functionality

---

## 10. Search & Filtering

**Communities.jsx Search:**

```javascript
// Searchable by:
- Community name
- Community description
// Real-time filtering in ProfilePage communities modal
```

**Discover.jsx Search:**

```javascript
// Filters communities by:
- Name match
- Description match
// Updates filtered list in real-time
// Separate tabs for Communities vs Users search
```

---

## 11. Loading States & Empty States

### Loading Indicators:

```
- Spinner: "animate-spin rounded-full h-16 w-16 border-b-2"
- Text: "Loading...", "Joining...", "Opening..."

### Empty States:
Communities.jsx:
- "No communities yet"
- "Create or join a community to get started"

Discover.jsx:
- "You've joined all available communities!"
- "No communities found matching your search."
```

---

## 12. Accessibility Features Found

**Translations Available:**

- English: "Communities", "Join Community", "All Communities"
- Spanish: "Comunidades", "Unirse a la comunidad", "Todas las comunidades"
- French: "Communautés", "Rejoindre la communauté", "Toutes les communautés"
- Italian: "Comunità", "Unisciti alla comunità", "Tutte le comunità"
- Chinese: "社区", "加入社区", "所有社区"
- Japanese: "コミュニティ", "コミュニティに参加", "すべてのコミュニティ"

**Accessibility Labels:**

- Navigation landmarks
- Skip to main content
- Text-to-speech support
- High contrast mode support

---

## Summary

**Community Display Flow:**

1. User navigates to /communities → Loads user's communities via `getCommunities(userId)`
2. Community cards rendered in grid layout
3. Click card → Navigate to /communities/{communityId}
4. CommunityPage subscribes to real-time community data
5. Check user role/ban status to determine available tabs
6. Render appropriate content based on membership & permissions

**Data Flow:**

- Services → State Management (React hooks) → Component Rendering
- Real-time Firestore listeners for live updates
- Error handling with console logging
- Loading states during async operations
- Empty states for no data conditions

**Technologies:**

- React (hooks, context, routing)
- Firestore (real-time subscriptions, collections)
- Data stored in: `/communities/{id}` with subcollections for posts, members, etc.
