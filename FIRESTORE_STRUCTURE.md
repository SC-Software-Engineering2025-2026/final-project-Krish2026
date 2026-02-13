# Firestore Database Structure

This document outlines the complete Firestore database structure for the Sfera application.

## Collections Overview

```
📦 Firestore Database
├── 👥 users/                    # User profiles
├── 📝 userPosts/                # User posts
├── 💬 postComments/             # Comments on posts
├── ❤️ postLikes/                # Likes on posts
└── 🏘️ communities/              # Communities
    ├── 📄 posts/                # Community posts (subcollection)
    ├── 🖼️ media/                 # Community media library (subcollection)
    └── 💬 chat/                  # Community chat messages (subcollection)
```

---

## Collection Details

### 1. `users/` - User Profiles

**Document ID:** User's Firebase Auth UID

**Structure:**

```javascript
{
  username: string,              // Unique username
  displayName: string,           // Display name
  email: string,                 // User email
  bio: string,                   // User biography
  profileImage: string,          // Profile image URL
  coverImages: string[],         // Array of cover image URLs
  links: string[],               // Array of social links
  joinedCommunities: string[],   // Array of community IDs
  isPrivate: boolean,            // Is profile private
  postsCount: number,            // Number of posts
  followersCount: number,        // Number of followers
  followingCount: number,        // Number of following
  createdAt: timestamp,          // Account creation date
  updatedAt: timestamp           // Last update date
}
```

**Security:**

- Read: All authenticated users
- Create: Owner only (on signup)
- Update/Delete: Owner only

---

### 2. `userPosts/` - User Posts

**Document ID:** Auto-generated

**Structure:**

```javascript
{
  userId: string,                // User ID who created the post
  caption: string,               // Post caption
  images: string[],              // Array of image URLs
  tags: string[],                // Array of hashtags
  location: string,              // Location tag
  likesCount: number,            // Number of likes
  commentsCount: number,         // Number of comments
  createdAt: timestamp,          // Post creation date
  updatedAt: timestamp           // Last update date
}
```

**Security:**

- Read: All authenticated users
- Create: All authenticated users
- Update/Delete: Post owner only

---

### 3. `postComments/` - Post Comments

**Document ID:** Auto-generated

**Structure:**

```javascript
{
  postId: string,                // ID of the post
  userId: string,                // User ID who commented
  text: string,                  // Comment text
  createdAt: timestamp           // Comment creation date
}
```

**Security:**

- Read: All authenticated users
- Create: All authenticated users
- Update/Delete: Comment author only

---

### 4. `postLikes/` - Post Likes

**Document ID:** `{postId}_{userId}` (composite)

**Structure:**

```javascript
{
  postId: string,                // ID of the post
  userId: string,                // User ID who liked
  createdAt: timestamp           // Like creation date
}
```

**Security:**

- Read: All authenticated users
- Create: All authenticated users
- Delete: Like owner only

---

### 5. `communities/` - Communities

**Document ID:** Auto-generated

**Structure:**

```javascript
{
  name: string,                  // Community name
  description: string,           // Community description
  coverImage: string,            // Cover image URL
  createdBy: string,             // Creator's user ID
  admins: string[],              // Array of admin user IDs
  members: string[],             // Array of member user IDs
  memberCount: number,           // Total member count
  isPrivate: boolean,            // Is community private
  createdAt: timestamp,          // Community creation date
  updatedAt: timestamp           // Last update date
}
```

**Security:**

- Read: All authenticated users
- Create: All authenticated users
- Update: Community admins and creator
- Delete: Community creator only

---

#### 5.1 `communities/{communityId}/posts/` - Community Posts (Subcollection)

**Document ID:** Auto-generated

**Structure:**

```javascript
{
  userId: string,                // User ID who created the post
  caption: string,               // Post caption
  images: string[],              // Array of image URLs
  tags: string[],                // Array of hashtags
  likesCount: number,            // Number of likes
  commentsCount: number,         // Number of comments
  createdAt: timestamp,          // Post creation date
  updatedAt: timestamp           // Last update date
}
```

**Security:**

- Read: Community members only
- Create: Community members only
- Update/Delete: Post owner or community admins

---

#### 5.2 `communities/{communityId}/media/` - Community Media (Subcollection)

**Document ID:** Auto-generated

**Structure:**

```javascript
{
  url: string,                   // Media file URL
  type: string,                  // Media type (image, video, etc.)
  uploadedBy: string,            // User ID who uploaded
  caption: string,               // Media caption
  createdAt: timestamp           // Upload date
}
```

**Security:**

- Read: Community members only
- Create: Community members only
- Delete: Uploader or community admins

---

#### 5.3 `communities/{communityId}/chat/` - Community Chat (Subcollection)

**Document ID:** Auto-generated

**Structure:**

```javascript
{
  userId: string,                // User ID who sent the message
  text: string,                  // Message text
  imageUrl: string,              // Optional image URL
  createdAt: timestamp           // Message timestamp
}
```

**Security:**

- Read: Community members only
- Create: Community members only
- Delete: Community admins only

---

## Storage Buckets (Firebase Storage)

### Structure:

```
📦 Firebase Storage
├── 📁 posts/
│   └── {userId}/
│       └── {timestamp}-{index}     # User post images
├── 📁 profiles/
│   └── {userId}/
│       ├── avatar.jpg              # Profile images
│       └── cover/                  # Cover images
├── 📁 communities/
│   └── {communityId}/
│       ├── cover.jpg               # Community cover images
│       ├── posts/                  # Community post images
│       ├── media/                  # Community media library
│       └── chat/                   # Chat images
```

---

## Indexes Required

Add these to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "userPosts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "postComments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "postId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "communities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "members", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION_GROUP",
      "fields": [{ "fieldPath": "createdAt", "order": "DESCENDING" }]
    }
  ]
}
```

---

## Deployment Commands

### Deploy Firestore Rules:

```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes:

```bash
firebase deploy --only firestore:indexes
```

### Deploy All:

```bash
firebase deploy
```

---

## Notes

- All collections are created automatically when the first document is added
- Firestore is schema-less, so these structures are guidelines
- Security rules are enforced at the database level
- Subcollections are nested under their parent documents
- All timestamps use Firebase `serverTimestamp()`
