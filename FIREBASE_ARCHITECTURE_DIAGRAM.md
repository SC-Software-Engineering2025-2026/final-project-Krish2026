# Firebase Rules Architecture Diagram

## Role-Based Access Control Flow

```
                        Firebase User
                             |
                    isAuthenticated()?
                         /      \
                       NO        YES
                      |            |
                    DENY       Check Role
                            /    |    \
                       Creator  Admin  Member
                         |       |      |
        ┌───────────────┬┴──────┬┴────┬┘
        |               |       |     |
      Users       Communities  Chat  Posts
        |               |

    Can Read:         Can Read:
    - Own Profile     - Community Details
    - Other Profiles  - Member List

    Can Write:        Can Write:
    - Own Profile     - Community Settings (Admin+)
                      - Community Name/Desc (Admin+)
```

## Permission Decision Tree

```
User Request
├─ Authenticated?
│  └─ No → DENY ❌
│
├─ Resource is Public?
│  ├─ Yes → Allow Read ✅
│  └─ No → Continue
│
├─ User is Member of Community?
│  └─ No → DENY ❌
│
└─ Operation Type?
   ├─ READ
   │  └─ Member+ → ALLOW ✅
   │
   ├─ CREATE
   │  ├─ Collaborative Community?
   │  │  └─ Yes & Member → ALLOW ✅
   │  └─ Informational Community?
   │     └─ Admin+ → ALLOW ✅
   │
   ├─ UPDATE
   │  ├─ Is Author or Admin?
   │  │  └─ Yes → ALLOW ✅
   │  └─ No → DENY ❌
   │
   └─ DELETE
      ├─ Creator Specific Operations?
      │  └─ Creator Only → ALLOW ✅
      └─ General Content?
         ├─ Is Author or Admin?
         │  └─ Yes → ALLOW ✅
         └─ No → DENY ❌
```

## Collections Security Hierarchy

```
Level 1: Root Collections
├── /users                     [🟡 MEDIUM] Public profiles, private settings
├── /follows                   [🟡 MEDIUM] User follows (public metadata)
├── /blockedUsers              [🟡 MEDIUM] Private block lists
├── /userMessages              [🟡 MEDIUM] Private conversations
└── /communities               [🔴 HIGH]   Core community data


Level 2: Community Subcollections
├── /communities/{id}/communityMembers    [🔴 HIGH] Role mappings
├── /communities/{id}/posts               [🔴 HIGH] Community content
├── /communities/{id}/chat                [🔴 HIGH] Group conversations
├── /communities/{id}/adminChat           [🔴 HIGHEST] Admin-only
├── /communities/{id}/userToAdminMessages [🟡 MEDIUM] Support tickets
├── /communities/{id}/media               [🟡 MEDIUM] Shared files
└── /communities/{id}/settings            [🟡 MEDIUM] Config data


Level 3: Deep Nested Subcollections
├── /communities/{id}/posts/{pid}/comments     [🔴 HIGH] Post comments
├── /communities/{id}/posts/{pid}/likes        [🟡 MEDIUM] Like data
└── /userMessages/{cid}/messages               [🟡 MEDIUM] Message history
```

## Role Permission Matrix Simplified

```
┌─────────────┬──────────┬───────┬────────┐
│ Operation   │ Member   │ Admin │Creator │
├─────────────┼──────────┼───────┼────────┤
│ View Public │    ✅    │  ✅   │   ✅   │
│ View Own    │    ✅    │  ✅   │   ✅   │
│ View Admin  │    ❌    │  ✅   │   ✅   │
├─────────────┼──────────┼───────┼────────┤
│ Create Own  │    ✅*   │  ✅   │   ✅   │
│ Edit Own    │    ✅    │  ✅   │   ✅   │
│ Delete Own  │    ✅    │  ✅   │   ✅   │
├─────────────┼──────────┼───────┼────────┤
│ Edit Others │    ❌    │  ✅   │   ✅   │
│ Delete * Others │ ❌   │  ✅   │   ✅   │
│ Moderate    │    ❌    │  ✅   │   ✅   │
├─────────────┼──────────┼───────┼────────┤
│ Manage Role │    ❌    │  ✅   │   ✅   │
│ Edit Config │    ❌    │  ✅   │   ✅   │
│ Delete Comm │    ❌    │  ❌   │   ✅   │
│ Transfer OW │    ❌    │  ❌   │   ✅   │
└─────────────┴──────────┴───────┴────────┘
* Only in Collaborative mode
```

## Community Type Differences

```
COLLABORATIVE COMMUNITY          INFORMATIONAL COMMUNITY
├─ Anyone can post              ├─ Only admins post
├─ Group chat enabled           ├─ Admin-only chat
├─ Shared media                 ├─ Member→Admin messages
└─ Democratic participation     └─ Top-down information

Both Types:
├─ View permissions by privacy (public/private)
├─ Same role hierarchy (Creator, Admin, Member)
├─ Comments enabled for all members
└─ Media upload for all members
```

## Access Control by Collection

