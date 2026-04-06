# User Profile Feature - Implementation Guide

## Overview

This document describes the implementation of the User Profile feature (Phase 2, Feature 6) for the Sfera social media platform.

## Components Created

### 1. Service Layer

#### **profileService.js** (`/src/services/profileService.js`)

Handles all user profile-related operations:

- `getUserProfile(userId)` - Fetch user profile data
- `createUserProfile(userId, profileData)` - Create new user profile
- `updateUserProfile(userId, data)` - Update profile information
- `uploadProfileImage(userId, file)` - Upload and update profile picture
- `uploadCoverImages(userId, files)` - Upload multiple cover images
- `removeCoverImage(userId, imageUrl)` - Remove a cover image
- `addProfileLink(userId, link)` - Add social/website links
- `removeProfileLink(userId, link)` - Remove links
- `toggleProfilePrivacy(userId, isPrivate)` - Toggle profile privacy
- `isUsernameAvailable(username, currentUserId)` - Check username availability
- `joinCommunity(userId, communityId)` - Join a community
- `leaveCommunity(userId, communityId)` - Leave a community

#### **postService.js** (`/src/services/postService.js`)

Handles all post-related operations:

- `createPost(userId, postData, images)` - Create a new post with images
- `uploadPostImages(userId, files)` - Upload post images to Firebase Storage
- `getUserPosts(userId, limitCount, lastDoc)` - Get user's posts with pagination
- `getPost(postId)` - Get single post by ID
- `updatePost(postId, data)` - Update post information
- `deletePost(postId, userId)` - Delete post and associated data
- `likePost(postId, userId)` - Like a post
- `unlikePost(postId, userId)` - Unlike a post
- `hasLikedPost(postId, userId)` - Check if user liked a post
- `addComment(postId, userId, text)` - Add comment to post
- `getPostComments(postId, limitCount)` - Get post comments
- `deleteComment(commentId, postId)` - Delete a comment
- `deletePostComments(postId)` - Delete all comments for a post

### 2. UI Components

#### **ProfilePage.jsx** (`/src/pages/ProfilePage.jsx`)

Main profile page component featuring:

- Profile header with image, name, username, bio
- User statistics (posts, followers, following)
- Cover images carousel
- Social/website links
- Privacy toggle (public/private)
- Edit profile button (own profile only)
- Tabs for Posts and Communities
- Photo grid of user's posts
- List of joined communities

**Key Features:**

- Dynamic loading based on userId parameter or current user
- Privacy checking for private profiles
- Responsive design with mobile support
- Loading states and error handling

#### **EditProfile.jsx** (`/src/components/EditProfile.jsx`)

Profile editing component with:

- Profile picture upload with preview
- Display name and username fields
- Real-time username availability checking
- Bio text area (500 character limit)
- Multiple cover image uploads (max 5)
- Link management (add/remove social links)
- Form validation
- Loading states during uploads

**Features:**

- Image file validation (size limits, type checking)
- Username uniqueness validation
- Preview of images before upload
- Ability to remove cover images
- Cancel and save functionality

#### **PostUpload.jsx** (`/src/components/PostUpload.jsx`)

Post creation modal component with:

- Multi-image upload (up to 10 images)
- Image preview with removal option
- Caption text area (2200 character limit)
- Location field
- Tags input (comma-separated)
- First image marked as cover
- Upload progress indication

**Features:**

- File validation (size, type)
- Image preview with delete functionality
- Modal overlay design
- Responsive layout

#### **PostGrid.jsx** (`/src/components/PostGrid.jsx`)

Grid display component for posts:

- Responsive grid layout (1-3 columns)
- Square aspect ratio images
- Hover overlay with likes/comments count
- Multiple images indicator
- Caption preview on hover
- Click to view post detail

#### **PostDetail.jsx** (`/src/pages/PostDetail.jsx`)

Full post view component featuring:

- Full-size image display with navigation
- Image carousel (previous/next)
- Post caption and metadata
- Location and tags display
- Like/unlike functionality
- Comments section
- Add new comments
- Delete comments (own or post owner)
- Delete post (owner only)
- Author information with profile link
- Timestamp formatting

**Features:**

- Interactive image carousel
- Real-time like updates
- Comment system with author info
- Responsive two-column layout (image + content)
- Delete confirmation dialogs

### 3. Updated Components

#### **Home.jsx** (`/src/pages/Home.jsx`)

Updated home page with:

- Welcome section for logged-in users
- Create post button
- Quick action cards (Profile, Communities, Discover)
- Feed section placeholder
- Post upload modal integration
- Features section for non-authenticated users

#### **App.jsx** (`/src/App.jsx`)

Added new routes:

- `/profile` - Current user's profile
- `/profile/:userId` - Specific user profile
- `/post/:postId` - Post detail view

## Firestore Collections Structure

