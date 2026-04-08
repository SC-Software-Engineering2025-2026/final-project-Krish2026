import { useState, useEffect } from "react";
import { HeartIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import MentionDisplay from "./MentionDisplay";

const PostGrid = ({
  posts,
  onPostClick,
  currentUserId,
  onLike,
  likedPosts = {},
}) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => onPostClick && onPostClick(post)}
          className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800"
        >
          {/* Post Image */}
          {post.images && post.images.length > 0 ? (
            <img
              src={post.images[0]}
              alt={post.caption || "Post"}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                No image
              </span>
            </div>
          )}

          {/* Multiple Images Indicator */}
          {post.images && post.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-medium">
              {post.images.length} photos
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-6 text-white">
              {/* Likes */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onLike) {
                    onLike(post.id, likedPosts[post.id]);
                  }
                }}
                className="flex items-center gap-2 hover:scale-110 transition-transform"
                disabled={!currentUserId}
              >
                {likedPosts[post.id] ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6" />
                )}
                <span className="font-semibold">{post.likesCount || 0}</span>
              </button>

              {/* Comments */}
              <div className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-6 w-6" />
                <span className="font-semibold">{post.commentsCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Caption Preview (if exists) */}
          {(post.caption ||
            (post.tags && post.tags.length > 0) ||
            (post.hashtags && post.hashtags.length > 0)) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {post.caption && (
                <MentionDisplay
                  text={post.caption}
                  className="text-white text-sm line-clamp-2 mb-2 block"
                />
              )}
              {/* Hashtags/Tags */}
              {((post.hashtags && post.hashtags.length > 0) ||
                (post.tags && post.tags.length > 0)) && (
                <div className="flex flex-wrap gap-1.5">
                  {(post.hashtags || post.tags)?.map((tag, index) => (
                    <span
                      key={index}
                      className="text-white text-xs font-medium bg-white bg-opacity-20 px-2 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostGrid;
