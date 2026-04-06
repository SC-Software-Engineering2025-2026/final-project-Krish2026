# User Profile Feature - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Home.jsx   │  │ProfilePage   │  │ PostDetail   │          │
│  │              │  │    .jsx      │  │    .jsx      │          │
│  │ - Welcome    │  │ - Header     │  │ - Full View  │          │
│  │ - Feed       │  │ - Posts Grid │  │ - Comments   │          │
│  │ - Actions    │  │ - Communities│  │ - Like/Share │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                       │
│         ┌─────────────────┴─────────────────┐                   │
│         │                                     │                   │
│  ┌──────▼────────┐  ┌──────────────┐  ┌────▼─────────┐         │
│  │ PostUpload    │  │ EditProfile  │  │  PostGrid    │         │
│  │    .jsx       │  │    .jsx      │  │    .jsx      │         │
│  │ - Image Upload│  │ - Form       │  │ - Grid Layout│         │
│  │ - Caption     │  │ - Validation │  │ - Hover      │         │
│  │ - Tags        │  │ - Preview    │  │ - Click      │         │
│  └───────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                        SERVICE LAYER                               │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────┐  ┌────────────────────────────┐  │
│  │   profileService.js        │  │    postService.js          │  │
│  ├────────────────────────────┤  ├────────────────────────────┤  │
│  │ • getUserProfile()         │  │ • createPost()             │  │
│  │ • createUserProfile()      │  │ • getUserPosts()           │  │
│  │ • updateUserProfile()      │  │ • getPost()                │  │
│  │ • uploadProfileImage()     │  │ • deletePost()             │  │
│  │ • uploadCoverImages()      │  │ • likePost()               │  │
│  │ • removeCoverImage()       │  │ • unlikePost()             │  │
│  │ • addProfileLink()         │  │ • addComment()             │  │
│  │ • removeProfileLink()      │  │ • getPostComments()        │  │
│  │ • toggleProfilePrivacy()   │  │ • deleteComment()          │  │
│  │ • isUsernameAvailable()    │  │ • uploadPostImages()       │  │
│  │ • joinCommunity()          │  │ • hasLikedPost()           │  │
│  │ • leaveCommunity()         │  │                            │  │
│  └────────────────────────────┘  └────────────────────────────┘  │
│                                                                     │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                      FIREBASE SERVICES                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Firestore     │  │     Storage     │  │       Auth      │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  │
│  │ Collections:    │  │ Buckets:        │  │ • Email/Pass    │  │
│  │                 │  │                 │  │ • Google        │  │
│  │ • users/        │  │ • profiles/     │  │ • Apple         │  │
│  │ • userPosts/    │  │   - images      │  │ • Phone         │  │
│  │ • postComments/ │  │   - covers      │  │                 │  │
│  │ • postLikes/    │  │                 │  │ Current User:   │  │
│  │                 │  │ • posts/        │  │ • uid           │  │
│  │ Indexes:        │  │   - images      │  │ • email         │  │
│  │ • userId+date   │  │                 │  │ • displayName   │  │
│  │ • postId+date   │  │ Rules:          │  │                 │  │
│  │                 │  │ • Auth required │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Creating a Post

```
User Action              Component              Service                Firebase
─────────────────────────────────────────────────────────────────────────

Click "Create Post"
    │
    ├──> PostUpload.jsx
    │        │
    │        │ Select images
    │        │ Enter caption
    │        │ Add tags/location
    │        │
    │        │ Submit form
    │        │
    │        ├──> postService.createPost()
    │        │        │
    │        │        ├──> uploadPostImages()
    │        │        │        │
    │        │        │        └──> Storage: /posts/{userId}/{timestamp}
    │        │        │                 │
    │        │        │                 └──> Returns image URLs
    │        │        │
    │        │        ├──> Create document in userPosts/
    │        │        │        │
    │        │        │        └──> Firestore: Save post data
    │        │        │
    │        │        └──> Update user postsCount
    │        │                 │
    │        │                 └──> Firestore: Increment count
    │        │
    │        └──> Navigate to post detail
    │
    └──> User sees new post
```