### users/

```javascript
{
  username: string,
  displayName: string,
  email: string,
  bio: string,
  profileImage: string (URL),
  coverImages: array of strings (URLs),
  links: array of {title: string, url: string},
  joinedCommunities: array of strings (community IDs),
  isPrivate: boolean,
  postsCount: number,
  followersCount: number,
  followingCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### userPosts/

```javascript
{
  userId: string,
  caption: string,
  images: array of strings (URLs),
  tags: array of strings,
  location: string,
  likesCount: number,
  commentsCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### postLikes/

```javascript
{
  postId: string,
  userId: string,
  createdAt: timestamp
}
```

### postComments/

```javascript
{
  postId: string,
  userId: string,
  text: string,
  createdAt: timestamp
}
```

## Firebase Storage Structure

```
profiles/
  {userId}/
    profile-image (user's profile picture)
    cover-images/
      {timestamp}-{index} (cover images)

posts/
  {userId}/
    {timestamp}-{index} (post images)
```

## Features Implemented

### Profile Management

✅ View user profiles
✅ Edit profile information
✅ Upload profile picture
✅ Upload multiple cover images
✅ Add/remove social links
✅ Toggle profile privacy
✅ Username availability checking
✅ Join/leave communities

### Post Management

✅ Create posts with multiple images
✅ Upload images to Firebase Storage
✅ View post grid on profile
✅ View individual post details
✅ Delete posts
✅ Edit post information
✅ Add captions, locations, and tags

### Social Features

✅ Like/unlike posts
✅ Comment on posts
✅ Delete comments
✅ View post engagement stats
✅ Image carousel for multiple photos

### UI/UX Features

✅ Responsive design (mobile, tablet, desktop)
✅ Loading states
✅ Error handling
✅ Image previews
✅ Form validation
✅ Hover effects and transitions
✅ Modal dialogs
✅ Privacy controls

## Usage Instructions

### Viewing a Profile

1. Navigate to `/profile` to view your own profile
2. Navigate to `/profile/:userId` to view another user's profile
3. Click on username/avatar anywhere in the app

### Editing Your Profile

1. Go to your profile page
2. Click the settings icon (⚙️) next to your name
3. Update fields as desired
4. Upload new images
5. Add or remove links
6. Click "Save Changes"

### Creating a Post

1. Click "Create Post" button on home page
2. Upload 1-10 images
3. Add a caption (optional)
4. Add location (optional)
5. Add tags separated by commas (optional)
6. Click "Share Post"

### Viewing and Interacting with Posts

1. Click any post in the grid to view details
2. Click ❤️ to like/unlike
3. Type a comment and press send
4. Navigate through images using arrows
5. Click author's name to view their profile

### Privacy Settings

1. Go to your profile
2. Click the privacy toggle button
3. Private profiles are only visible to you
4. Public profiles are visible to everyone

## Dependencies

- **React** (^18.3.1) - UI framework
- **React Router** (^6.22.0) - Navigation
- **Firebase** (^10.8.0) - Backend services
- **Heroicons** (^2.1.1) - Icons
- **date-fns** (^3.3.1) - Date formatting
- **Tailwind CSS** (^3.4.1) - Styling

## Next Steps

### Potential Enhancements

- [ ] Follow/unfollow functionality
- [ ] Activity feed with followed users' posts
- [ ] Search users by username
- [ ] Post sharing
- [ ] Save/bookmark posts
- [ ] Edit posts after creation
- [ ] Video support
- [ ] Stories feature
- [ ] Profile themes
- [ ] Verified badges
- [ ] Block/report users
- [ ] Post analytics

### Performance Optimizations

- [ ] Implement pagination for posts
- [ ] Lazy loading for images
- [ ] Cache user profiles
- [ ] Optimize Firebase queries
- [ ] Implement infinite scroll

### Testing

- [ ] Unit tests for service functions
- [ ] Integration tests for components
- [ ] E2E tests for user flows
- [ ] Performance testing
- [ ] Accessibility testing

## Troubleshooting

### Images not uploading

- Check Firebase Storage rules
- Verify file size limits (10MB for posts, 5MB for profile)
- Ensure proper CORS configuration

### Profile not loading

- Check Firestore security rules
- Verify user authentication
- Check browser console for errors

### Comments not appearing

- Verify Firestore indexes are created
- Check that postComments collection exists
- Ensure proper read permissions

## Security Considerations

- Profile images and posts stored in Firebase Storage with proper security rules
- Private profiles only accessible by owner
- Users can only edit their own profiles and posts
- Comment deletion allowed only by author or post owner
- File upload validation on client side
- Firestore security rules should be configured for production

## Conclusion

The User Profile feature is now fully implemented with comprehensive functionality for profile management, post creation, and social interactions. All components follow React best practices and include proper error handling and loading states.
