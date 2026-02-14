import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/profileService";
import {
  getUserCommunitiesPosts,
  likeCommunityPost,
  addCommentToCommunityPost,
  getCommunityPostComments,
} from "../services/communityPostService";
import {
  subscribeToAllPosts,
  likePost,
  unlikePost,
  subscribeToUserLikes,
  getPostComments,
  addComment,
} from "../services/postService";
import PostUpload from "../components/PostUpload";
import {
  PlusIcon,
  PhotoIcon,
  UserGroupIcon,
  GlobeAltIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showPostUpload, setShowPostUpload] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [personalPosts, setPersonalPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    };
    loadUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Subscribe to personal posts in real-time
    const unsubscribePosts = subscribeToAllPosts(async (postsData) => {
      // Fetch user profiles for personal posts
      const postsWithProfiles = await Promise.all(
        postsData.map(async (post) => {
          try {
            const profile = await getUserProfile(post.userId);
            return {
              ...post,
              userProfile: profile,
              postType: "personal",
            };
          } catch (error) {
            return { ...post, userProfile: null, postType: "personal" };
          }
        }),
      );
      setPersonalPosts(postsWithProfiles);
    });

    // Subscribe to user likes in real-time
    const unsubscribeLikes = subscribeToUserLikes(
      currentUser.uid,
      (likedPostIds) => {
        const likedStatus = {};
        likedPostIds.forEach((postId) => {
          likedStatus[postId] = true;
        });
        setLikedPosts(likedStatus);
      },
    );

    // Load community posts
    const loadCommunityPosts = async () => {
      try {
        const communityPostsData = await getUserCommunitiesPosts(
          currentUser.uid,
        );
        setCommunityPosts(
          communityPostsData.map((post) => ({
            ...post,
            postType: "community",
          })),
        );
      } catch (error) {
        console.error("Error loading community posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunityPosts();

    // Cleanup subscriptions
    return () => {
      unsubscribePosts();
      unsubscribeLikes();
    };
  }, [currentUser]);

  // Combine and sort all posts
  useEffect(() => {
    const allPosts = [...personalPosts, ...communityPosts];
    allPosts.sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const bTime =
        b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return bTime - aTime;
    });
    setPosts(allPosts);
  }, [personalPosts, communityPosts]);

  const handlePostCreated = async (postId) => {
    // Close the modal
    setShowPostUpload(false);
    // Reload community posts to refresh the feed
    try {
      const communityPosts = await getUserCommunitiesPosts(currentUser.uid);
      setPosts(communityPosts);
    } catch (error) {
      console.error("Error reloading posts:", error);
    }
    // Optionally navigate to the new post
    // navigate(`/post/${postId}`);
  };

  const handleLike = async (post) => {
    try {
      if (post.postType === "community") {
        // Community post like
        await likeCommunityPost(post.communityId, post.id, currentUser.uid);
        // Reload community posts
        const communityPostsData = await getUserCommunitiesPosts(
          currentUser.uid,
        );
        setCommunityPosts(
          communityPostsData.map((p) => ({ ...p, postType: "community" })),
        );
      } else {
        // Personal post like
        const isLiked = likedPosts[post.id];
        if (isLiked) {
          await unlikePost(post.id, currentUser.uid);
        } else {
          await likePost(post.id, currentUser.uid);
        }
        // Real-time listener will update the UI
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleCommentAdded = () => {
    // Reload posts to update comment count
    const loadPosts = async () => {
      try {
        const communityPosts = await getUserCommunitiesPosts(currentUser.uid);
        setPosts(communityPosts);
      } catch (error) {
        console.error("Error reloading posts:", error);
      }
    };
    loadPosts();
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Sfera
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern social media platform for digital communities
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <PhotoIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Share Your Moments
            </h3>
            <p className="text-gray-600">
              Upload photos and share your experiences with the community
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <UserGroupIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Join Communities
            </h3>
            <p className="text-gray-600">
              Connect with like-minded people in various communities
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <GlobeAltIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Discover Content
            </h3>
            <p className="text-gray-600">
              Explore new content and discover amazing creators
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back,{" "}
              {userProfile?.username || currentUser.displayName || "User"}!
            </h1>
            <p className="text-gray-600">
              View new moments from your communities!
            </p>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Feed</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-6">
              Join communities to see posts in your feed
            </p>
            <button
              onClick={() => navigate("/communities")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Explore Communities
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                {/* Post Header - Community or Personal */}
                {post.postType === "community" ? (
                  <div
                    onClick={() => navigate(`/communities/${post.communityId}`)}
                    className="flex items-center space-x-3 p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                  >
                    {post.communityImage && (
                      <img
                        src={post.communityImage}
                        alt={post.communityName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {post.communityName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {post.isCollaborative
                          ? "Collaborative"
                          : "Informational"}{" "}
                        Community
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center space-x-2">
                      <PhotoIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Personal Post
                      </span>
                    </div>
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  {/* Author Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    {post.userProfile?.profilePicture ? (
                      <img
                        src={post.userProfile.profilePicture}
                        alt={post.userProfile.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {post.userProfile?.username?.[0]?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {post.userProfile?.username || "User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {post.createdAt?.toDate?.()?.toLocaleDateString() ||
                          "Recently"}
                      </p>
                    </div>
                  </div>

                  {/* Post Text */}
                  {(post.content || post.caption) && (
                    <p className="text-gray-800 mb-4 whitespace-pre-wrap">
                      {post.content || post.caption}
                    </p>
                  )}

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div
                      className={`grid gap-2 mb-4 ${
                        post.images.length === 1
                          ? "grid-cols-1"
                          : post.images.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-2"
                      }`}
                    >
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                          onClick={() => {
                            if (post.postType === "community") {
                              navigate(`/communities/${post.communityId}`);
                            } else {
                              navigate(`/post/${post.id}`);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center space-x-6 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleLike(post)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition"
                    >
                      {(
                        post.postType === "community"
                          ? post.likes?.includes(currentUser.uid)
                          : likedPosts[post.id]
                      ) ? (
                        <HeartIconSolid className="h-6 w-6 text-red-600" />
                      ) : (
                        <HeartIcon className="h-6 w-6" />
                      )}
                      <span className="text-sm font-medium">
                        {post.likesCount || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => handleOpenComments(post)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
                    >
                      <ChatBubbleLeftIcon className="h-6 w-6" />
                      <span className="text-sm font-medium">
                        {post.commentsCount || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Upload Modal */}
      {showPostUpload && (
        <PostUpload
          onClose={() => setShowPostUpload(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <CommentsModal
          post={selectedPost}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedPost(null);
          }}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ post, onClose, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  useEffect(() => {
    // Scroll to bottom when comments update
    if (commentsEndRef.current && comments.length > 0) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      let data;

      // Load comments based on post type
      if (post.postType === "community") {
        const postPath = `${post.communityId}/posts/${post.id}`;
        data = await getCommunityPostComments(postPath);
      } else {
        // Personal post
        data = await getPostComments(post.id);
      }

      // Fetch user profiles for each comment
      const commentsWithProfiles = await Promise.all(
        data.map(async (comment) => {
          try {
            const profile = await getUserProfile(comment.userId);
            return { ...comment, userProfile: profile };
          } catch (error) {
            return { ...comment, userProfile: null };
          }
        }),
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentText = newComment.trim();

    // Create optimistic comment immediately with basic user info
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      text: commentText,
      userId: currentUser.uid,
      userProfile: {
        username:
          currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        profilePicture: currentUser.photoURL || null,
      },
      createdAt: { toDate: () => new Date() },
    };

    // Add comment to UI instantly
    setComments((prev) => [...prev, optimisticComment]);

    // Clear input and blur it immediately for instant feedback
    setNewComment("");
    if (inputRef.current) {
      inputRef.current.blur();
    }

    // Auto-scroll to bottom to show new comment
    setTimeout(() => {
      if (commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);

    setLoading(true);

    try {
      // Add comment based on post type
      if (post.postType === "community") {
        const postPath = `${post.communityId}/posts/${post.id}`;
        await addCommentToCommunityPost(postPath, currentUser.uid, commentText);
      } else {
        // Personal post
        await addComment(post.id, currentUser.uid, commentText);
      }

      // Reload comments from server to ensure data consistency
      await loadComments();
      onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);

      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));

      // Restore text to input field for user to try again
      setNewComment(commentText);

      // Show error message (optional - could add toast notification)
      alert("Failed to post comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Comments</h2>
            <p className="text-sm text-gray-500">
              {post.postType === "community"
                ? post.communityName
                : "Personal Post"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  {comment.userProfile?.profilePicture ? (
                    <img
                      src={comment.userProfile.profilePicture}
                      alt={comment.userProfile.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {comment.userProfile?.username?.[0]?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {comment.userProfile?.username || "User"}
                    </p>
                    <p className="text-gray-900 mt-1">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.createdAt?.toDate?.()?.toLocaleDateString() ||
                        "Just now"}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
