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
  
  // Post state management
  updatePost: (postId: number, updates: Partial<PostResponse>) => void;
  getPost: (postId: number) => PostResponse | null;
  initializePosts: (posts: PostResponse[]) => void;
  clearStates: () => void;
  
  // Global post state
  posts: PostResponse[];
  setPosts: (posts: PostResponse[]) => void;
  refreshPosts: () => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [likeStates, setLikeStates] = useState<Map<number, { isLiked: boolean; likeCount: number }>>(new Map());
  const [shareStates, setShareStates] = useState<Map<number, { isShared: boolean; shareCount: number }>>(new Map());

  // Load states from AsyncStorage on mount
  useEffect(() => {
    loadStatesFromStorage();
  }, []);

  const loadStatesFromStorage = async () => {
    try {
      const savedLikeStates = await AsyncStorage.getItem('postLikeStates');
      const savedShareStates = await AsyncStorage.getItem('postShareStates');
      
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
    } catch (error) {
      console.error('PostContext: Error loading states from storage:', error);
    }
  };

  const saveStatesToStorage = async (likeStates: Map<number, any>, shareStates: Map<number, any>) => {
    try {
      const likeStatesObj = Object.fromEntries(likeStates);
      const shareStatesObj = Object.fromEntries(shareStates);
      
      await AsyncStorage.setItem('postLikeStates', JSON.stringify(likeStatesObj));
      await AsyncStorage.setItem('postShareStates', JSON.stringify(shareStatesObj));
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
      saveStatesToStorage(newMap, shareStates);
      
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
  }, [shareStates]);

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
      saveStatesToStorage(likeStates, newMap);
      
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
  }, [likeStates]);

  const getPostShareState = useCallback((postId: number) => {
    return shareStates.get(postId) || null;
  }, [shareStates]);

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
    
    // Prevent duplicate initialization with same posts
    if (posts.length === newPosts.length && 
        posts.every((post, index) => post.id === newPosts[index]?.id)) {
      console.log('PostContext: Skipping duplicate initialization');
      return;
    }
    
    setPosts(newPosts);
    
    // Initialize like and share states from posts, but preserve existing states
    setLikeStates(prevLikeStates => {
      const newLikeMap = new Map(prevLikeStates);
      
      newPosts.forEach(post => {
        // Only initialize if not already in state (preserve user actions)
        if (!newLikeMap.has(post.id) && post.isLiked !== undefined) {
          newLikeMap.set(post.id, { isLiked: post.isLiked ?? false, likeCount: post.likeCount });
        }
      });
      
      // Save updated states
      saveStatesToStorage(newLikeMap, shareStates);
      
      return newLikeMap;
    });
    
    setShareStates(prevShareStates => {
      const newShareMap = new Map(prevShareStates);
      
      newPosts.forEach(post => {
        // Only initialize if not already in state (preserve user actions)
        if (!newShareMap.has(post.id) && post.isShared !== undefined) {
          newShareMap.set(post.id, { isShared: post.isShared ?? false, shareCount: post.shareCount });
        }
      });
      
      // Save updated states
      saveStatesToStorage(likeStates, newShareMap);
      
      return newShareMap;
    });
  }, [likeStates, shareStates]);

  const clearStates = useCallback(async () => {
    console.log('PostContext: Clearing all states');
    setPosts([]);
    setLikeStates(new Map());
    setShareStates(new Map());
    
    // Clear from storage
    try {
      await AsyncStorage.removeItem('postLikeStates');
      await AsyncStorage.removeItem('postShareStates');
    } catch (error) {
      console.error('PostContext: Error clearing states from storage:', error);
    }
  }, []);

  const refreshPosts = useCallback(() => {
    console.log('PostContext: Refreshing posts');
    // This will trigger a re-render and components can refetch data
    setPosts(prevPosts => [...prevPosts]);
  }, []);

  const value: PostContextType = {
    updatePostLike,
    getPostLikeState,
    updatePostShare,
    getPostShareState,
    updatePost,
    getPost,
    initializePosts,
    clearStates,
    posts,
    setPosts,
    refreshPosts,
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