### 2. Viewing a Profile

```
User Action              Component              Service                Firebase
─────────────────────────────────────────────────────────────────────────

Navigate to /profile/:userId
    │
    ├──> ProfilePage.jsx
    │        │
    │        ├──> profileService.getUserProfile()
    │        │        │
    │        │        └──> Firestore: Query users/{userId}
    │        │                 │
    │        │                 └──> Returns profile data
    │        │
    │        ├──> postService.getUserPosts()
    │        │        │
    │        │        └──> Firestore: Query userPosts/ WHERE userId
    │        │                 │
    │        │                 └──> Returns posts array
    │        │
    │        ├──> Render profile header
    │        ├──> Render PostGrid with posts
    │        └──> Render communities
    │
    └──> User sees complete profile
```

### 3. Editing Profile

```
User Action              Component              Service                Firebase
─────────────────────────────────────────────────────────────────────────

Click "Edit Profile"
    │
    ├──> EditProfile.jsx
    │        │
    │        │ Load current profile data
    │        │
    │        │ User updates fields
    │        │
    │        │ Change username
    │        ├──> profileService.isUsernameAvailable()
    │        │        │
    │        │        └──> Firestore: Query users/ WHERE username
    │        │                 │
    │        │                 └──> Returns availability
    │        │
    │        │ Upload new profile image
    │        ├──> profileService.uploadProfileImage()
    │        │        │
    │        │        ├──> Delete old image (if exists)
    │        │        │        │
    │        │        │        └──> Storage: Delete old file
    │        │        │
    │        │        ├──> Upload new image
    │        │        │        │
    │        │        │        └──> Storage: Save to /profiles/{userId}
    │        │        │
    │        │        └──> Returns download URL
    │        │
    │        │ Save changes
    │        ├──> profileService.updateUserProfile()
    │        │        │
    │        │        └──> Firestore: Update users/{userId}
    │        │                 │
    │        │                 └──> Success
    │        │
    │        └──> Reload profile
    │
    └──> User sees updated profile
```

### 4. Liking a Post

```
User Action              Component              Service                Firebase
─────────────────────────────────────────────────────────────────────────

Click "Like" button
    │
    ├──> PostDetail.jsx
    │        │
    │        ├──> postService.likePost()
    │        │        │
    │        │        ├──> Create like document
    │        │        │        │
    │        │        │        └──> Firestore: Add to postLikes/
    │        │        │
    │        │        └──> Increment likesCount
    │        │                 │
    │        │                 └──> Firestore: Update userPosts/{postId}
    │        │
    │        └──> Update UI (heart icon red)
    │
    └──> User sees liked state
```

## Component Hierarchy

```
App.jsx
│
├── NavBar.jsx
│
├── Routes
│   │
│   ├── /
│   │   └── Home.jsx
│   │       └── PostUpload.jsx (Modal)
│   │
│   ├── /profile OR /profile/:userId
│   │   └── ProfilePage.jsx
│   │       ├── PostGrid.jsx
│   │       └── EditProfile.jsx (Conditional)
│   │
│   ├── /post/:postId
│   │   └── PostDetail.jsx
│   │
│   ├── /login
│   │   └── Login.jsx
│   │
│   ├── /signup
│   │   └── Signup.jsx
│   │
│   └── Other routes...
│
└── AuthContext (Provider)
```

## State Management

