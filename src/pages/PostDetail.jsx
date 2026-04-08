import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getPost,
  deletePost,
  likePost,
  unlikePost,
  hasLikedPost,
  addComment,
  getPostComments,
  deleteComment,
  subscribeToPost,
  subscribeToUserLikes,
} from "../services/postService";
import { getUserProfile } from "../services/profileService";
import MentionDisplay from "../components/MentionDisplay";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  MapPinIcon,
  TrashIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { formatDistanceToNow } from "date-fns";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentAuthors, setCommentAuthors] = useState({});
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Subscribe to post in real-time
    const unsubscribePost = subscribeToPost(postId, async (postData) => {
      if (!postData) {
        navigate("/");
        return;
      }
      setPost(postData);

      // Load author (only needs to be done once)
      if (!author) {
        try {
          const authorData = await getUserProfile(postData.userId);
          setAuthor(authorData);
        } catch (err) {
          console.error("Error loading author:", err);
        }
      }

      setLoading(false);
    });

    // Subscribe to likes in real-time if user is logged in
    let unsubscribeLikes;
    if (currentUser) {
      unsubscribeLikes = subscribeToUserLikes(
        currentUser.uid,
        (likedPostIds) => {
          setIsLiked(likedPostIds.includes(postId));
        },
      );
    }

    // Load comments
    loadComments();

    // Cleanup subscriptions
    return () => {
      unsubscribePost();
      if (unsubscribeLikes) {
        unsubscribeLikes();
      }
    };
  }, [postId, currentUser]);

  const loadComments = async () => {
    try {
      const commentsData = await getPostComments(postId);
      setComments(commentsData);

      // Load comment authors
      const authorIds = [...new Set(commentsData.map((c) => c.userId))];
      const authors = {};
      await Promise.all(
        authorIds.map(async (userId) => {
          const profile = await getUserProfile(userId);
          authors[userId] = profile;
        }),
      );
      setCommentAuthors(authors);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isLiked) {
        await unlikePost(postId, currentUser.uid);
      } else {
        await likePost(postId, currentUser.uid);
      }
      // Real-time listeners will automatically update the state
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      await addComment(postId, currentUser.uid, newComment.trim());
      setNewComment("");
      setPost({ ...post, commentsCount: (post.commentsCount || 0) + 1 });
      await loadComments();
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId, postId);
      setPost({ ...post, commentsCount: (post.commentsCount || 0) - 1 });
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    }
  };

  const handleDeletePost = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deletePost(postId, currentUser.uid);
      navigate(`/profile/${currentUser.uid}`);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  const nextImage = () => {
    if (post.images && currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Post not found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 rounded-lg"
          style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="lg:w-2/3 bg-black dark:bg-gray-800 relative">
            {post.images && post.images.length > 0 ? (
              <>
                <img
                  src={post.images[currentImageIndex]}
                  alt={post.caption}
                  className="w-full h-full object-contain max-h-[600px] lg:max-h-[800px]"
                />

                {/* Image Navigation */}
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 disabled:opacity-30 transition"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === post.images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 disabled:opacity-30 transition"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {post.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-white bg-opacity-50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="lg:w-1/3 flex flex-col max-h-[600px] lg:max-h-[800px]">
            {/* Post Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/profile/${author?.id}`)}
              >
                {author?.profileImage ? (
                  <img
                    src={author.profileImage}
                    alt={author.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {author?.displayName || "Unknown User"}
                  </p>
                  {post.location && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPinIcon className="h-3 w-3" />
                      {post.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Delete Menu */}
              {currentUser && currentUser.uid === post.userId && (
                <div className="relative">
                  <button
                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <EllipsisHorizontalIcon className="h-6 w-6" />
                  </button>
                  {showDeleteMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={handleDeletePost}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Caption and Details */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Caption */}
              {post.caption && (
                <div className="mb-4">
                  <MentionDisplay
                    text={post.caption}
                    className="text-gray-900 whitespace-pre-wrap pl-2.5"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formatTimestamp(post.createdAt)}
                  </p>
                </div>
              )}

              {/* Tags - Legacy display, kept for backwards compatibility */}
              {post.tags && post.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 pl-2.5">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-blue-600 text-sm font-medium hover:underline cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Comments</h3>
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const commentAuthor = commentAuthors[comment.userId];
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <img
                          src={
                            commentAuthor?.profileImage || "/default-avatar.png"
                          }
                          alt={commentAuthor?.displayName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm">
                              <span className="font-semibold text-gray-900">
                                {commentAuthor?.displayName || "Unknown"}
                              </span>{" "}
                              <span className="text-gray-700">
                                {comment.text}
                              </span>
                            </p>
                            {currentUser &&
                              (currentUser.uid === comment.userId ||
                                currentUser.uid === post.userId) && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="text-gray-400 hover:text-red-600 transition flex-shrink-0"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm">No comments yet</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200">
              <div className="p-4 flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition"
                >
                  {isLiked ? (
                    <HeartSolidIcon className="h-7 w-7 text-red-600" />
                  ) : (
                    <HeartIcon className="h-7 w-7" />
                  )}
                  <span className="font-semibold">{post.likesCount || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-700">
                  <ChatBubbleLeftIcon className="h-7 w-7" />
                  <span className="font-semibold">
                    {post.commentsCount || 0}
                  </span>
                </div>
              </div>

              {/* Add Comment */}
              <form
                onSubmit={handleAddComment}
                className="p-4 border-t border-gray-200"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={commentLoading}
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
                    style={{
                      backgroundColor: COLORS.Dark_Gray,
                      color: COLORS.Beige,
                    }}
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
      >
        Back
      </button>
    </div>
  );
};

export default PostDetail;
