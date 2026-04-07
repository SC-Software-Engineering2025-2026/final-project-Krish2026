# Firebase Rules Quick Reference Card

## 🎯 Role Access Summary (Quick View)

```
┌─────────────────────────────────────────────────────────┐
│  ROLE HIERARCHY & KEY PERMISSIONS                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👑 CREATOR (Community Owner)                           │
│  ├─ ✅ Create community                                 │
│  ├─ ✅ Edit all settings                                │
│  ├─ ✅ Delete community                                 │
│  ├─ ✅ Transfer ownership                               │
│  ├─ ✅ Manage all members (promote/demote/remove)      │
│  ├─ ✅ Post content (any type)                          │
│  ├─ ✅ Access private admin chat                        │
│  └─ ✅ Delete any content (moderation)                  │
│                                                         │
│   👨‍💼 ADMIN (Community Manager)                         │
│  ├─ ✅ Edit settings                                    │
│  ├─ ✅ Manage members (promote/demote/remove)          │
│  ├─ ✅ Post content (any type)                          │
│  ├─ ✅ Access private admin chat                        │
│  ├─ ✅ Delete any content (moderation)                  │
│  ├─ ❌ Delete community                                 │
│  └─ ❌ Transfer ownership                               │
│                                                         │
│  👤 MEMBER (Community Participant)                      │
│  ├─ ✅ View community content                           │
│  ├─ ✅ Post (collaborative only)                        │
│  ├─ ✅ Comment on posts                                 │
│  ├─ ✅ Chat with community                              │
│  ├─ ✅ Upload media                                     │
│  ├─ ✅ Message admins (support)                         │
│  ├─ ✅ Edit own content                                 │
│  ├─ ✅ Delete own content                               │
│  ├─ ❌ Manage members                                   │
│  ├─ ❌ Edit settings                                    │
│  ├─ ❌ Access admin chat                                │
│  └─ ❌ Post in informational communities                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Collection Structure at a Glance

```
Firestore
├── users/
│   └── {userId}
│       ├── username
│       ├── displayName
│       └── profileImage
│
├── communities/
│   └── {communityId}
│       ├── name
│       ├── creatorId
│       ├── admins: []
│       ├── members: []
│       ├── isPublic: boolean
│       ├── isCollaborative: boolean
│       │
│       ├── communityMembers/
│       │   └── {userId}
│       │       └── role: "admin" | "member"
│       │
│       ├── posts/
│       │   └── {postId}
│       │       ├── userId
│       │       ├── content
│       │       └── comments/
│       │           └── {commentId}
│       │               ├── userId
│       │               └── content
│       │
│       ├── chat/
│       │   └── {messageId}
│       │       ├── userId
│       │       └── content
│       │
│       ├── adminChat/
│       │   └── {messageId}  [ADMIN ONLY]
│       │       ├── userId
│       │       └── content
│       │
│       ├── media/
│       │   └── {mediaId}
│       │       ├── userId
│       │       ├── url
│       │       └── type
│       │
│       └── settings/
│           └── {settingId}
│
├── follows/
│   └── {userId}
│       └── following/
│           └── {followedUserId}
│
├── userMessages/
│   └── {conversationId}  [user1_user2]
│       └── messages/
│           └── {messageId}
│
└── blockedUsers/
    └── {userId}
        └── blockedBy/
            └── {blockedUserId}
```

---

## 📝 Rule Pattern Quick Reference

### Authenticating Operations

```javascript
// Always check if user is authenticated
allow ... : if isAuthenticated();
```

### Owner-Only Operations

```javascript
// Only creator can access
allow ... : if isAuthenticated() && isCreator(communityId);
```

### Admin-Only Operations

```javascript
// Creator or promoted admin can access
allow ... : if isAuthenticated() && isAdmin(communityId);
```

### Member Operations

```javascript
// Any member of community
allow ... : if isAuthenticated() && isMember(communityId);
```

### Author-Only Operations

```javascript
// Users can only modify their own content
allow update, delete : if isAuthenticated() &&
  uid() == get(/documents/path/{docId}).data.userId;
