# Firebase Firestore Rules Guide - Sfera Community App

## 📋 Overview

This document explains the Firestore security rules implemented for the Sfera community app. The rules enforce role-based access control (RBAC) with three user roles:

- **Creator**: Community owner with full permissions
- **Admin**: Community manager with most permissions (except delete/transfer)
- **Member**: Regular community participant with limited permissions

---

## 🔐 Role Hierarchy & Permissions Matrix

### Complete Permission Matrix

| Feature                      |  Member  |  Admin   | Creator  |
| ---------------------------- | :------: | :------: | :------: |
| **View Public Communities**  |    ✅    |    ✅    |    ✅    |
| **View Private Communities** |   ✅\*   |   ✅\*   |   ✅\*   |
| **Read Posts**               |   ✅\*   |   ✅\*   |   ✅\*   |
| **Create Posts**             |  ✅\*\*  |    ✅    |    ✅    |
| **Edit Own Posts**           |    ✅    |    ✅    |    ✅    |
| **Delete Own Posts**         |    ✅    |    ✅    |    ✅    |
| **Delete Any Posts**         |    ❌    |    ✅    |    ✅    |
| **Comment on Posts**         |   ✅\*   |   ✅\*   |   ✅\*   |
| **Edit Own Comments**        |    ✅    |    ✅    |    ✅    |
| **Delete Own Comments**      |    ✅    |    ✅    |    ✅    |
| **Delete Any Comments**      |    ❌    |    ✅    |    ✅    |
| **Like Posts/Comments**      |   ✅\*   |   ✅\*   |   ✅\*   |
| **Access Group Chat**        | ✅\*\*\* | ✅\*\*\* | ✅\*\*\* |
| **Upload Media**             |   ✅\*   |   ✅\*   |   ✅\*   |
| **Delete Own Media**         |    ✅    |    ✅    |    ✅    |
| **Delete Any Media**         |    ❌    |    ✅    |    ✅    |
| **Access Admin Chat**        |    ❌    |    ✅    |    ✅    |
| **Message Admins**           |   ✅\*   |   ✅\*   |   ✅\*   |
| **View Members List**        |    ✅    |    ✅    |    ✅    |
| **Promote/Demote Members**   |    ❌    |    ✅    |    ✅    |
| **Remove Members**           |    ❌    |    ✅    |    ✅    |
| **Edit Settings**            |    ❌    |    ✅    |    ✅    |
| **Delete Community**         |    ❌    |    ❌    |    ✅    |
| **Transfer Ownership**       |    ❌    |    ❌    |    ✅    |

**Legend:**

- ✅ = Full Access
- ❌ = No Access
- ✅\* = Members only (private communities)
- ✅\*\* = Only in collaborative communities; admins can always post
- ✅\*\*\* = Only in collaborative communities

---

## 📁 Firestore Structure & Rules Breakdown

### 1. **Users Collection** (`/users/{userId}`)

**Document Structure:**

```json
{
  "username": "string",
  "displayName": "string",
  "email": "string",
  "bio": "string",
  "profileImage": "string (URL)",
  "coverImages": ["string (URL)"],
  "isPrivate": "boolean",
  "postsCount": 0,
  "followersCount": 0,
  "followingCount": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Rules:**

```
✅ Read: Anyone authenticated
✅ Write: Only own document
```

**Rationale:** User profiles should be readable by everyone to display public information, but each user can only modify their own profile.

---

### 2. **Communities Collection** (`/communities/{communityId}`)

**Document Structure:**

```json
{
  "name": "string",
  "description": "string",
  "creatorId": "string (uid)",
  "admins": ["string (uid)"],
  "members": ["string (uid)"],
  "isPublic": "boolean",
  "isCollaborative": "boolean",
  "categories": ["string"],
  "communityImage": "string (URL)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Rules:**

```
✅ Read:
   - Public communities: Anyone authenticated
   - Private communities: Members only

✅ Write:
   - Admins and creators

❌ Delete:
   - Creators only
```

**Rationale:**

- Public communities visible to all
- Private communities restricted to members
- Writing limited to admins to prevent unauthorized modifications
- Deletion limited to creator to prevent accidental loss

---

### 3. **Community Members Subcollection** (`/communities/{communityId}/communityMembers/{userId}`)

**Document Structure:**

```json
{
  "role": "admin|member",
  "joinedAt": "timestamp"
}
```

**Rules:**

```
✅ Read:
   - Any community member (to see who is member/admin)

✅ Write/Delete:
   - Admins only (promote, demote, add, remove)
```

**Rationale:**

- Members should see the role structure (who is admin)
- Only admins can modify member roles and removal
- Prevents unauthorized role escalation

---

### 4. **Posts Subcollection** (`/communities/{communityId}/posts/{postId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "content": "string",
  "likes": 0,
  "commentsCount": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Rules:**

```
✅ Read:
   - Public communities: Anyone authenticated
   - Private communities: Members only

✅ Create:
   - COLLABORATIVE: All members
   - INFORMATIONAL: Admins only

✅ Update:
   - Authors can edit own posts
   - Admins can edit any

❌ Delete:
   - Authors can delete own
   - Admins can delete any
```

**Rationale:**

- Collaborative communities allow all members to post
- Informational communities restrict posting to admins
- Users should control their own content
- Admins have moderation rights

---

### 5. **Comments Subcollection** (`/communities/{communityId}/posts/{postId}/comments/{commentId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "content": "string",
  "likes": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Rules:**

```
✅ Create/Read:
   - Members only

✅ Update:
   - Authors only

✅ Delete:
   - Authors or admins
```

**Rationale:**

- Only community members can comment
- Users control their own comments
- Admins can moderate inappropriate comments

---

### 6. **Community Chat** (`/communities/{communityId}/chat/{messageId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "content": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Rules:**

```
✅ Read/Create/Update:
   - Members only (collaborative communities)

✅ Delete:
   - Authors or admins
```

**Rationale:**

- Real-time group messaging for collaborative communities
- Members can chat freely
- Admins can moderate inappropriate messages

---

### 7. **Admin Chat** (`/communities/{communityId}/adminChat/{messageId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "content": "string",
  "createdAt": "timestamp"
}
```

**Rules:**

```
✅ Read/Create/Delete:
   - Admins only
