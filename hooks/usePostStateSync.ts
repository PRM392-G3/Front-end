import { useCallback } from 'react';
import { usePostContext } from '@/contexts/PostContext';
import { PostResponse } from '@/services/api';

/**
 * Custom hook for managing post state synchronization
 * Provides convenient methods for updating and syncing post states
 */
export const usePostStateSync = () => {
  const {
    updatePostLike,
    updatePostShare,
    updatePostComment,
    getPostLikeState,
    getPostShareState,
    getPostCommentState,
    syncPostState,
    getSyncedPost,
    refreshPosts
  } = usePostContext();

  /**
   * Initialize post state in context
   */
  const initializePostState = useCallback((post: PostResponse) => {
    syncPostState(post.id, {
      isLiked: post.isLiked,
      isShared: post.isShared,
      likeCount: post.likeCount,
      shareCount: post.shareCount,
      commentCount: post.commentCount
    });
  }, [syncPostState]);

  /**
   * Get current post state with fallbacks
   */
  const getCurrentPostState = useCallback((postId: number) => {
    const likeState = getPostLikeState(postId);
    const shareState = getPostShareState(postId);
    const commentState = getPostCommentState(postId);
    const syncedPost = getSyncedPost(postId);

    return {
      isLiked: likeState?.isLiked ?? syncedPost?.isLiked ?? false,
      likeCount: likeState?.likeCount ?? syncedPost?.likeCount ?? 0,
      isShared: shareState?.isShared ?? syncedPost?.isShared ?? false,
      shareCount: shareState?.shareCount ?? syncedPost?.shareCount ?? 0,
      commentCount: commentState?.commentCount ?? syncedPost?.commentCount ?? 0,
    };
  }, [getPostLikeState, getPostShareState, getPostCommentState, getSyncedPost]);

  /**
   * Handle like toggle with error recovery
   */
  const handleLikeToggle = useCallback(async (
    postId: number,
    apiCall: () => Promise<void>,
    onSuccess?: (isLiked: boolean) => void,
    onError?: (error: any) => void
  ) => {
    const currentState = getCurrentPostState(postId);
    const newIsLiked = !currentState.isLiked;
    
    // Optimistic update
    updatePostLike(postId, newIsLiked);
    
    try {
      await apiCall();
      onSuccess?.(newIsLiked);
      refreshPosts(); // Refresh to ensure consistency
    } catch (error) {
      // Revert on error
      updatePostLike(postId, currentState.isLiked);
      onError?.(error);
    }
  }, [getCurrentPostState, updatePostLike, refreshPosts]);

  /**
   * Handle share toggle with error recovery
   */
  const handleShareToggle = useCallback(async (
    postId: number,
    apiCall: () => Promise<void>,
    onSuccess?: (isShared: boolean) => void,
    onError?: (error: any) => void
  ) => {
    const currentState = getCurrentPostState(postId);
    const newIsShared = !currentState.isShared;
    
    // Optimistic update
    updatePostShare(postId, newIsShared);
    
    try {
      await apiCall();
      onSuccess?.(newIsShared);
      refreshPosts(); // Refresh to ensure consistency
    } catch (error) {
      // Revert on error
      updatePostShare(postId, currentState.isShared);
      onError?.(error);
    }
  }, [getCurrentPostState, updatePostShare, refreshPosts]);

  /**
   * Handle comment count update
   */
  const handleCommentCountUpdate = useCallback((postId: number, newCount: number) => {
    updatePostComment(postId, newCount);
  }, [updatePostComment]);

  /**
   * Batch update multiple post states
   */
  const batchUpdatePostStates = useCallback((updates: Array<{
    postId: number;
    state: {
      isLiked?: boolean;
      isShared?: boolean;
      likeCount?: number;
      shareCount?: number;
      commentCount?: number;
    };
  }>) => {
    updates.forEach(({ postId, state }) => {
      syncPostState(postId, state);
    });
  }, [syncPostState]);

  /**
   * Get all posts with synced states
   */
  const getPostsWithSyncedStates = useCallback((posts: PostResponse[]) => {
    return posts.map(post => {
      const syncedPost = getSyncedPost(post.id);
      return syncedPost || post;
    });
  }, [getSyncedPost]);

  return {
    // State getters
    getPostLikeState,
    getPostShareState,
    getPostCommentState,
    getSyncedPost,
    getCurrentPostState,
    
    // State updaters
    updatePostLike,
    updatePostShare,
    updatePostComment,
    syncPostState,
    
    // Convenience methods
    initializePostState,
    handleLikeToggle,
    handleShareToggle,
    handleCommentCountUpdate,
    batchUpdatePostStates,
    getPostsWithSyncedStates,
    
    // Utilities
    refreshPosts
  };
};

export default usePostStateSync;