```

### Public vs Private

```javascript
// Public communities everyone can read
// Private communities members only
allow read : if isAuthenticated() && (
  isPublicCommunity(communityId) || isMember(communityId)
);
```

---

## 🔒 Permission Decision Tree

```
User wants to access resource
  │
  ├─ "Is user authenticated?"
  │  └─ No → ❌ DENY
  │  └─ Yes → Continue
  │
  ├─ "Is this a public resource?"
  │  └─ Yes → ✅ ALLOW (read only)
  │  └─ No → Continue
  │
  ├─ "Is user a member of the community?"
  │  └─ No → ❌ DENY
  │  └─ Yes → Continue
  │
  ├─ "What operation is requested?"
  │  ├─ Read
  │  │  └─ ✅ ALLOW (members can read)
  │  │
  │  ├─ Create
  │  │  ├─ "Is admin?" → ✅ ALLOW
  │  │  ├─ "Is collaborative community?" → ✅ ALLOW
  │  │  └─ Otherwise → ❌ DENY
  │  │
  │  ├─ Update
  │  │  ├─ "Is author or admin?" → ✅ ALLOW
  │  │  └─ Otherwise → ❌ DENY
  │  │
  │  ├─ Delete
  │  │  ├─ "Is author or admin?" → ✅ ALLOW
  │  │  └─ Otherwise → ❌ DENY
  │
  └─ Final: Apply specific rule
```

---

## 🚀 Helper Functions (In rules)

| Function                                | Returns             | Purpose                         |
| --------------------------------------- | ------------------- | ------------------------------- |
| `isAuthenticated()`                     | boolean             | Check if user is logged in      |
| `uid()`                                 | string              | Get current user's UID          |
| `getUserRole(communityId)`              | "admin" \| "member" | Get user's role                 |
| `isCreator(communityId)`                | boolean             | Is user the owner?              |
| `isAdmin(communityId)`                  | boolean             | Is user an admin/creator?       |
| `isMember(communityId)`                 | boolean             | Is user a member/admin/creator? |
| `isPublicCommunity(communityId)`        | boolean             | Is community public?            |
| `isCollaborativeCommunity(communityId)` | boolean             | Is community collaborative?     |

---

## ⚠️ Common Mistakes to Avoid

```javascript
❌ DON'T
allow write: if true;  // Way too permissive!

✅ DO
allow write: if isAuthenticated() && isAdmin(communityId);


❌ DON'T
match /communities/{id} {
  allow read: if request.auth.uid == resource.data.creatorId;
}

✅ DO
match /communities/{id} {
  allow read: if isAuthenticated() && (
    isPublicCommunity(id) || isMember(id)
  );
}


❌ DON'T
allow delete: if get(/collections/users/$(uid())).exists();

✅ DO
allow delete: if isAuthenticated() && uid() == resource.data.userId;
// Avoid recursive lookups, use simpler checks


❌ DON'T
// Post without validation
allow create: if isAuthenticated();

✅ DO
allow create: if isAuthenticated() && (
  request.resource.data.userId == uid() &&
  request.resource.data.timestamp == request.time
);
```

---

## 📊 Testing Checklist

- [ ] Creator can delete community
- [ ] Admin cannot delete community
- [ ] Member cannot delete community
- [ ] Admin can post in informational community
- [ ] Member cannot post in informational community
- [ ] Member can post in collaborative community
- [ ] Non-member cannot access private community
- [ ] Public community accessible to anyone authenticated
- [ ] Admin-only chat blocks members
- [ ] Member-to-admin messaging works for support
- [ ] Users can only edit their own content
- [ ] Admins can moderate any content
- [ ] Media upload works for members
- [ ] Direct messaging private to participants

---

## 🚢 Deployment Checklist

```bash
# 1. Verify rules syntax
firebase firestore:rules:get > backup.txt

# 2. Start emulator
firebase emulators:start

# 3. Test all scenarios
npm run test:firestore-rules

# 4. Deploy to staging
firebase deploy --only firestore:rules --project sfera-91b35-staging

# 5. Verify in staging Firebase Console
# https://console.firebase.google.com/project/sfera-91b35-staging

# 6. Deploy to production
firebase deploy --only firestore:rules --project sfera-91b35

# 7. Verify deployment
firebase firestore:rules:get
```

---

## 🔔 Important Notes

1. **Role stored in subcollection** - User role is in `/communities/{id}/communityMembers/{uid}`
2. **Creator ID stored separately** - Helps identify ownership
3. **Admins array for quick checks** - Used to determine if user is admin
4. **Timestamps validated** - Prevents users from setting arbitrary times
5. **Fail-secure** - All operations default to deny unless explicitly allowed

---

## 📚 Further Reading

- [Firestore Security Rules Reference](https://firebase.google.com/docs/reference/rules)
- [Security Best Practices](https://firebase.google.com/docs/firestore/security/best-practices)
- [Testing Rules](https://firebase.google.com/docs/firestore/security/testing-rules)
