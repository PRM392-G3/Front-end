import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostResponse } from '@/services/api';

interface PostContextType {
  // Like state management
  updatePostLike: (postId: number, isLiked: boolean) => void;
  getPostLikeState: (postId: number) => { isLiked: boolean; likeCount: number } | null;
  
  // Share state management
  updatePostShare: (postId: number, isShared: boolean) => void;
  getPostShareState: (postId: number) => { isShared: boolean; shareCount: number } | null;
  
  // Comment state management
  updatePostComment: (postId: number, commentCount: number) => void;
  getPostCommentState: (postId: number) => { commentCount: number } | null;
  
  // Post state management
  updatePost: (postId: number, updates: Partial<PostResponse>) => void;
  getPost: (postId: number) => PostResponse | null;
  initializePosts: (posts: PostResponse[]) => void;
  clearStates: () => void;
  
  // Global post state
  posts: PostResponse[];
  setPosts: (posts: PostResponse[]) => void;
  refreshPosts: () => void;
  forceRefreshPosts: () => void;
  
  // Sync utilities
  syncPostState: (postId: number, state: { isLiked?: boolean; isShared?: boolean; likeCount?: number; shareCount?: number; commentCount?: number }) => void;
  getSyncedPost: (postId: number) => PostResponse | null;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [likeStates, setLikeStates] = useState<Map<number, { isLiked: boolean; likeCount: number }>>(new Map());
  const [shareStates, setShareStates] = useState<Map<number, { isShared: boolean; shareCount: number }>>(new Map());
  const [commentStates, setCommentStates] = useState<Map<number, { commentCount: number }>>(new Map());

  // Load states from AsyncStorage on mount
  useEffect(() => {
    loadStatesFromStorage();
  }, []);

  const loadStatesFromStorage = async () => {
    try {
      const savedLikeStates = await AsyncStorage.getItem('postLikeStates');
      const savedShareStates = await AsyncStorage.getItem('postShareStates');
      const savedCommentStates = await AsyncStorage.getItem('postCommentStates');
      
      if (savedLikeStates) {
        const parsedLikeStates = JSON.parse(savedLikeStates);
        const likeMap = new Map(Object.entries(parsedLikeStates).map(([key, value]) => [parseInt(key), value as { isLiked: boolean; likeCount: number }]));
        setLikeStates(likeMap);
        console.log('PostContext: Loaded like states from storage:', likeMap.size);
      }
      
      if (savedShareStates) {
        const parsedShareStates = JSON.parse(savedShareStates);
        const shareMap = new Map(Object.entries(parsedShareStates).map(([key, value]) => [parseInt(key), value as { isShared: boolean; shareCount: number }]));
        setShareStates(shareMap);
        console.log('PostContext: Loaded share states from storage:', shareMap.size);
      }
      
      if (savedCommentStates) {
        const parsedCommentStates = JSON.parse(savedCommentStates);
        const commentMap = new Map(Object.entries(parsedCommentStates).map(([key, value]) => [parseInt(key), value as { commentCount: number }]));
        setCommentStates(commentMap);
        console.log('PostContext: Loaded comment states from storage:', commentMap.size);
      }
    } catch (error) {
      console.error('PostContext: Error loading states from storage:', error);
    }
  };

  const saveStatesToStorage = async (likeStates: Map<number, any>, shareStates: Map<number, any>, commentStates?: Map<number, any>) => {
    try {
      const likeStatesObj = Object.fromEntries(likeStates);
      const shareStatesObj = Object.fromEntries(shareStates);
      const commentStatesObj = commentStates ? Object.fromEntries(commentStates) : {};
      
      await AsyncStorage.setItem('postLikeStates', JSON.stringify(likeStatesObj));
      await AsyncStorage.setItem('postShareStates', JSON.stringify(shareStatesObj));
      await AsyncStorage.setItem('postCommentStates', JSON.stringify(commentStatesObj));
    } catch (error) {
      console.error('PostContext: Error saving states to storage:', error);
    }
  };

