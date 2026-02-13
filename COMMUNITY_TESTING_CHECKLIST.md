# Community Feature Testing Checklist

Use this checklist to verify all community features are working correctly.

## 🏗️ Community Creation

### Basic Creation

- [ ] Open Communities page
- [ ] Click "Create Community" button
- [ ] Modal opens successfully
- [ ] Fill in community name (min 3 characters)
- [ ] Add description (optional, max 500 chars)
- [ ] Upload community image
- [ ] Image preview displays correctly
- [ ] Character counters update correctly

### Privacy Settings

- [ ] Toggle Public/Private switch
- [ ] Switch animates smoothly
- [ ] Description text updates based on selection
- [ ] Default is set to Public

### Community Type

- [ ] Toggle Collaborative/Informational switch
- [ ] Switch animates smoothly
- [ ] Features list updates based on selection
- [ ] Default is set to Collaborative

### Form Validation

- [ ] Submit without name shows error
- [ ] Name less than 3 chars shows error
- [ ] Description over 500 chars shows error
- [ ] Image over 5MB shows error
- [ ] Success creates community and redirects

## 📋 Collaborative Communities

### Home Page

- [ ] View empty home page message
- [ ] Admin sees "Edit Page" button
- [ ] Non-admin doesn't see "Edit Page" button
- [ ] Click "Edit Page" shows ReactQuill editor
- [ ] Add text, images, links, formatting
- [ ] "Save Changes" updates content
- [ ] "Cancel" discards changes
- [ ] Saved content displays correctly
- [ ] Non-admin views formatted content

### Posts Feed

- [ ] View empty posts message
- [ ] See filter buttons (All, Images, Videos, Text)
- [ ] Member sees "Create Post" button
- [ ] Click "Create Post" opens modal
- [ ] Write post content
- [ ] Add up to 4 images
- [ ] Remove uploaded images
- [ ] Submit creates post
- [ ] Post appears in feed immediately
- [ ] Like button toggles correctly
- [ ] Like count updates
- [ ] Click "Comment" opens comments modal
- [ ] Write and submit comment
- [ ] Comment appears immediately
- [ ] Comments count updates
- [ ] Filter posts by type works correctly

### Group Chat

- [ ] Chat area loads with member list
- [ ] Type and send text message
- [ ] Message appears immediately
- [ ] Click image upload button
- [ ] Upload image (under 5MB)
- [ ] Image message sends and displays
- [ ] Messages show timestamps
- [ ] Auto-scrolls to latest message
- [ ] Member list shows roles (Admin badge)
- [ ] Toggle member list visibility (mobile)

### Media Library

- [ ] View empty library message
- [ ] See filter buttons (All, Photos, Videos)
- [ ] Click "Upload" button
- [ ] Select multiple files
- [ ] Files upload with progress
- [ ] Media appears in grid
- [ ] Filter by photos/videos works
- [ ] Click media opens full-screen viewer
- [ ] Delete own media works
- [ ] Admin can delete any media
- [ ] Viewer shows upload date

## 📰 Informational Communities

### Home Page

- [ ] Non-admin sees info banner about admin-only editing
- [ ] View empty home page message
- [ ] Admin sees "Edit Page" button
- [ ] Edit functionality same as collaborative
- [ ] Non-admin cannot edit

### Posts Feed

- [ ] Non-admin sees info banner about admin-only posting
- [ ] Non-admin doesn't see "Create Post" button
- [ ] Admin sees "Create Post" button
- [ ] Admin can create posts
- [ ] Posts show "Admin" badge on author
- [ ] All members can like posts
- [ ] All members can comment
- [ ] Filter posts works correctly

### Admin Chat

- [ ] Only accessible by admins
- [ ] Purple-themed UI displays
- [ ] Info banner explains private chat
- [ ] Send text messages
- [ ] Upload and send images
- [ ] Messages show timestamps
- [ ] Real-time updates work
- [ ] Non-admin cannot access (redirect)

### User-to-Admin Messaging

- [ ] Member sees info banner
- [ ] Member can write message
- [ ] Message sends successfully
- [ ] Member sees only their messages
- [ ] Admin sees all member messages
- [ ] New messages show "New" badge
- [ ] Messages show sender info
- [ ] Messages show timestamps
- [ ] Admin tab shows "Member Messages"

## ⚙️ Community Settings

### General Settings (Admin Only)

- [ ] Non-admin sees "Leave Community" button only
- [ ] Admin sees full settings interface
- [ ] Edit community name
- [ ] Edit description
- [ ] Toggle public/private
- [ ] Community type shows as read-only
- [ ] Character limits enforced
- [ ] "Save Changes" updates community
- [ ] Changes reflect immediately

### Members Management (Admin Only)

- [ ] Member list loads correctly
- [ ] Search members works
- [ ] Members show roles (Creator, Admin, Member)
- [ ] Members show join dates
- [ ] Current user shows as "You"
- [ ] Click "Promote to Admin" on member
- [ ] Confirmation dialog appears
- [ ] Member promoted successfully
- [ ] Role updates in UI immediately
- [ ] Click "Remove" on member
- [ ] Confirmation dialog appears
- [ ] Member removed successfully
- [ ] Cannot remove creator
- [ ] Cannot remove self

### Danger Zone (Creator Only)

