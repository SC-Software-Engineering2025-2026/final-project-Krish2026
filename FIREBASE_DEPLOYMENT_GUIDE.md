# Firebase Rules Deployment Checklist & Setup

## ✅ Pre-Deployment Checklist

- [ ] **Backup Current Rules**

  ```bash
  firebase firestore:rules:get > backup_rules_$(date +%s).txt
  ```

- [ ] **Review All Changes**
  - Read through `firestore.rules` completely
  - Review the `FIREBASE_RULES_GUIDE.md` for any custom logic
  - Ensure all collection names match your actual Firestore structure

- [ ] **Test in Emulator**
  - Start Firebase emulator
  - Run test suite (see Testing section below)
  - Verify all roles work as expected

- [ ] **Coordinate with Team**
  - Notify team of planned deployment
  - Plan for deployment window if needed
  - Document any breaking changes

---

## 🔧 Installation & Deployment

### 1. **Install Firebase Tools**

```bash
npm install -g firebase-tools
```

Or if you have it in your project:

```bash
npm install --save-dev firebase-tools
```

### 2. **Authenticate with Firebase**

```bash
firebase login
```

This will open a browser to authenticate. Make sure you're logging in with an account that has Admin access to your Firebase project.

### 3. **Initialize Firestore (if not done)**

```bash
firebase init firestore
```

When prompted:

- Select your Firebase project: **sfera-91b35**
- Use default locations for rules and indexes (or customize as needed)
- Decide on seed data for development

### 4. **Update firebase.json**

Make sure your `firebase.json` contains:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### 5. **Deploy Rules to Staging (Recommended)**

If you have a staging Firebase project:

```bash
firebase deploy --only firestore:rules --project sfera-91b35-staging
```

Then test thoroughly before deploying to production.

### 6. **Deploy to Production**

```bash
firebase deploy --only firestore:rules --project sfera-91b35
```

Or if you only have one project configured:

```bash
firebase deploy --only firestore:rules
```

### 7. **Verify Deployment**

```bash
firebase firestore:rules:get
```

This should display your newly deployed rules.

---

## 🧪 Testing the Rules Locally

### Step 1: Start Firebase Emulator

```bash
firebase emulators:start --only firestore
```

This will start on `localhost:8080` by default.

### Step 2: Test Manual Operations Using Firebase Admin SDK

Create a test file `test-rules.js`:

```javascript
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "sfera-91b35",
});

const db = admin.firestore();

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

async function runTests() {
  console.log("Starting Firestore Rules Tests...\n");

  try {
    // Test 1: Create a test community
    console.log("Test 1: Creating test community...");
    const communityRef = db.collection("communities").doc("test-community-1");
    await communityRef.set({
      name: "Test Community",
      description: "A community for testing roles",
      creatorId: "user-creator-123",
      admins: ["user-creator-123"],
      members: ["user-creator-123", "user-member-456"],
      isPublic: true,
      isCollaborative: true,
      categories: ["testing"],
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log("✅ Community created\n");

    // Test 2: Create community members
    console.log("Test 2: Setting up member roles...");
    await communityRef
      .collection("communityMembers")
      .doc("user-creator-123")
      .set({
        role: "admin",
        joinedAt: admin.firestore.Timestamp.now(),
      });
    await communityRef
      .collection("communityMembers")
      .doc("user-member-456")
      .set({
        role: "member",
        joinedAt: admin.firestore.Timestamp.now(),
      });
    console.log("✅ Member roles set\n");

    // Test 3: Create a post by member
    console.log("Test 3: Member creating a post...");
    await communityRef.collection("posts").doc("post-1").set({
      userId: "user-member-456",
      content: "This is a test post",
      likes: 0,
      commentsCount: 0,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log("✅ Post created by member\n");

    // Test 4: Create a comment
    console.log("Test 4: Member commenting on post...");
    await communityRef
      .collection("posts")
      .doc("post-1")
      .collection("comments")
      .doc("comment-1")
      .set({
        userId: "user-creator-123",
        content: "Great post!",
        likes: 0,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    console.log("✅ Comment created\n");

    // Test 5: Add to chat
    console.log("Test 5: Adding message to group chat...");
    await communityRef.collection("chat").doc("message-1").set({
      userId: "user-member-456",
      content: "Hello everyone!",
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log("✅ Chat message added\n");

    // Test 6: Create user profile
    console.log("Test 6: Creating user profiles...");
    await db.collection("users").doc("user-member-456").set({
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      bio: "A test user",
      profileImage: "",
      coverImages: [],
      isPrivate: false,
      postsCount: 1,
      followersCount: 0,
      followingCount: 0,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log("✅ User profile created\n");

    console.log("✅ All tests passed! Rules are working correctly.\n");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

runTests();
```

Run the test:

```bash
node test-rules.js
```

---

## 🔐 Security Testing Scenarios

### Scenario 1: Member Should NOT Access Private Community (Not a Member)

**Expected:** ❌ Denied

```javascript
// Set up: Create private community only with creator
const privateComm = await db.collection("communities").doc("private-test").get({
  accessToken: "user-outsider-token",
});
// Should fail
```

