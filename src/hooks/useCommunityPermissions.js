import { useState, useEffect } from "react";
import { getUserRole, isMember } from "../services/communityService";

/**
 * Hook to get user's role in a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @returns {Object} { role, loading, isAdmin, isMember }
 */
export const useCommunityRole = (communityId, userId) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      if (!communityId || !userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userRole = await getUserRole(communityId, userId);
        if (isMounted) {
          setRole(userRole);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        if (isMounted) {
          setRole(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [communityId, userId]);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isMember: role !== null,
  };
};

/**
 * Hook to check if user is a member of a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @returns {Object} { isMember, loading, checkMembership }
 */
export const useIsMember = (communityId, userId) => {
  const [memberStatus, setMemberStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMembership = async () => {
    if (!communityId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await isMember(communityId, userId);
      setMemberStatus(status);
    } catch (error) {
      console.error("Error checking membership:", error);
      setMemberStatus(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMembership();
  }, [communityId, userId]);

  return {
    isMember: memberStatus,
    loading,
    checkMembership, // Allow manual refresh
  };
};

/**
 * Hook to check if user has permission to perform an action
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @param {Object} community - Community object
 * @returns {Object} Permission flags
 */
export const useCommunityPermissions = (communityId, userId, community) => {
  const {
    role,
    isAdmin,
    isMember: userIsMember,
    loading,
  } = useCommunityRole(communityId, userId);

  const permissions = {
    canPost: false,
    canEdit: false,
    canDelete: false,
    canManageMembers: false,
    canManageSettings: false,
    canAccessAdminChat: false,
    canViewContent: false,
  };

  if (loading || !community) {
    return { ...permissions, loading };
  }

  // Non-members can only view public community content
  if (!userIsMember) {
    permissions.canViewContent = community.isPublic;
    return { ...permissions, loading };
  }

  // All members can view content
  permissions.canViewContent = true;

  // Collaborative communities: all members can post
  // Informational communities: only admins can post
  if (community.isCollaborative) {
    permissions.canPost = true;
  } else {
    permissions.canPost = isAdmin;
  }

  // Admins have additional permissions
  if (isAdmin) {
    permissions.canEdit = true;
    permissions.canManageMembers = true;
    permissions.canManageSettings = true;
    permissions.canAccessAdminChat = true;
  }

  // Creator has all permissions including delete
  if (community.creatorId === userId) {
    permissions.canDelete = true;
  }

  return { ...permissions, loading, role, isAdmin, isMember: userIsMember };
};

/**
 * Hook to check if user can access a specific community page
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @param {string} pageType - Type of page (home, posts, chat, media, settings)
 * @param {Object} community - Community object
 * @returns {Object} { canAccess, loading, redirectPath }
 */
export const useCanAccessPage = (communityId, userId, pageType, community) => {
  const {
    role,
    isAdmin,
    isMember: userIsMember,
    loading,
  } = useCommunityRole(communityId, userId);

  if (loading || !community) {
    return { canAccess: false, loading: true, redirectPath: null };
  }

  // Non-members can only access public community home page
  if (!userIsMember) {
    if (community.isPublic && pageType === "home") {
      return { canAccess: true, loading: false, redirectPath: null };
    }
    return { canAccess: false, loading: false, redirectPath: "/communities" };
  }

  // Members can access most pages
  switch (pageType) {
    case "home":
    case "posts":
      return { canAccess: true, loading: false, redirectPath: null };

    case "chat":
      // Collaborative: all members can chat
      // Informational: no general chat
      if (community.isCollaborative) {
        return { canAccess: true, loading: false, redirectPath: null };
      }
      return {
        canAccess: false,
        loading: false,
        redirectPath: `/communities/${communityId}`,
      };

    case "adminChat":
      // Only admins can access admin chat
      if (isAdmin && !community.isCollaborative) {
        return { canAccess: true, loading: false, redirectPath: null };
      }
      return {
        canAccess: false,
        loading: false,
        redirectPath: `/communities/${communityId}`,
      };

    case "userToAdmin":
      // All members can access user-to-admin messaging in informational communities
      if (!community.isCollaborative) {
        return { canAccess: true, loading: false, redirectPath: null };
      }
      return {
        canAccess: false,
        loading: false,
        redirectPath: `/communities/${communityId}`,
      };

    case "media":
      // All members can access media library
      return { canAccess: true, loading: false, redirectPath: null };

    case "settings":
      // Only admins can access settings
      if (isAdmin) {
        return { canAccess: true, loading: false, redirectPath: null };
      }
      return {
        canAccess: false,
        loading: false,
        redirectPath: `/communities/${communityId}`,
      };

    default:
      return {
        canAccess: false,
        loading: false,
        redirectPath: `/communities/${communityId}`,
      };
  }
};

export default {
  useCommunityRole,
  useIsMember,
  useCommunityPermissions,
  useCanAccessPage,
};