```
┌─ /users/{uid}
│  ├─ Read: Anyone authenticated ✅
│  ├─ Write: Owner only ✅
│  └─ Delete: Owner only ✅
│
├─ /communities/{cid}
│  ├─ Read: Public → All, Private → Members ✅
│  ├─ Write: Admin+ ✅
│  ├─ Delete: Creator only ✅
│  └─ /communityMembers/{uid}
│     ├─ Read: Members of community ✅
│     ├─ Write: Admin+ only ✅
│     └─ Delete: Admin+ only ✅
│
├─ /communities/{cid}/posts/{pid}
│  ├─ Read: Members ✅
│  ├─ Create: Collaborative→Members, Info→Admins ✅
│  ├─ Update: Author or Admin ✅
│  ├─ Delete: Author or Admin ✅
│  └─ /comments/{cid}
│     ├─ Read: Members ✅
│     ├─ Create: Members ✅
│     ├─ Update: Author ✅
│     └─ Delete: Author or Admin ✅
│
├─ /communities/{cid}/chat/{mid}
│  ├─ Read: Members (collab only) ✅
│  ├─ Create: Members ✅
│  ├─ Update: Author ✅
│  └─ Delete: Author or Admin ✅
│
├─ /communities/{cid}/adminChat/{mid}
│  ├─ Read: Admin+ ✅
│  ├─ Create: Admin+ ✅
│  ├─ Update: Author ✅
│  └─ Delete: Admin+ ✅
│
├─ /communities/{cid}/media/{mid}
│  ├─ Read: Members ✅
│  ├─ Create: Members ✅
│  ├─ Update: Author ✅
│  └─ Delete: Author or Admin ✅
│
├─ /communities/{cid}/settings/
│  ├─ Read: Members ✅
│  └─ Write: Admin+ ✅
│
├─ /follows/{uid}/following/{fuid}
│  ├─ Read: Anyone ✅
│  ├─ Create: Owner ✅
│  └─ Delete: Owner ✅
│
├─ /userMessages/{cid}/messages/{mid}
│  ├─ Read: Participants ✅
│  ├─ Create: Participants ✅
│  ├─ Update: Author ✅
│  └─ Delete: Author ✅
│
└─ /blockedUsers/{uid}/blockedBy/{buid}
   ├─ Read: Owner ✅
   ├─ Create: Owner ✅
   └─ Delete: Owner ✅
```

## Security Validation Stack

```
Request Incoming
      ↓
1. Authentication Check
   └─ Is user logged in?

      ↓
2. Role Determination
   └─ What is user's role in community?
   └─ Helper Functions Used:
      - isCreator()
      - isAdmin()
      - isMember()

      ↓
3. Community Type Check
   └─ Collaborative or Informational?

      ↓
4. Privacy/Visibility Check
   └─ Public or Private?
   └─ Is user member if private?

      ↓
5. Operation Authorization
   ├─ Read? → Check membership
   ├─ Create? → Check role + type
   ├─ Update? → Check ownership or admin
   └─ Delete? → Check ownership or admin

      ↓
6. Data Validation
   └─ Check required fields
   └─ Validate timestamps
   └─ Prevent data tampering

      ↓
Decision: ALLOW or DENY
```

## Threat Model & Mitigations

```
Threat Model & How Rules Mitigate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔓 PRIVILEGE ESCALATION
  └─ Threat: Non-admin promotes self to admin
  └─ Mitigation: Only admins can write to communityMembers
  └─ Result: ✅ Prevented

🔓 UNAUTHORIZED ACCESS
  └─ Threat: Non-member reads private community
  └─ Mitigation: Private communities checked against member list
  └─ Result: ✅ Prevented

🔓 ADMIN CHAT LEAK
  └─ Threat: Regular member reads admin chat
  └─ Mitigation: adminChat has isAdmin() requirement
  └─ Result: ✅ Prevented

🔓 CONTENT MANIPULATION
  └─ Threat: User deletes another's post
  └─ Mitigation: Delete requires author or admin
  └─ Result: ✅ Prevented

🔓 POSTING BYPASS
  └─ Threat: Member posts in informational community
  └─ Mitigation: Create checked against isCollaborativeCommunity
  └─ Result: ✅ Prevented

🔓 TIMESTAMP BACKDATING
  └─ Threat: User sets createdAt to past date
  └─ Mitigation: Timestamps validated against request.time
  └─ Result: ✅ Prevented

🔓 COMMUNITY DELETION
  └─ Threat: Non-creator deletes community
  └─ Mitigation: Delete requires isCreator() only
  └─ Result: ✅ Prevented
```

## Deployment Architecture

```
Source Code
├─ firestore.rules (main)
└─ Firebase Console

        ↓ Deploy

Firebase Backend
├─ Rule Engine
├─ Firestore Database
└─ Storage

        ↓ Enforce

User Applications
├─ Web App
├─ iOS App
└─ Android App
```

## Quick Deployment Workflow

```
1. Write/Update Rules
   └─ Edit firestore.rules

   ↓

2. Test Locally
   └─ firebase emulators:start
   └─ Run test scenarios

   ↓

3. Backup Existing
   └─ firebase firestore:rules:get > backup.txt

   ↓

4. Deploy
   └─ firebase deploy --only firestore:rules

   ↓

5. Verify
   └─ Check Firebase Console
   └─ Monitor error logs

   ↓

6. Monitor
   └─ Watch for permission denied errors
   └─ Adjust if needed
```

---

This architecture provides:
✅ **Defense in depth** - Multiple validation layers
✅ **Principle of least privilege** - Minimal necessary access
✅ **Fail-secure defaults** - Deny all, allow specific
✅ **Clear role separation** - Creator > Admin > Member
✅ **Audit trail ready** - All ops logged by Firebase
✅ **Scalable** - Works for any number of communities/users