- [ ] Only creator sees "Danger Zone"
- [ ] "Delete Community" button visible
- [ ] Click shows confirmation
- [ ] Cancel keeps community
- [ ] Confirm deletes community
- [ ] Redirects to communities list
- [ ] Community no longer accessible

## 🔐 Permission Tests

### Non-Member Access

- [ ] Public community shows preview
- [ ] Can see name, description, member count
- [ ] "Join Community" button visible
- [ ] Cannot access posts, chat, media
- [ ] Private community shows locked message
- [ ] Cannot join private community directly

### Member Permissions (Collaborative)

- [ ] Can view all content
- [ ] Can create posts
- [ ] Can comment on posts
- [ ] Can like posts
- [ ] Can use group chat
- [ ] Can upload to media library
- [ ] Cannot edit home page
- [ ] Cannot access settings
- [ ] Cannot promote/remove members

### Member Permissions (Informational)

- [ ] Can view all content
- [ ] Cannot create posts
- [ ] Can comment on posts
- [ ] Can like posts
- [ ] Can message admins
- [ ] Cannot access admin chat
- [ ] Cannot edit home page
- [ ] Cannot access settings

### Admin Permissions

- [ ] Can do everything members can
- [ ] Can edit home page
- [ ] Can create posts (both types)
- [ ] Can access admin chat (informational)
- [ ] Can see user messages (informational)
- [ ] Can promote members
- [ ] Can remove members
- [ ] Can edit community settings
- [ ] Cannot delete community (unless creator)

### Creator Permissions

- [ ] Has all admin permissions
- [ ] Can delete community
- [ ] Cannot be removed
- [ ] Cannot leave community
- [ ] Shown as "Creator" in member list

## 🔄 Real-time Updates

### Community Updates

- [ ] Member count updates when someone joins
- [ ] Community info updates when edited
- [ ] Changes visible to all members instantly

### Posts & Comments

- [ ] New posts appear without refresh
- [ ] Like counts update in real-time
- [ ] New comments appear instantly
- [ ] Comment counts update automatically

### Chat Messages

- [ ] Messages appear immediately after sending
- [ ] Other users' messages appear instantly
- [ ] Image messages load and display
- [ ] Scroll position maintained

### Member Changes

- [ ] New members appear in list
- [ ] Role changes reflect immediately
- [ ] Removed members disappear from list
- [ ] Member count updates

## 🎨 UI/UX Tests

### Responsive Design

- [ ] Mobile view displays correctly
- [ ] Tablet view displays correctly
- [ ] Desktop view displays correctly
- [ ] Navigation tabs scroll horizontally on mobile
- [ ] Member sidebar toggles on mobile
- [ ] Modals are scrollable on small screens
- [ ] Images scale appropriately

### Loading States

- [ ] Community page shows spinner while loading
- [ ] Posts show loading indicator
- [ ] Chat shows loading when fetching messages
- [ ] Media library shows loading state
- [ ] "Joining..." state on join button
- [ ] "Saving..." state on save buttons
- [ ] "Uploading..." state on uploads

### Error Handling

- [ ] Form validation shows clear errors
- [ ] Network errors show user-friendly messages
- [ ] Permission errors redirect appropriately
- [ ] File size errors prevent upload
- [ ] Missing data shows helpful messages
- [ ] 404 for non-existent communities

### Navigation

- [ ] Tabs switch correctly
- [ ] Back button returns to communities list
- [ ] Links navigate to correct pages
- [ ] Browser back/forward works
- [ ] URL updates with tab changes
- [ ] Refresh maintains current tab

## 🐛 Edge Cases

### Community Creation

- [ ] Special characters in name handled
- [ ] Very long descriptions work
- [ ] No image still allows creation
- [ ] Duplicate names allowed (no uniqueness check)

### Membership

- [ ] Already a member cannot rejoin
- [ ] Removed member cannot access
- [ ] Creator cannot leave
- [ ] Last admin can leave (if not creator)

### Content

- [ ] Empty posts not allowed
- [ ] Empty comments not allowed
- [ ] Empty messages not allowed
- [ ] Large images handled gracefully
- [ ] Video playback works

### Permissions

- [ ] Logged out users redirect to login
- [ ] Non-members see appropriate message
- [ ] Demoted admin loses access immediately
- [ ] Removed member redirected appropriately

## 📊 Performance

- [ ] Community list loads quickly
- [ ] Individual community loads fast
- [ ] Posts feed loads efficiently
- [ ] Chat messages render smoothly
- [ ] Media library grid renders well
- [ ] No memory leaks from listeners
- [ ] Cleanup on component unmount works

## ✅ Final Verification

- [ ] All TypeScript/JavaScript errors resolved
- [ ] No console errors in browser
- [ ] All images display correctly
- [ ] All links work correctly
- [ ] All forms submit successfully
- [ ] All real-time features working
- [ ] Mobile experience is smooth
- [ ] Permissions enforced correctly
- [ ] Data persists after refresh
- [ ] App still runs with `npm start`

---

## Testing Notes

**Test Environment:**

- Browser: ********\_********
- Device: ********\_********
- Date: ********\_********

**Issues Found:**

1.
2.
3.

**Additional Comments:**

---

**Status:** [ ] Passed | [ ] Failed | [ ] Needs Review
