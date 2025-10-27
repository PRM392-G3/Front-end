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
  setPosts: (posts: PostResponse[] | ((prev: PostResponse[]) => PostResponse[])) => void;
  refreshPosts: () => void;
  forceRefreshPosts: () => void;
  
  // Sync utilities
  syncPostState: (postId: number, state: { isLiked?: boolean; isShared?: boolean; likeCount?: number; shareCount?: number; commentCount?: number }) => void;
  getSyncedPost: (postId: number) => PostResponse | null;
  
  // Cache utilities
  cachedPosts: PostResponse[];
  cacheTimestamp: number;
  savePostsToCache: (posts: PostResponse[]) => void;
  loadCachedPosts: () => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  
  // Wrapper to ensure type safety
  const setPostsSafe = useCallback((updater: PostResponse[] | ((prev: PostResponse[]) => PostResponse[])) => {
    if (typeof updater === 'function') {
      setPosts(updater);
    } else {
      setPosts(updater);
    }
  }, []);
  const [cachedPosts, setCachedPosts] = useState<PostResponse[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const likeStates = useState<Map<number, { isLiked: boolean; likeCount: number }>>(new Map())[0];
  const setLikeStates = useState<Map<number, { isLiked: boolean; likeCount: number }>>(new Map())[1];
  const [shareStates, setShareStates] = useState<Map<number, { isShared: boolean; shareCount: number }>>(new Map());
  const [commentStates, setCommentStates] = useState<Map<number, { commentCount: number }>>(new Map());

  // Load states from AsyncStorage on mount
  useEffect(() => {
    loadStatesFromStorage();
    loadCachedPosts();
  }, []);
  
  // Load cached posts with smart merging strategy
  const loadCachedPosts = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedPosts');
      const timestamp = await AsyncStorage.getItem('cachedPostsTimestamp');
      
      if (cachedData && timestamp) {
        const parsedPosts = JSON.parse(cachedData);
        const cacheAge = Date.now() - parseInt(timestamp);
        
        console.log('PostContext: Loading cached posts (age:', Math.round(cacheAge / 1000 / 60), 'minutes)');
        console.log('PostContext: Cache size:', parsedPosts.length, 'posts');
        
        // Always load cache for offline support (up to 7 days)
        if (cacheAge < 7 * 24 * 60 * 60 * 1000 && parsedPosts.length > 0) {
          setCachedPosts(parsedPosts);
          
          // Smart loading strategy based on cache age:
          // - Fresh (< 5 min): Show cache immediately, sync in background
          // - Recent (5-30 min): Show cache, eager sync next page
          // - Stale (> 30 min): Show cache, aggressive sync
          
          if (cacheAge < 5 * 60 * 1000) {
            console.log('PostContext: Fresh cache (< 5 min), showing immediately');
            setPosts(parsedPosts);
          } else if (cacheAge < 30 * 60 * 1000) {
            console.log('PostContext: Recent cache (5-30 min), showing but will sync soon');
            setPosts(parsedPosts);
          } else {
            console.log('PostContext: Stale cache (> 30 min), showing but will aggressively sync');
            setPosts(parsedPosts);
          }
        }
      }
    } catch (error) {
      console.error('PostContext: Error loading cached posts:', error);
    }
  };
  
  // Save posts to cache
  const savePostsToCache = async (postsToCache: PostResponse[]) => {
    try {
      // Compress cache data and save
      const cacheData = JSON.stringify(postsToCache);
      await AsyncStorage.setItem('cachedPosts', cacheData);
      await AsyncStorage.setItem('cachedPostsTimestamp', Date.now().toString());
      setCacheTimestamp(Date.now());
      console.log('PostContext: Saved', postsToCache.length, 'posts to cache');
    } catch (error) {
      console.error('PostContext: Error saving posts to cache:', error);
    }
  };

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
    
    // Smart merge: keep cache for old posts, prepend new posts
    setPosts(prevPosts => {
      if (prevPosts.length === 0) {
        // No previous posts, just set new ones
        return newPosts;
      }
      
      // Merge strategy: Keep unique posts based on ID, favor new data
      const postMap = new Map();
      
      // First, add new posts (fresher data)
      newPosts.forEach(post => {
        postMap.set(post.id, post);
      });
      
      // Then add cached posts that aren't in the new data
      prevPosts.forEach(cachedPost => {
        if (!postMap.has(cachedPost.id)) {
          postMap.set(cachedPost.id, cachedPost);
        }
      });
      
      // Convert back to array and sort by created date
      const mergedPosts = Array.from(postMap.values());
      mergedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('PostContext: Merged', prevPosts.length, 'cached posts with', newPosts.length, 'new posts =', mergedPosts.length, 'total');
      
      return mergedPosts;
    });
    
    // Save to cache
    savePostsToCache(posts);
    
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
    setPosts: setPostsSafe,
    refreshPosts,
    forceRefreshPosts,
    syncPostState,
    getSyncedPost,
    cachedPosts,
    cacheTimestamp,
    savePostsToCache,
    loadCachedPosts,
  };
  
  // Expose additional cache methods
  (value as any).savePostsToCache = savePostsToCache;
  (value as any).loadCachedPosts = loadCachedPosts;

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