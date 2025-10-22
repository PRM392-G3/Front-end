import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

  const updatePostLike = useCallback((postId: number, isLiked: boolean) => {
    console.log('PostContext: Updating like for post:', postId, 'isLiked:', isLiked);
    
    setLikeStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(postId);
      const newLikeCount = isLiked 
        ? (currentState?.likeCount || 0) + 1 
        : Math.max(0, (currentState?.likeCount || 0) - 1);
      
      newMap.set(postId, { isLiked, likeCount: newLikeCount });
      return newMap;
    });

    // Also update the posts array
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
  }, []);

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
      return newMap;
    });

    // Also update the posts array
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
  }, []);

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