  const updatePostLike = useCallback((postId: number, isLiked: boolean) => {
    console.log('PostContext: Updating like for post:', postId, 'isLiked:', isLiked);
    
    setLikeStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(postId);
      const newLikeCount = isLiked 
        ? (currentState?.likeCount || 0) + 1 
        : Math.max(0, (currentState?.likeCount || 0) - 1);
      
      newMap.set(postId, { isLiked, likeCount: newLikeCount });
      
      // Save to storage
      saveStatesToStorage(newMap, shareStates, commentStates);
      
      return newMap;
    });

    // Also update the posts array (only if it exists)
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked, 
              likeCount: isLiked 
                ? post.likeCount + 1 
                : Math.max(0, post.likeCount - 1)
            }
          : post
      )
    );
  }, [shareStates, commentStates]);

  const getPostLikeState = useCallback((postId: number) => {
    return likeStates.get(postId) || null;
  }, [likeStates]);

  const updatePostShare = useCallback((postId: number, isShared: boolean) => {
    console.log('PostContext: Updating share for post:', postId, 'isShared:', isShared);
    
    setShareStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(postId);
      const newShareCount = isShared 
        ? (currentState?.shareCount || 0) + 1 
        : Math.max(0, (currentState?.shareCount || 0) - 1);
      
      newMap.set(postId, { isShared, shareCount: newShareCount });
      
      // Save to storage
      saveStatesToStorage(likeStates, newMap, commentStates);
      
      return newMap;
    });

    // Also update the posts array (only if it exists)
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isShared, 
              shareCount: isShared 
                ? post.shareCount + 1 
                : Math.max(0, post.shareCount - 1)
            }
          : post
      )
    );
  }, [likeStates, commentStates]);

  const getPostShareState = useCallback((postId: number) => {
    return shareStates.get(postId) || null;
  }, [shareStates]);

  const updatePostComment = useCallback((postId: number, commentCount: number) => {
    console.log('PostContext: Updating comment count for post:', postId, 'commentCount:', commentCount);
    
    setCommentStates(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, { commentCount });
      
      // Save to storage
      saveStatesToStorage(likeStates, shareStates, newMap);
      
      return newMap;
    });

    // Also update the posts array (only if it exists)
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, commentCount }
          : post
      )
    );
  }, [likeStates, shareStates]);

  const getPostCommentState = useCallback((postId: number) => {
    return commentStates.get(postId) || null;
  }, [commentStates]);

  const updatePost = useCallback((postId: number, updates: Partial<PostResponse>) => {
    console.log('PostContext: Updating post:', postId, 'updates:', updates);
    
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, ...updates }
          : post
      )
    );
  }, []);

  const getPost = useCallback((postId: number) => {
    return posts.find(post => post.id === postId) || null;
  }, [posts]);

  const initializePosts = useCallback((newPosts: PostResponse[]) => {
    console.log('PostContext: Initializing posts with states:', newPosts.length);
    
    // Always update posts to get latest data from server
    setPosts(newPosts);
    
    // Initialize like and share states from posts, but preserve existing states
    setLikeStates(prevLikeStates => {
      const newLikeMap = new Map(prevLikeStates);
      
      newPosts.forEach(post => {
        // Always update with latest server data, but preserve user actions if they exist
        const existingState = newLikeMap.get(post.id);
        if (existingState) {
          // Keep user's like status but update count from server
          newLikeMap.set(post.id, { 
            isLiked: existingState.isLiked, 
            likeCount: post.likeCount 
          });
        } else {
          // Initialize with server data
          newLikeMap.set(post.id, { 
            isLiked: post.isLiked ?? false, 
            likeCount: post.likeCount 
          });
        }
      });
      
      // Save updated states
      saveStatesToStorage(newLikeMap, shareStates);
      
      return newLikeMap;
    });
    
    setShareStates(prevShareStates => {
      const newShareMap = new Map(prevShareStates);
      
      newPosts.forEach(post => {
        // Always update with latest server data, but preserve user actions if they exist
        const existingState = newShareMap.get(post.id);
        if (existingState) {
          // Keep user's share status but update count from server
          newShareMap.set(post.id, { 
            isShared: existingState.isShared, 
            shareCount: post.shareCount 
          });
        } else {
          // Initialize with server data
          newShareMap.set(post.id, { 
            isShared: post.isShared ?? false, 
            shareCount: post.shareCount 
          });
        }
      });
      
      // Save updated states
      saveStatesToStorage(likeStates, newShareMap, commentStates);
      
      return newShareMap;
    });
  }, [likeStates, commentStates]);

  const clearStates = useCallback(async () => {
    console.log('PostContext: Clearing all states');
    setPosts([]);
    setLikeStates(new Map());
    setShareStates(new Map());
    setCommentStates(new Map());
    
    // Clear from storage
    try {
      await AsyncStorage.removeItem('postLikeStates');
      await AsyncStorage.removeItem('postShareStates');
      await AsyncStorage.removeItem('postCommentStates');
    } catch (error) {
      console.error('PostContext: Error clearing states from storage:', error);
    }
  }, []);

  const refreshPosts = useCallback(() => {
    console.log('PostContext: Refreshing posts');
    // This will trigger a re-render and components can refetch data
    setPosts(prevPosts => [...prevPosts]);
  }, []);

  const forceRefreshPosts = useCallback(() => {
    console.log('PostContext: Force refreshing posts');
    // Clear states and force components to refetch
    setPosts([]);
    setLikeStates(new Map());
    setShareStates(new Map());
    setCommentStates(new Map());
  }, []);

  const syncPostState = useCallback((postId: number, state: { isLiked?: boolean; isShared?: boolean; likeCount?: number; shareCount?: number; commentCount?: number }) => {
    console.log('PostContext: Syncing post state for post:', postId, 'state:', state);
    
    // Update like state if provided
    if (state.isLiked !== undefined || state.likeCount !== undefined) {
      setLikeStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(postId) || { isLiked: false, likeCount: 0 };
        newMap.set(postId, {
          isLiked: state.isLiked !== undefined ? state.isLiked : currentState.isLiked,
          likeCount: state.likeCount !== undefined ? state.likeCount : currentState.likeCount
        });
        return newMap;
      });
    }
    
    // Update share state if provided
    if (state.isShared !== undefined || state.shareCount !== undefined) {
      setShareStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(postId) || { isShared: false, shareCount: 0 };
        newMap.set(postId, {
          isShared: state.isShared !== undefined ? state.isShared : currentState.isShared,
          shareCount: state.shareCount !== undefined ? state.shareCount : currentState.shareCount
        });
        return newMap;
      });
    }
    
    // Update comment state if provided
    if (state.commentCount !== undefined) {
      setCommentStates(prev => {
        const newMap = new Map(prev);
        newMap.set(postId, { commentCount: state.commentCount });
        return newMap;
      });
    }
    
    // Update posts array
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              ...(state.isLiked !== undefined && { isLiked: state.isLiked }),
              ...(state.isShared !== undefined && { isShared: state.isShared }),
              ...(state.likeCount !== undefined && { likeCount: state.likeCount }),
              ...(state.shareCount !== undefined && { shareCount: state.shareCount }),
              ...(state.commentCount !== undefined && { commentCount: state.commentCount })
            }
          : post
      )
    );
  }, []);

  const getSyncedPost = useCallback((postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    
    const likeState = getPostLikeState(postId);
    const shareState = getPostShareState(postId);
    const commentState = getPostCommentState(postId);
    
    return {
      ...post,
      isLiked: likeState?.isLiked ?? post.isLiked ?? false,
      likeCount: likeState?.likeCount ?? post.likeCount ?? 0,
      isShared: shareState?.isShared ?? post.isShared ?? false,
      shareCount: shareState?.shareCount ?? post.shareCount ?? 0,
      commentCount: commentState?.commentCount ?? post.commentCount ?? 0
    };
  }, [posts, getPostLikeState, getPostShareState, getPostCommentState]);

  const value: PostContextType = {
    updatePostLike,
    getPostLikeState,
    updatePostShare,
    getPostShareState,
    updatePostComment,
    getPostCommentState,
    updatePost,
    getPost,
    initializePosts,
    clearStates,
    posts,
    setPosts,
    refreshPosts,
    forceRefreshPosts,
    syncPostState,
    getSyncedPost,
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const usePostContext = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePostContext must be used within a PostProvider');
  }
  return context;
};