```
┌─────────────────────────────────────────┐
│         React Context API               │
├─────────────────────────────────────────┤
│  AuthContext                            │
│  ├── currentUser                        │
│  ├── login()                            │
│  ├── logout()                           │
│  ├── signup()                           │
│  └── Social auth methods                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Component Local State              │
├─────────────────────────────────────────┤
│  ProfilePage                            │
│  ├── profile (user data)                │
│  ├── posts (user's posts)               │
│  ├── loading                            │
│  └── error                              │
│                                          │
│  PostDetail                             │
│  ├── post (post data)                   │
│  ├── comments (array)                   │
│  ├── isLiked                            │
│  └── currentImageIndex                  │
│                                          │
│  EditProfile                            │
│  ├── formData                           │
│  ├── imageFiles                         │
│  ├── imagePreviews                      │
│  └── usernameError                      │
└─────────────────────────────────────────┘
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                                │
├──────────────────────────────────────────────────────────────┤
│  • File validation (size, type)                              │
│  • Username availability check                                │
│  • Form validation                                            │
│  • UI-level permission checks                                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   FIREBASE RULES                              │
├──────────────────────────────────────────────────────────────┤
│  Firestore Rules:                                             │
│  • Authentication required                                    │
│  • User can only edit own profile                            │
│  • User can only delete own posts                            │
│  • Privacy checks for private profiles                        │
│                                                               │
│  Storage Rules:                                               │
│  • Authentication required                                    │
│  • User can only upload to own folders                        │
│  • File size limits                                           │
│  • File type restrictions                                     │
└──────────────────────────────────────────────────────────────┘
```

## File Upload Flow

```
┌────────────┐
│   User     │
│ Selects    │
│   File     │
└─────┬──────┘
      │
      ▼
┌────────────────┐
│  Validation    │
│ • Size check   │  ──No──> Error Message
│ • Type check   │
└─────┬──────────┘
      │ Yes
      ▼
┌────────────────┐
│  Create        │
│  Preview       │
└─────┬──────────┘
      │
      ▼
┌────────────────┐
│  User clicks   │
│  Submit        │
└─────┬──────────┘
      │
      ▼
┌────────────────┐
│  Upload to     │
│  Firebase      │
│  Storage       │
└─────┬──────────┘
      │
      ▼
┌────────────────┐
│  Get Download  │
│  URL           │
└─────┬──────────┘
      │
      ▼
┌────────────────┐
│  Save URL to   │
│  Firestore     │
└─────┬──────────┘
      │
      ▼
┌────────────────┐
│  Success!      │
│  Show image    │
└────────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────────────────────┐
│         Error Types                      │
├─────────────────────────────────────────┤
│  Network Errors                         │
│  ├── Firebase connection                │
│  ├── Timeout                            │
│  └── Offline                            │
│                                          │
│  Validation Errors                      │
│  ├── File size                          │
│  ├── File type                          │
│  ├── Required fields                    │
│  └── Username taken                     │
│                                          │
│  Permission Errors                      │
│  ├── Not authenticated                  │
│  ├── Not authorized                     │
│  └── Private profile                    │
│                                          │
│  Data Errors                            │
│  ├── Profile not found                  │
│  ├── Post not found                     │
│  └── Invalid data                       │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│     Error Handling                       │
├─────────────────────────────────────────┤
│  1. Try-catch blocks in all async ops   │
│  2. Log errors to console               │
│  3. Show user-friendly messages         │
│  4. Provide recovery options            │
│  5. Maintain app state                  │
└─────────────────────────────────────────┘
```

## Performance Optimization Points

```
┌─────────────────────────────────────────┐
│     Current Implementation              │
├─────────────────────────────────────────┤
│  ✓ Lazy loading components (React)      │
│  ✓ Conditional rendering                │
│  ✓ Firebase pagination support          │
│  ✓ Image URL storage (not base64)       │
│  ✓ Efficient Firestore queries          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     Future Optimizations                │
├─────────────────────────────────────────┤
│  • Image compression before upload      │
│  • Lazy load images in grid             │
│  • Cache user profile data              │
│  • Implement infinite scroll            │
│  • Use Firestore real-time listeners    │
│  • CDN for static assets                │
│  • Code splitting by route              │
└─────────────────────────────────────────┘
```

---

This architecture provides a scalable, maintainable foundation for the user profile feature with clear separation of concerns and robust error handling.