```

**Rationale:**

- Private channel for community admins
- Completely restricted to admin/creator access
- Used for admin coordination in informational communities

---

### 8. **User-to-Admin Messaging** (`/communities/{communityId}/userToAdminMessages/{messageId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "content": "string",
  "createdAt": "timestamp"
}
```

**Rules:**

```
✅ Read:
   - All members (to see all support tickets)

✅ Create:
   - Members (support requests)

✅ Update/Delete:
   - Authors or admins
```

**Rationale:**

- Members can contact admins
- Members can see all support conversations
- Admins have full access for support and moderation

---

### 9. **Media Subcollection** (`/communities/{communityId}/media/{mediaId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "url": "string (Cloud Storage path)",
  "type": "image|video|document",
  "uploadedAt": "timestamp"
}
```

**Rules:**

```
✅ Read/Create:
   - Members only

✅ Update/Delete:
   - Authors or admins
```

**Rationale:**

- Shared media library for collaborative communities
- All members can contribute and access media
- Authors control their media, admins can moderate

---

### 10. **Community Settings** (`/communities/{communityId}/settings/{document}`)

**Rules:**

```
✅ Read:
   - Members (view settings)

✅ Write:
   - Admins only (modify settings)
```

**Rationale:**

- Settings (name, description, privacy) controlled by admins
- Members can view current settings

---

### 11. **Follows Collection** (`/follows/{userId}/following/{followedUserId}`)

**Document Structure:**

```json
{
  "followedAt": "timestamp"
}
```

**Rules:**

```
✅ Read:
   - Anyone authenticated

✅ Create/Delete:
   - User can only manage own follows
```

**Rationale:**

- Anyone can see who is following whom
- Users fully control their own follow relationships

---

### 12. **Direct Messages** (`/userMessages/{conversationId}/messages/{messageId}`)

**Document Structure:**

```json
{
  "userId": "string (uid)",
  "content": "string",
  "createdAt": "timestamp"
}
```

**Rules:**

```
✅ Read/Create:
   - Participants in conversation only

✅ Update/Delete:
   - Message author only
```

**Rationale:**

- Conversation ID is typically `userId1_userId2` (sorted)
- Only participants in the conversation can access
- Users control their own messages

---

### 13. **Blocked Users** (`/blockedUsers/{userId}/blockedBy/{blockedUserId}`)

**Document Structure:**

```json
{
  "blockedAt": "timestamp"
}
```

**Rules:**

```
✅ Read:
   - User only (their own block list)

✅ Create/Delete:
   - User only (manage own blocks)
```

**Rationale:**

- Privacy: only users see who they blocked
- Users have full control over their block list

---

## 🚀 Deployment Instructions

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase (if not already done)

```bash
firebase init firestore
```

### Step 4: Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Step 5: Verify Deployment

```bash
firebase firestore:rules:list
```

---

## 🧪 Testing the Rules

### Using Firebase Emulator

**Start Emulator:**

```bash
firebase emulators:start
```

**Common Test Cases:**

1. **Non-member accessing private community** → ❌ Denied
2. **Member accessing public community** → ✅ Allowed
3. **Member posting in informational community** → ❌ Denied
4. **Admin posting in informational community** → ✅ Allowed
5. **Member deleting another's post** → ❌ Denied
6. **Admin deleting member's post** → ✅ Allowed
7. **Non-admin accessing admin chat** → ❌ Denied
8. **Member editing another's comment** → ❌ Denied

---

## ⚙️ Security Best Practices

1. **Never hardcode UIDs** - Use `request.auth.uid` to access current user
2. **Always validate timestamps** - Prevent users from setting arbitrary creation times
3. **Regularly audit rules** - Review for privilege escalation issues
4. **Use subcollections** - Better performance and cleaner permission structure
5. **Fail secure** - Default deny all, then allow specific actions
6. **Document decisions** - Include rationale for each rule (as done above)

---

## 🐛 Troubleshooting Common Issues

### Issue: "Permission denied" on operations that should work

**Solution:**

- Check that `request.auth.uid` is being set (user is authenticated)
- Verify the user has the correct role in the community
- Check document structure matches what rules expect

### Issue: Rules too permissive

**Solution:**

- Review defaults - all rules end with implicit deny
- Add additional validation to `create` operations (e.g., check required fields)
- Use functions to centralize repeated logic

### Issue: Performance issues with rule evaluation

**Solution:**

- Avoid deep recursion in helper functions
- Cache data lookups when possible
- Consider denormalizing data (e.g., store role in user document)

---

## 📝 Rule Update Workflow

When adding new features:

1. **Document the collection structure** in this guide
2. **Identify who should access** - determine role requirements
3. **Write the rules** following the pattern established
4. **Test with emulator** - validate all scenarios
5. **Deploy to staging** - test in real Firebase
6. **Deploy to production** - after validation
7. **Monitor and audit** - review security logs

---

## 🔗 References

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Best Practices for Rules](https://firebase.google.com/docs/firestore/security/best-practices)
- [Emulator Suite Guide](https://firebase.google.com/docs/emulator-suite/install_and_manage)
