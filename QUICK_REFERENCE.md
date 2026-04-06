# Quick Reference: User Profile Feature

## 🎯 Quick Start Commands

```bash
# Install dependencies (if not already done)
npm install

# Start development server with Firebase emulators
npm start

# Or run dev server only
npm run dev

# Or run emulators only
npm run emulators
```

## 📍 Key URLs

- Home: `http://localhost:5173/`
- Your Profile: `http://localhost:5173/profile`
- Specific User: `http://localhost:5173/profile/:userId`
- Post Detail: `http://localhost:5173/post/:postId`
- Login: `http://localhost:5173/login`
- Signup: `http://localhost:5173/signup`

## 🔑 Key Components

### Service Functions (Import from services)

```javascript
// Profile Services
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  uploadCoverImages,
  toggleProfilePrivacy,
} from "../services/profileService";

// Post Services
import {
  createPost,
  getUserPosts,
  getPost,
  deletePost,
  likePost,
  addComment,
} from "../services/postService";
```

### UI Components (Import from components/pages)

```javascript
import ProfilePage from "../pages/ProfilePage";
import PostDetail from "../pages/PostDetail";
import EditProfile from "../components/EditProfile";
import PostUpload from "../components/PostUpload";
import PostGrid from "../components/PostGrid";
```

## 💡 Common Tasks

### Create a New Post

```javascript
import { createPost } from '../services/postService';

const postData = {
  caption: 'My awesome post!',
  location: 'New York, NY',
  tags: ['photography', 'travel']
};

const imageFiles = [...]; // Array of File objects
const postId = await createPost(userId, postData, imageFiles);
```

### Update Profile

```javascript
import { updateUserProfile } from "../services/profileService";

await updateUserProfile(userId, {
  displayName: "New Name",
  bio: "Updated bio",
  username: "newusername",
});
```

### Upload Profile Picture

```javascript
import { uploadProfileImage } from "../services/profileService";

const file = event.target.files[0];
const imageUrl = await uploadProfileImage(userId, file);
```

### Get User Posts

```javascript
import { getUserPosts } from "../services/postService";

const { posts, lastDoc } = await getUserPosts(userId, 12);
```

### Like a Post

```javascript
import { likePost, unlikePost } from "../services/postService";

// Like
await likePost(postId, userId);

// Unlike
await unlikePost(postId, userId);
```

### Add Comment

```javascript
import { addComment } from "../services/postService";

const commentId = await addComment(postId, userId, "Great post!");
```

## 🎨 Component Usage

### ProfilePage

```jsx
// Navigate programmatically
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

// Go to your profile
navigate("/profile");

// Go to specific user's profile
navigate(`/profile/${userId}`);
```

### PostUpload Modal

```jsx
import { useState } from "react";
import PostUpload from "../components/PostUpload";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Create Post</button>

      {showModal && (
        <PostUpload
          onClose={() => setShowModal(false)}
          onPostCreated={(postId) => {
            console.log("Post created:", postId);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
```

### PostGrid

```jsx
import PostGrid from '../components/PostGrid';
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  const posts = [...]; // Array of post objects

  return (
    <PostGrid
      posts={posts}
      onPostClick={(post) => navigate(`/post/${post.id}`)}
    />
  );
}
```

## 🗄️ Firestore Structure Quick Reference

```
users/
  {userId}/
    - username (string)
    - displayName (string)
    - email (string)
    - bio (string)
    - profileImage (string URL)
    - coverImages (array)
    - links (array)
    - joinedCommunities (array)
    - isPrivate (boolean)
    - postsCount, followersCount, followingCount (numbers)
    - createdAt, updatedAt (timestamps)

userPosts/
  {postId}/
    - userId (string)
    - caption (string)
    - images (array of URLs)
    - tags (array)
    - location (string)
    - likesCount, commentsCount (numbers)
    - createdAt, updatedAt (timestamps)

postComments/
  {commentId}/
    - postId (string)
    - userId (string)
    - text (string)
    - createdAt (timestamp)

postLikes/
  {likeId}/
    - postId (string)
    - userId (string)
    - createdAt (timestamp)
```

## 📦 Firebase Storage Structure

```
/profiles/
  /{userId}/
    /profile-image
    /cover-images/
      /{timestamp}-{index}

/posts/
  /{userId}/
    /{timestamp}-{index}
```

## 🛠️ Common Debugging Tips

### Check if user profile exists

```javascript
import { getUserProfile } from "../services/profileService";

const profile = await getUserProfile(userId);
if (!profile) {
  console.log("Profile not found - may need to initialize");
}
```

### Initialize profile for existing users

```javascript
import { initializeUserProfile } from "../utils/profileUtils";

await initializeUserProfile(currentUser, {
  username: "myusername",
});
```

### Check Firebase connection

```javascript
import { db, storage, auth } from "../services/firebase";

console.log("Firestore:", db);
console.log("Storage:", storage);
console.log("Auth:", auth.currentUser);
```

## 🚨 Common Issues & Solutions

### Issue: Images not uploading

**Solution:** Check Firebase Storage rules and file size limits (5MB profile, 10MB posts)

### Issue: Profile not found after signup

**Solution:** Ensure `initializeUserProfile` is called after account creation

### Issue: Can't see other user's profile

**Solution:** Check if profile is private, only owner can see private profiles

### Issue: Posts not loading

**Solution:** Verify Firestore indexes are created for userPosts collection

### Issue: Username already taken

**Solution:** Use `isUsernameAvailable()` to check before updating

## 📚 Related Documentation

- [Complete Feature Documentation](PROFILE_FEATURE_README.md)
- [Implementation Summary](PROFILE_IMPLEMENTATION_SUMMARY.md)
- [Firebase Setup Guide](FIREBASE_SETUP.md)
- [Auth Setup Guide](AUTH_SETUP_GUIDE.md)

## 🎯 File Locations

```
src/
├── services/
│   ├── profileService.js      # Profile operations
│   └── postService.js         # Post operations
├── components/
│   ├── EditProfile.jsx        # Edit profile form
│   ├── PostUpload.jsx         # Create post modal
│   └── PostGrid.jsx           # Posts grid display
├── pages/
│   ├── ProfilePage.jsx        # Profile page
│   ├── PostDetail.jsx         # Post detail view
│   └── Home.jsx               # Home with post creation
└── utils/
    └── profileUtils.js        # Helper functions
```

## ⚡ Performance Tips

1. Use pagination for large post lists
2. Lazy load images
3. Cache user profile data
4. Optimize Firestore queries with indexes
5. Compress images before upload
6. Use Firebase Storage CDN

## 🔐 Security Checklist

- [ ] Configure Firestore security rules
- [ ] Set up Storage security rules
- [ ] Validate file uploads (size, type)
- [ ] Sanitize user inputs
- [ ] Check user permissions before operations
- [ ] Implement rate limiting
- [ ] Add CAPTCHA for sensitive operations

---

**Need Help?** Check the [complete documentation](PROFILE_FEATURE_README.md) or review the [implementation summary](PROFILE_IMPLEMENTATION_SUMMARY.md).