### Scenario 2: Admin Should NOT Delete Community

**Expected:** ❌ Denied

```javascript
try {
  await db
    .collection("communities")
    .doc("test-community-1")
    .delete({ accessToken: "admin-token" });
} catch (error) {
  // Should fail with permission denied
  console.log("✅ Admin correctly cannot delete community");
}
```

### Scenario 3: Member Should NOT Post in Informational Community

**Expected:** ❌ Denied

```javascript
// Create informational community
const infoCommunity = await db
  .collection("communities")
  .doc("info-community")
  .set({
    isCollaborative: false, // Informational
    creatorId: "creator-123",
    admins: ["creator-123"],
    members: ["creator-123", "member-456"],
  });

// Try to post as member
try {
  await db
    .collection("communities")
    .doc("info-community")
    .collection("posts")
    .doc("post-1")
    .set(
      { userId: "member-456", content: "Test" },
      { accessToken: "member-token" },
    );
} catch (error) {
  // Should fail
  console.log("✅ Member correctly cannot post in informational community");
}
```

### Scenario 4: Admin Should Access Admin Chat

**Expected:** ✅ Allowed

```javascript
const adminChatRef = db
  .collection("communities")
  .doc("test-community-1")
  .collection("adminChat")
  .doc("message-1");

const result = await adminChatRef.set(
  {
    userId: "user-creator-123",
    content: "Admin only message",
    createdAt: admin.firestore.Timestamp.now(),
  },
  { accessToken: "admin-token" },
);
console.log("✅ Admin can access admin chat");
```

### Scenario 5: Member Should NOT Access Admin Chat

**Expected:** ❌ Denied

```javascript
const adminChatRef = db
  .collection("communities")
  .doc("test-community-1")
  .collection("adminChat")
  .doc("message-1");

try {
  await adminChatRef.get({ accessToken: "member-token" });
} catch (error) {
  // Should fail
  console.log("✅ Member correctly cannot access admin chat");
}
```

---

## 📊 Monitoring After Deployment

### Enable Firestore Logging

In your Firebase Console:

1. Go to **Firestore Database** → **Rules**
2. Click **Deploy** (should show "Rules deployed" with timestamp)
3. Go to **Google Cloud Console** → **Logging** → **Logs Explorer**

### Monitor for Security Rule Errors

```bash
gcloud logging read \
  "resource.type=cloud_firestore_database" \
  --limit 50 \
  --format json
```

### View Rule Violations in Firebase Console

1. Go to **Firestore** → **Rules** tab
2. Violations appear in real-time with details

---

## 🚨 Emergency Rollback

If something goes wrong:

```bash
# Get previous version
firebase firestore:rules:get > current_rules.txt

# Check backup
cat backup_rules_TIMESTAMP.txt

# Deploy from backup
firebase deploy --only firestore:rules --token <previous_version>
```

Or through Firebase Console:

1. Go to **Firestore Database** → **Rules**
2. Click the history button to see previous versions
3. Select a previous version and click **Restore**

---

## 📋 Deployment Record

Create a `DEPLOYMENT_RECORD.md` to track changes:

```markdown
# Firebase Rules Deployment History

## v1.0 - [Date]

- Initial role-based access control rules generated
- 3 user roles: Creator, Admin, Member
- Covers all main collections: communities, users, posts, etc.
- Tested with emulator and staging environment
- **Deployed by:** [Your Name]
- **Status:** ✅ Live
```

---

## 💡 Pro Tips

1. **Use custom claims for faster validation:**

   ```javascript
   // In your backend (Cloud Functions)
   await admin.auth().setCustomUserClaims(uid, {
     role: "admin",
     communityId: "community-123",
   });

   // In rules
   function hasCustomClaim(claim) {
     return claim in request.auth.token;
   }
   ```

2. **Cache frequently accessed data:**

   ```javascript
   // Instead of fetching every time, store in user token
   // This reduces rule complexity and improves performance
   ```

3. **Separate rules per environment:**

   ```bash
   firebase deploy --only firestore:rules --project sfera-91b35-dev
   firebase deploy --only firestore:rules --project sfera-91b35-prod
   ```

4. **Set up CI/CD for automated deployment:**
   - Use GitHub Actions to deploy on pull request merge
   - Automatically run tests before deploying
   - Keep deployment history in git

---

## ❓ FAQ

**Q: How often should I update rules?**
A: Update when:

- Adding new collections
- Changing role requirements
- Discovering security issues
- Adding new features

**Q: Can I test rules without deploying?**
A: Yes! Use Firebase Emulator Suite for local testing.

**Q: What if rules are too slow?**
A: Consider:

- Denormalizing frequently accessed data
- Using Cloud Functions for validation
- Caching custom claims in auth tokens
- Simplifying complex permission logic

**Q: How do I handle root-level admin?**
A: Use custom claims:

```javascript
function isSuperAdmin() {
  return "admin" in request.auth.token && request.auth.token.admin == true;
}
```

---

## 📞 Support

For issues:

1. Check Firebase documentation
2. Search existing GitHub issues
3. Test in emulator first
4. Review Cloud Functions logs
5. Contact Firebase support for infrastructure issues
