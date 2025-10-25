import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, ViewStyle, TextStyle, ImageStyle, FlatList, Modal, TextInput } from 'react-native';
import { ArrowLeft, Users, Grid2x2 as Grid, Mail, Phone, MapPin, Calendar, LogOut, Share2, Edit3, User as UserIcon, Bell } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '../constants/theme';
import { userAPI, User, postAPI, PostResponse, shareAPI, UpdateUserPayload, FriendRequest, groupAPI, Group } from '../services/api';
import FollowingList from '../components/FollowingList';
import { FollowersList } from '../components/FollowersList';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import { usePostContext } from '../contexts/PostContext';
import SimpleImageUploader from '../components/SimpleImageUploader';
import { FileUploadResponse } from '../services/mediaAPI';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { logout, user: currentUser } = useAuth();
  const { 
    updatePost, 
    updatePostLike, 
    updatePostShare, 
    updatePostComment,
    initializePosts,
    syncPostState,
    getSyncedPost
  } = usePostContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'shared' | 'friends' | 'groups'>('posts');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [sharedPosts, setSharedPosts] = useState<PostResponse[]>([]);
  const [sharedPostsLoading, setSharedPostsLoading] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateUserPayload>({
    fullName: '',
    bio: '',
    avatarUrl: '',
    coverImageUrl: '',
    phoneNumber: '',
    dateOfBirth: '',
    location: '',
  });
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  
  // Friend request states
  const [friendshipStatus, setFriendshipStatus] = useState<{
    isFriend: boolean;
    hasPendingRequest: boolean;
    requestId?: number;
    requesterId?: number;
    receiverId?: number;
  } | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [pendingGroupInvitesCount, setPendingGroupInvitesCount] = useState<number>(0);


  useEffect(() => {
    // Reset all lists when changing user profile to avoid showing old data
    setFriends([]);
    setSharedPosts([]);
    setPosts([]);
    setActiveTab('posts'); // Reset to posts tab when viewing different user
    
    if (userId) {
      // Handle case where userId might be an array
      const actualUserId = Array.isArray(userId) ? userId[0] : userId;
      fetchUserProfile(actualUserId);
    } else if (currentUser) {
      // If no userId provided, show current user's profile
      fetchUserProfile(currentUser.id.toString());
    } else {
      setLoading(false);
    }
  }, [userId, currentUser]);

  // Refresh profile data when screen comes back into focus (e.g., returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        const actualUserId = Array.isArray(userId) ? userId[0] : userId;
        fetchUserProfile(actualUserId);
      } else if (currentUser) {
        fetchUserProfile(currentUser.id.toString());
      }
      
      // Reload pending friend requests count when returning to screen
      if (currentUser) {
        loadPendingRequestsCount(currentUser.id);
      }
    }, [userId, currentUser])
  );

  // Debug activeTab changes
  useEffect(() => {
    // Load shared posts when switching to shared tab
    if (activeTab === 'shared' && user && sharedPosts.length === 0) {
      loadSharedPosts(user.id);
    }
    // Load friends when switching to friends tab
    if (activeTab === 'friends' && user) {
      loadFriends(user.id);
    }
  }, [activeTab, user?.id]);

  // Load friendship status when viewing another user's profile
  useEffect(() => {
    if (user && currentUser && user.id !== currentUser.id) {
      loadFriendshipStatus(currentUser.id, user.id);
    }
  }, [user, currentUser]);

  // Load pending friend requests count for current user's own profile
  useEffect(() => {
    if (user && currentUser && user.id === currentUser.id) {
      loadPendingRequestsCount(currentUser.id);
      loadPendingGroupInvitesCount(currentUser.id);
    }
  }, [user, currentUser]);

  // Load groups when groups tab is selected
  useEffect(() => {
    if (activeTab === 'groups' && user) {
      fetchUserGroups();
    }
  }, [activeTab, user]);

  // Initialize form when user data is loaded
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        coverImageUrl: user.coverImageUrl || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        location: user.location || '',
      });
      
      // Parse date of birth
      if (user.dateOfBirth) {
        const d = new Date(user.dateOfBirth);
        if (!isNaN(d.getTime())) {
          setDobDay(String(d.getDate()));
          setDobMonth(String(d.getMonth() + 1));
          setDobYear(String(d.getFullYear()));
        }
      }
    }
  }, [user]);


  const fetchUserProfile = async (targetUserId?: string) => {
    const userIdToFetch = targetUserId || userId;
    try {
      setLoading(true);
      console.log(`🚀 [UserProfile] API CALL: Getting user ${userIdToFetch}`);
      console.log(`🚀 [UserProfile] API URL: /User/${userIdToFetch}`);
      const userData = await userAPI.getUserById(parseInt(userIdToFetch));
      console.log(`✅ [UserProfile] API SUCCESS: Received user data:`, userData);
      console.log(`✅ [UserProfile] User name: ${userData.fullName}, Email: ${userData.email}`);
      setUser(userData);
      
      // Load both user posts and shared posts after getting user data
      await Promise.all([
        loadUserPosts(parseInt(userIdToFetch)),
        loadSharedPosts(parseInt(userIdToFetch))
      ]);
    } catch (error: any) {
      console.error('❌ [UserProfile] API ERROR:', error);
      console.error('[UserProfile] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Xử lý lỗi 404 hoặc các lỗi khác
      const status = error.response?.status;
      if (status === 404) {
        console.log('[UserProfile] User not found (404) - showing error UI with logout option');
        setUser(null); // Clear user data to show error state
      } else if (status === 401) {
        // Token expired or invalid - redirect to login
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại',
          [
            {
              text: 'Đăng nhập',
              onPress: async () => {
                await logout();
                router.replace('/auth/login');
              }
            }
          ]
        );
        setUser(null);
      } else if (error.isNetworkError || error.message === 'Network Error') {
        // Network error - show error UI but keep cached data if available
        console.log('[UserProfile] Network error - showing error UI with logout option');
        if (!user) {
          setUser(null);
        }
      } else {
        // For other errors, clear user data to show error state
        console.log('[UserProfile] Error loading profile - showing error UI with logout option');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (userId: number) => {
    try {
      setPostsLoading(true);
      console.log(`🚀 [ProfileScreen] Loading posts for user ${userId} with like status`);
      const postsData = await postAPI.getPostsByUser(userId);
      console.log(`✅ [ProfileScreen] Posts loaded with like status:`, postsData);
      console.log(`📊 [ProfileScreen] Posts count: ${postsData.length}`);
      
      // Initialize posts with like/share status from backend
      initializePosts(postsData);
      setPosts(postsData);
    } catch (error: any) {
      console.error('❌ [ProfileScreen] Posts loading error:', error);
      const status = error.response?.status;
      if (status === 404) {
        console.log('[ProfileScreen] Posts not found (404) - setting empty posts array');
        setPosts([]);
      } else if (status === 401) {
        console.log('[ProfileScreen] Unauthorized (401) - token may be expired');
        // Don't handle 401 here, let the profile fetch handle it
      } else {
        console.log('[ProfileScreen] Error loading posts - setting empty posts array');
        setPosts([]);
      }
    } finally {
      setPostsLoading(false);
    }
  };

  const loadSharedPosts = async (userId: number) => {
    try {
      setSharedPostsLoading(true);
      console.log(`🚀 [UserProfile] Loading shared posts for user ${userId} with like status`);
      const sharedPostsData = await postAPI.getSharedPostsByUser(userId);
      console.log(`✅ [UserProfile] Shared posts loaded with like status:`, sharedPostsData);
      
      // Initialize shared posts with like/share status from backend
      initializePosts(sharedPostsData);
      setSharedPosts(sharedPostsData);
    } catch (error: any) {
      console.error('❌ [UserProfile] Shared posts loading error:', error);
      const status = error.response?.status;
      if (status === 404) {
        console.log('[UserProfile] Shared posts not found (404) - setting empty array');
        setSharedPosts([]);
      } else {
        console.log('[UserProfile] Error loading shared posts - setting empty array');
        setSharedPosts([]);
      }
    } finally {
      setSharedPostsLoading(false);
    }
  };

  const loadFriendshipStatus = async (currentUserId: number, targetUserId: number) => {
    try {
      console.log(`🚀 [UserProfile] Loading friendship status between ${currentUserId} and ${targetUserId}`);
      const response = await userAPI.getFriendshipStatus(currentUserId, targetUserId);
      console.log(`✅ [UserProfile] Friendship status raw response:`, response);
      
      // Handle different response formats from backend
      let status: {
        isFriend: boolean;
        hasPendingRequest: boolean;
        requestId?: number;
        requesterId?: number;
        receiverId?: number;
      };
      
      // Check if backend returns {status: "accepted"} format
      if (typeof response === 'object' && 'status' in response) {
        const backendStatus = (response as any).status;
        status = {
          isFriend: backendStatus === 'accepted',
          hasPendingRequest: backendStatus === 'pending',
          requestId: (response as any).id,
          requesterId: (response as any).requesterId,
          receiverId: (response as any).receiverId,
        };
      } else {
        // Use the response as-is if it matches our expected format
        status = response as any;
      }
      
      console.log(`✅ [UserProfile] Processed friendship status:`, status);
      setFriendshipStatus(status);
    } catch (error: any) {
      console.error('❌ [UserProfile] Friendship status loading error:', error);
      // Set default status on error
      setFriendshipStatus({
        isFriend: false,
        hasPendingRequest: false,
      });
    }
  };

  const loadFriends = async (userId: number) => {
    try {
      setFriendsLoading(true);
      console.log(`🚀 [UserProfile] Loading friends for user ${userId}`);
      const friendsData = await userAPI.getFriends(userId);
      console.log(`✅ [UserProfile] Friends loaded (raw):`, friendsData);
      console.log(`✅ [UserProfile] Friends count:`, friendsData.length);
      setFriends(friendsData);
    } catch (error: any) {
      console.error('❌ [UserProfile] Friends loading error:', error);
      const status = error.response?.status;
      if (status === 404) {
        console.log('[UserProfile] Friends not found (404) - setting empty array');
        setFriends([]);
      } else {
        console.log('[UserProfile] Error loading friends - setting empty array');
        setFriends([]);
      }
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadPendingRequestsCount = async (userId: number) => {
    try {
      console.log(`🚀 [UserProfile] Loading pending friend requests count for user ${userId}`);
      const requests = await userAPI.getPendingFriendRequests(userId);
      console.log(`✅ [UserProfile] Pending requests count:`, requests.length);
      setPendingRequestsCount(requests.length);
    } catch (error: any) {
      console.error('❌ [UserProfile] Error loading pending requests count:', error);
      setPendingRequestsCount(0);
    }
  };

  const loadPendingGroupInvitesCount = async (userId: number) => {
    try {
      console.log(`🚀 [UserProfile] Loading pending group invites count for user ${userId}`);
      const invites = await groupAPI.getPendingInvitationsForUser(userId);
      console.log(`✅ [UserProfile] Pending group invites count:`, invites.length);
      setPendingGroupInvitesCount(invites.length);
    } catch (error: any) {
      console.error('❌ [UserProfile] Error loading pending group invites count:', error);
      setPendingGroupInvitesCount(0);
    }
  };

  // Fetch user groups when groups tab is active
  const fetchUserGroups = async () => {
    if (!user) return;
    
    setGroupsLoading(true);
    try {
      const groups = await groupAPI.getUserGroups(user.id);
      setUserGroups(groups);
    } catch (error: any) {
      console.error('Error fetching user groups:', error);
      setUserGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser || !user) return;

    try {
      console.log(`🚀 [UserProfile] Sending friend request from ${currentUser.id} to ${user.id}`);
      await userAPI.sendFriendRequest(currentUser.id, user.id);
      console.log(`✅ [UserProfile] Friend request sent successfully`);
      
      // Update local state
      setFriendshipStatus({
        isFriend: false,
        hasPendingRequest: true,
        requesterId: currentUser.id,
        receiverId: user.id,
      });
      
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (error: any) {
      console.error('❌ [UserProfile] Error sending friend request:', error);
      Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn');
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!currentUser || !user || !friendshipStatus?.requestId) return;

    Alert.alert(
      'Hủy lời mời',
      'Bạn có chắc chắn muốn hủy lời mời kết bạn?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lời mời',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚀 [UserProfile] Cancelling friend request ${friendshipStatus.requestId}`);
              await userAPI.respondToFriendRequest(friendshipStatus.requestId!, 'rejected');
              console.log(`✅ [UserProfile] Friend request cancelled`);
              
              // Update local state
              setFriendshipStatus({
                isFriend: false,
                hasPendingRequest: false,
              });
              
              Alert.alert('Thành công', 'Đã hủy lời mời kết bạn');
            } catch (error: any) {
              console.error('❌ [UserProfile] Error cancelling friend request:', error);
              Alert.alert('Lỗi', 'Không thể hủy lời mời kết bạn');
            }
          }
        }
      ]
    );
  };

  const handleUnfriend = async () => {
    if (!currentUser || !user) return;

    Alert.alert(
      'Hủy kết bạn',
      `Bạn có chắc chắn muốn hủy kết bạn với ${user.fullName}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy kết bạn',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚀 [UserProfile] Unfriending user ${user.id}`);
              await userAPI.unfriend(currentUser.id, user.id);
              console.log(`✅ [UserProfile] Unfriended successfully`);
              
              // Update local state
              setFriendshipStatus({
                isFriend: false,
                hasPendingRequest: false,
              });
              
              // Remove from friends list (friends is now User[], not FriendRequest[])
              setFriends(prevFriends => 
                prevFriends.filter(f => f.id !== user.id)
              );
              
              Alert.alert('Thành công', 'Đã hủy kết bạn');
            } catch (error: any) {
              console.error('❌ [UserProfile] Error unfriending:', error);
              Alert.alert('Lỗi', 'Không thể hủy kết bạn');
            }
          }
        }
      ]
    );
  };

  const handleUnfriendFromList = async (friendId: number, friendName: string) => {
    if (!currentUser) return;

    Alert.alert(
      'Hủy kết bạn',
      `Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy kết bạn',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚀 [UserProfile] Unfriending user ${friendId} from list`);
              await userAPI.unfriend(currentUser.id, friendId);
              console.log(`✅ [UserProfile] Unfriended successfully`);
              
              // Remove from friends list (friends is now User[], not FriendRequest[])
              setFriends(prevFriends => 
                prevFriends.filter(f => f.id !== friendId)
              );
              
              Alert.alert('Thành công', 'Đã hủy kết bạn');
            } catch (error: any) {
              console.error('❌ [UserProfile] Error unfriending from list:', error);
              Alert.alert('Lỗi', 'Không thể hủy kết bạn');
            }
          }
        }
      ]
    );
  };

  const handleFollow = async () => {
    if (!currentUser || !user) return;

    try {
      console.log(`🚀 [UserProfile] Following user ${user.id}`);
      await userAPI.followUser(currentUser.id, user.id);
      console.log(`✅ [UserProfile] Followed successfully`);
      
      // Update local state
      setUser(prev => prev ? { ...prev, isFollowing: true, followersCount: (prev.followersCount || 0) + 1 } : null);
      
      Alert.alert('Thành công', `Đã theo dõi ${user.fullName}`);
    } catch (error: any) {
      console.error('❌ [UserProfile] Error following user:', error);
      Alert.alert('Lỗi', 'Không thể theo dõi người dùng này');
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !user) return;

    Alert.alert(
      'Bỏ theo dõi',
      `Bạn có chắc chắn muốn bỏ theo dõi ${user.fullName}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Bỏ theo dõi',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚀 [UserProfile] Unfollowing user ${user.id}`);
              await userAPI.unfollowUser(currentUser.id, user.id);
              console.log(`✅ [UserProfile] Unfollowed successfully`);
              
              // Update local state
              setUser(prev => prev ? { ...prev, isFollowing: false, followersCount: Math.max((prev.followersCount || 0) - 1, 0) } : null);
              
              Alert.alert('Thành công', 'Đã bỏ theo dõi');
            } catch (error: any) {
              console.error('❌ [UserProfile] Error unfollowing user:', error);
              Alert.alert('Lỗi', 'Không thể bỏ theo dõi người dùng này');
            }
          }
        }
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const handlePostUpdated = (updatedPost: PostResponse) => {
    console.log(`🔄 [Profile] Post updated:`, updatedPost);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    updatePost(updatedPost.id, updatedPost);
  };

  const handlePostDeleted = (postId: number) => {
    console.log(`🗑️ [Profile] Post deleted:`, postId);
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    // Update PostContext to mark post as deleted
    updatePost(postId, { isDeleted: true });
  };

  const handlePostLikeToggle = (postId: number, isLiked: boolean) => {
    console.log(`❤️ [Profile] Post ${postId} like toggled:`, isLiked);
    // PostCard already calls updatePostLike, so we only update local state
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked, 
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1 
            }
          : post
      )
    );
  };

  const handlePostShareToggle = (postId: number, isShared: boolean) => {
    console.log(`🔄 [Profile] Post ${postId} share toggled:`, isShared);
    // PostCard already calls updatePostShare, so we only update local state
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isShared, 
              shareCount: isShared ? post.shareCount + 1 : post.shareCount - 1 
            }
          : post
      )
    );
  };

  const handleUnsharePost = async (postId: number) => {
    if (!user || !currentUser) return;

    Alert.alert(
      'Bỏ chia sẻ',
      'Bạn có chắc chắn muốn bỏ chia sẻ bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ chia sẻ',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚀 [Profile] Unsharing post ${postId} for user ${currentUser.id}`);
              await shareAPI.unsharePost(currentUser.id, postId);
              
              // Remove from shared posts list
              setSharedPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              
              // Update share count in original posts list
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === postId 
                    ? { 
                        ...post, 
                        isShared: false,
                        shareCount: Math.max(0, post.shareCount - 1)
                      }
                    : post
                )
              );
              
              // Update global context
              updatePostShare(postId, false);
              
              console.log(`✅ [Profile] Successfully unshared post ${postId}`);
              
              // Reload profile data to ensure consistency
              setTimeout(async () => {
                try {
                  console.log('🔄 [Profile] Reloading profile data after unshare...');
                  await fetchUserProfile();
                } catch (error) {
                  console.error('❌ [Profile] Error reloading profile:', error);
                }
              }, 1000);
            } catch (error: any) {
              console.error('❌ [Profile] Error unsharing post:', error);
              
              // Handle case where post was already unshared
              if (error.message?.includes('đã được bỏ chia sẻ') || 
                  error.message?.includes('không tồn tại')) {
                console.log(`✅ [Profile] Post ${postId} was already unshared, updating UI`);
                
                // Remove from shared posts list anyway
                setSharedPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                
                // Update share count in original posts list
                setPosts(prevPosts => 
                  prevPosts.map(post => 
                    post.id === postId 
                      ? { 
                          ...post, 
                          isShared: false,
                          shareCount: Math.max(0, post.shareCount - 1)
                        }
                      : post
                  )
                );
                
                // Update global context
                updatePostShare(postId, false);
                
                // Reload profile data to ensure consistency
                setTimeout(async () => {
                  try {
                    console.log('🔄 [Profile] Reloading profile data after unshare...');
                    await fetchUserProfile();
                  } catch (error) {
                    console.error('❌ [Profile] Error reloading profile:', error);
                  }
                }, 1000);
                
                Alert.alert('Thành công', 'Đã bỏ chia sẻ bài viết');
                return;
              }
              
              Alert.alert('Lỗi', error.message || 'Không thể bỏ chia sẻ bài viết');
            }
          }
        }
      ]
    );
  };

  const handleCommentCountUpdate = (postId: number, commentCount: number) => {
    console.log(`💬 [Profile] Post ${postId} comment count updated:`, commentCount);
    updatePostComment(postId, commentCount);
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, commentCount } : post
      )
    );
  };

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Không xác định được người dùng.');
      return;
    }
    
    try {
      setSaving(true);
      
      // Tính ISO thực từ ngày/tháng/năm nếu có đủ dữ liệu
      let isoDob = form.dateOfBirth;
      if (dobDay && dobMonth && dobYear) {
        const d = new Date(
          Number(dobYear),
          Number(dobMonth) - 1,
          Number(dobDay)
        );
        if (!isNaN(d.getTime())) {
          isoDob = d.toISOString();
        }
      }

      const payload: UpdateUserPayload = {
        fullName: form.fullName,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        coverImageUrl: form.coverImageUrl,
        phoneNumber: form.phoneNumber,
        dateOfBirth: isoDob,
        location: form.location,
      };
      
      console.log('🚀 [Profile] Updating user profile:', payload);
      const updatedUser = await userAPI.updateUser(user.id, payload);
      console.log('✅ [Profile] Profile updated successfully:', updatedUser);
      
      // Update local user state
      setUser(updatedUser);
      
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công.');
      setEditVisible(false);
      
      // Reload profile to get fresh data
      await fetchUserProfile(user.id.toString());
    } catch (e: any) {
      console.error('❌ [Profile] Update error:', e);
      Alert.alert('Lỗi', e?.response?.data?.message || 'Cập nhật không thành công.');
    } finally {
      setSaving(false);
    }
  };

  const renderPostItem = ({ item }: { item: PostResponse }) => (
    <PostCard
      postData={item}
      onPostUpdated={handlePostUpdated}
      onPostDeleted={handlePostDeleted}
      onLikeToggle={handlePostLikeToggle}
      onShareToggle={handlePostShareToggle}
      onCommentCountUpdate={handleCommentCountUpdate}
      showImage={true}
    />
  );

  const renderSharedPostItem = ({ item }: { item: PostResponse }) => (
    <View style={styles.sharedPostContainer}>
      <PostCard
        postData={item}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        onLikeToggle={handlePostLikeToggle}
        onShareToggle={handlePostShareToggle}
        onCommentCountUpdate={handleCommentCountUpdate}
        showImage={true}
      />
    </View>
  );

  const renderListHeader = () => (
    <>
      {/* Cover Image */}
      <View style={styles.coverImageContainer}>
        {user?.coverImageUrl ? (
          <Image source={{ uri: user.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverImage} />
        )}
        
        {/* Avatar - Overlapping with cover image */}
        <View style={styles.avatarContainer}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.bio}>
          {user?.bio || 'Chưa có tiểu sử'}
        </Text>

        <View style={styles.infoRow}>
          <Mail size={16} color={COLORS.darkGray} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>

        {user?.phoneNumber && (
          <View style={styles.infoRow}>
            <Phone size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{user.phoneNumber}</Text>
          </View>
        )}

        {user?.location && (
          <View style={styles.infoRow}>
            <MapPin size={16} color={COLORS.darkGray} />
            <Text style={styles.infoText}>{user.location}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Calendar size={16} color={COLORS.darkGray} />
          <Text style={styles.infoText}>
            Tham gia {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
          </Text>
        </View>

        <View style={styles.stats}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              console.log('👆 [Profile] Posts stat pressed');
              setActiveTab('posts');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{posts.length + sharedPosts.length}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
            {/* Debug: Show posts count */}
            {__DEV__ && (
              <Text style={{ fontSize: 10, color: 'red' }}>
                Debug: {posts.length} created + {sharedPosts.length} shared = {posts.length + sharedPosts.length} total
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              console.log('👆 [Profile] Followers stat pressed');
              console.log('👆 [Profile] Navigating to followers screen');
              router.push(`/followers?id=${user?.id}` as any);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{user?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              console.log('👆 [Profile] Following stat pressed');
              console.log('👆 [Profile] Navigating to following screen');
              router.push(`/following?id=${user?.id}` as any);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Button - Only show for current user */}
        {currentUser && user && currentUser.id === user.id && (
          <TouchableOpacity 
            style={styles.editProfileButton} 
            onPress={() => setEditVisible(true)}
            activeOpacity={0.7}
          >
            <Edit3 size={18} color={COLORS.white} />
            <Text style={styles.editProfileButtonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        )}

        {/* Friend Action Button - Show for other users */}
        {currentUser && user && currentUser.id !== user.id && friendshipStatus && (
          <View style={styles.friendActionContainer}>
            {friendshipStatus.isFriend ? (
              <TouchableOpacity 
                style={[styles.friendActionButton, styles.friendButton]} 
                onPress={handleUnfriend}
                activeOpacity={0.7}
              >
                <Users size={18} color={COLORS.white} />
                <Text style={styles.friendActionButtonText}>Bạn bè</Text>
              </TouchableOpacity>
            ) : friendshipStatus.hasPendingRequest ? (
              <TouchableOpacity 
                style={[styles.friendActionButton, styles.pendingButton]} 
                onPress={handleCancelFriendRequest}
                activeOpacity={0.7}
              >
                <Text style={styles.friendActionButtonText}>Đang chờ phản hồi</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.friendActionButton, styles.addFriendButton]} 
                onPress={handleSendFriendRequest}
                activeOpacity={0.7}
              >
                <Users size={18} color={COLORS.white} />
                <Text style={styles.friendActionButtonText}>Thêm bạn bè</Text>
          </TouchableOpacity>
            )}
          </View>
        )}

        {/* Follow Action Button - Show for other users */}
        {currentUser && user && currentUser.id !== user.id && (
          <View style={styles.followActionContainer}>
            {user.isFollowing ? (
              <TouchableOpacity 
                style={[styles.followActionButton, styles.unfollowButton]} 
                onPress={handleUnfollow}
                activeOpacity={0.7}
              >
                <UserIcon size={18} color={COLORS.white} />
                <Text style={styles.followActionButtonText}>Bỏ theo dõi</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.followActionButton, styles.followButton]} 
                onPress={handleFollow}
                activeOpacity={0.7}
              >
                <UserIcon size={18} color={COLORS.white} />
                <Text style={styles.followActionButtonText}>Theo dõi</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => {
            console.log('👆 [Profile] Posts tab pressed');
            setActiveTab('posts');
          }}
          activeOpacity={0.7}
        >
          <Grid size={20} color={activeTab === 'posts' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Bài viết
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
          onPress={() => {
            console.log('👆 [Profile] Shared tab pressed');
            setActiveTab('shared');
          }}
          activeOpacity={0.7}
        >
          <Share2 size={20} color={activeTab === 'shared' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.tabText, activeTab === 'shared' && styles.activeTabText]}>
            Đã chia sẻ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => {
            console.log('👆 [Profile] Friends tab pressed');
            setActiveTab('friends');
          }}
          activeOpacity={0.7}
        >
          <UserIcon size={20} color={activeTab === 'friends' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Bạn bè
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => {
            console.log('👆 [Profile] Groups tab pressed');
            setActiveTab('groups');
          }}
          activeOpacity={0.7}
        >
          <Users size={20} color={activeTab === 'groups' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Nhóm
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFriendItem = ({ item }: { item: User }) => {
    if (!currentUser || !user) return null;
    
    // item is already the friend User object
    const friendUser = item;
    
    return (
      <View style={styles.friendItem}>
        <TouchableOpacity
          style={styles.friendItemLeft}
          onPress={() => {
            console.log(`👆 [Profile] Friend item pressed, navigating to user ${friendUser.id}`);
            router.push({
              pathname: '/profile',
              params: { userId: friendUser.id.toString() }
            } as any);
          }}
          activeOpacity={0.7}
        >
          {friendUser.avatarUrl ? (
            <Image source={{ uri: friendUser.avatarUrl }} style={styles.friendAvatar} />
          ) : (
            <View style={[styles.friendAvatar, styles.friendAvatarPlaceholder]}>
              <UserIcon size={24} color={COLORS.gray} />
            </View>
          )}
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friendUser.fullName}</Text>
            {friendUser.bio && <Text style={styles.friendBio} numberOfLines={1}>{friendUser.bio}</Text>}
          </View>
        </TouchableOpacity>

        {/* Unfriend button - only show on own profile */}
        {currentUser.id === user.id && (
          <TouchableOpacity
            style={styles.unfriendButton}
            onPress={() => handleUnfriendFromList(friendUser.id, friendUser.fullName)}
            activeOpacity={0.7}
          >
            <Text style={styles.unfriendButtonText}>Bạn bè</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (activeTab === 'posts') {
      return (
        <View style={styles.emptyPostsContainer}>
          <Grid size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          {currentUser && user && currentUser.id === user.id && (
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => router.push('/(tabs)/create' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.createPostButtonText}>Tạo bài viết đầu tiên</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    } else if (activeTab === 'shared') {
      return (
        <View style={styles.emptyPostsContainer}>
          <Share2 size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>Chưa chia sẻ bài viết nào</Text>
          <Text style={styles.emptySubText}>
            Hãy chia sẻ bài viết từ trang chủ!
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyPostsContainer}>
          <Users size={48} color={COLORS.gray} />
          <Text style={styles.emptyText}>Chưa có bạn bè nào</Text>
          <Text style={styles.emptySubText}>
            Hãy kết bạn để mở rộng mạng lưới của bạn!
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header with logout button even when no user data */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          {currentUser ? (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải thông tin người dùng</Text>
          <Text style={styles.errorSubText}>Vui lòng thử lại sau hoặc đăng xuất</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (userId) {
                const actualUserId = Array.isArray(userId) ? userId[0] : userId;
                fetchUserProfile(actualUserId);
              } else if (currentUser) {
                fetchUserProfile(currentUser.id.toString());
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLoading = activeTab === 'posts' ? postsLoading : activeTab === 'shared' ? sharedPostsLoading : activeTab === 'friends' ? friendsLoading : activeTab === 'groups' ? groupsLoading : false;



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.fullName}</Text>
        <View style={styles.headerRight}>
        {currentUser && user && currentUser.id === user.id ? (
            <>
              {/* Notifications Bell Icon with Badge */}
              <TouchableOpacity 
                style={styles.bellButton} 
                onPress={() => {
                  console.log('👆 [Profile] Notifications button pressed');
                  // Show options for friend requests and group invites
                  Alert.alert(
                    'Thông báo',
                    'Chọn loại thông báo',
                    [
                      {
                        text: `Lời mời kết bạn (${pendingRequestsCount})`,
                        onPress: () => router.push('/friend-requests' as any),
                      },
                      {
                        text: `Lời mời nhóm (${pendingGroupInvitesCount})`,
                        onPress: () => router.push('/group-invitations' as any),
                      },
                      { text: 'Hủy', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Bell size={22} color={COLORS.text.primary} />
                {(pendingRequestsCount + pendingGroupInvitesCount) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {(pendingRequestsCount + pendingGroupInvitesCount) > 99 
                        ? '99+' 
                        : (pendingRequestsCount + pendingGroupInvitesCount)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          ) : currentUser ? (
            <TouchableOpacity 
              style={styles.myProfileButton} 
              onPress={() => {
                console.log('👆 [Profile] My Profile button pressed, navigating to own profile');
                router.push({
                  pathname: '/profile',
                  params: { userId: currentUser.id.toString() }
                } as any);
              }}
              activeOpacity={0.7}
            >
              {currentUser.avatarUrl ? (
                <Image source={{ uri: currentUser.avatarUrl }} style={styles.myProfileAvatar} />
              ) : (
                <View style={styles.myProfileAvatarPlaceholder}>
                  <UserIcon size={20} color={COLORS.primary} />
                </View>
              )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        </View>
      </View>

      {/* Main FlatList with Profile as Header */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {activeTab === 'posts' 
              ? 'Đang tải bài viết...' 
              : activeTab === 'shared' 
                ? 'Đang tải bài viết đã chia sẻ...'
                : activeTab === 'friends'
                  ? 'Đang tải danh sách bạn bè...'
                  : 'Đang tải danh sách nhóm...'}
          </Text>
        </View>
      ) : activeTab === 'posts' ? (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsList}
          style={styles.mainFlatList}
        />
      ) : activeTab === 'shared' ? (
        <FlatList
          data={sharedPosts}
          renderItem={renderSharedPostItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsList}
          style={styles.mainFlatList}
        />
      ) : activeTab === 'friends' ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => `friend-${item.id}`}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsList}
          style={styles.mainFlatList}
        />
      ) : (
        <FlatList
          data={userGroups}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              style={styles.groupItem}
              onPress={() => router.push(`/group-detail?id=${item.id}`)}
            >
              <View style={styles.groupItemAvatar}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.groupItemAvatarImage} />
                ) : (
                  <Users size={24} color={COLORS.white} />
                )}
              </View>
              <View style={styles.groupItemInfo}>
                <Text style={styles.groupItemName}>{item.name}</Text>
                <Text style={styles.groupItemMembers}>{item.memberCount} thành viên</Text>
                {item.description && (
                  <Text style={styles.groupItemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.groupItemMeta}>
                  <Text style={styles.groupItemPrivacy}>
                    {item.privacy === 'private' ? 'Riêng tư' : 'Công khai'}
                  </Text>
                  <Text style={styles.groupItemSeparator}>•</Text>
                  <Text style={styles.groupItemDate}>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `group-${item.id}`}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Users size={64} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {currentUser && user && currentUser.id === user.id 
                  ? 'Chưa tham gia nhóm nào'
                  : 'Người dùng này chưa tham gia nhóm nào'
                }
              </Text>
              {currentUser && user && currentUser.id === user.id && (
                <TouchableOpacity 
                  style={styles.createGroupButton}
                  onPress={() => router.push('/create-group')}
                >
                  <Text style={styles.createGroupButtonText}>Tạo nhóm mới</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsList}
          style={styles.mainFlatList}
        />
      )}

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Họ tên</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(t) => setForm({ ...form, fullName: t })}
                  placeholder="Nhập họ tên"
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tiểu sử</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.bio}
                  onChangeText={(t) => setForm({ ...form, bio: t })}
                  placeholder="Giới thiệu bản thân"
                  placeholderTextColor={COLORS.gray}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ảnh đại diện</Text>
                {form.avatarUrl ? (
                  <Image source={{ uri: form.avatarUrl }} style={styles.previewImage} />
                ) : null}
                <SimpleImageUploader
                  folder="avatars"
                  onUploadComplete={(res: any) => {
                    console.log('ProfileScreen: Upload response:', res);
                    const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                    console.log('ProfileScreen: Extracted URL:', url);
                    if (url) {
                      setForm({ ...form, avatarUrl: url });
                    } else {
                      console.error('ProfileScreen: No URL found in upload response');
                    }
                  }}
                  onUploadError={(error: any) => {
                    console.error('ProfileScreen: Upload error:', error);
                    Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ảnh bìa</Text>
                {form.coverImageUrl ? (
                  <Image source={{ uri: form.coverImageUrl }} style={styles.previewCover} />
                ) : null}
                <SimpleImageUploader
                  folder="covers"
                  onUploadComplete={(res: any) => {
                    console.log('ProfileScreen: Cover upload response:', res);
                    const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
                    console.log('ProfileScreen: Extracted cover URL:', url);
                    if (url) {
                      setForm({ ...form, coverImageUrl: url });
                    } else {
                      console.error('ProfileScreen: No URL found in cover upload response');
                    }
                  }}
                  onUploadError={(error: any) => {
                    console.error('ProfileScreen: Cover upload error:', error);
                    Alert.alert('Lỗi', 'Không thể tải lên ảnh bìa');
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={form.phoneNumber}
                  onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngày sinh</Text>
                <View style={styles.dobRow}>
                  <TextInput
                    style={[styles.input, styles.dobInput]}
                    value={dobDay}
                    onChangeText={(t) => {
                      setDobDay(t.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="DD"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dobInput]}
                    value={dobMonth}
                    onChangeText={(t) => {
                      setDobMonth(t.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="MM"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dobInputYear]}
                    value={dobYear}
                    onChangeText={(t) => {
                      setDobYear(t.replace(/[^0-9]/g, ''));
                    }}
                    placeholder="YYYY"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
                <Text style={styles.helperText}>Định dạng: ngày/tháng/năm</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Địa điểm</Text>
                <TextInput
                  style={styles.input}
                  value={form.location}
                  onChangeText={(t) => setForm({ ...form, location: t })}
                  placeholder="Ví dụ: Hà Nội"
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.cancelBtn]} 
                onPress={() => setEditVisible(false)} 
                disabled={saving}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  } as ViewStyle,
  mainFlatList: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  } as ViewStyle,
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  } as TextStyle,
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  myProfileButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
  } as ViewStyle,
  myProfileAvatar: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  myProfileAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    marginTop: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
  } as TextStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  errorText: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  errorSubText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.lg,
  } as TextStyle,
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.xl,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  retryButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  coverImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
    position: 'relative',
    zIndex: 50, // Higher than profileInfo but lower than avatar
  } as ViewStyle,
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.primary + '40',
  } as ImageStyle,
  profileInfo: {
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    paddingTop: 70, // Space for avatar overlap (60px + 10px spacing)
    zIndex: 1, // Lower than avatar
    position: 'relative',
  } as ViewStyle,
  avatarContainer: {
    position: 'absolute',
    bottom: -60, // Avatar overlap: 60px below cover image
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100, // Ensure avatar appears above profileInfo
    elevation: 100, // For Android
  } as ViewStyle,
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    borderWidth: 5,
    borderColor: COLORS.white,
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  } as ImageStyle,
  name: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.xs, // Small space below avatar
    marginBottom: RESPONSIVE_SPACING.xs,
  } as TextStyle,
  bio: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  infoText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.darkGray,
  } as TextStyle,
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent',
  } as ViewStyle,
  statNumber: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  } as TextStyle,
  statLabel: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  } as TextStyle,
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border.primary,
  } as ViewStyle,
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    gap: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  } as ViewStyle,
  tabText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  } as TextStyle,
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  } as TextStyle,
  emptyText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  } as TextStyle,
  emptySubText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: RESPONSIVE_SPACING.xs,
    textAlign: 'center',
  } as TextStyle,
  sharedPostContainer: {
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  postsContainer: {
    flex: 1,
  } as ViewStyle,
  postsList: {
    paddingBottom: RESPONSIVE_SPACING.lg,
  } as ViewStyle,
  emptyPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  createPostButton: {
    marginTop: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  } as ViewStyle,
  createPostButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.white,
    fontWeight: '600',
  } as TextStyle,
  friendsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xl,
    minHeight: 200,
  } as ViewStyle,
  friendsTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as TextStyle,
  friendsSubtitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  } as TextStyle,
  friendsHint: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  } as TextStyle,
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.md,
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  editProfileButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: RESPONSIVE_SPACING.lg,
    maxHeight: '80%',
  } as ViewStyle,
  modalTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  } as TextStyle,
  modalScrollView: {
    maxHeight: 480,
  } as ViewStyle,
  formGroup: {
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  label: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: RESPONSIVE_SPACING.xs,
    fontWeight: '500',
  } as TextStyle,
  input: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.white,
    color: COLORS.text.primary,
    fontSize: RESPONSIVE_FONT_SIZES.md,
  } as TextStyle,
  textArea: {
    height: 88,
    textAlignVertical: 'top',
  } as TextStyle,
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.lightGray,
  } as ImageStyle,
  previewCover: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.lightGray,
  } as ImageStyle,
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  dobInput: {
    flex: 1,
  } as TextStyle,
  dobInputYear: {
    flex: 2,
  } as TextStyle,
  helperText: {
    marginTop: RESPONSIVE_SPACING.xs,
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  } as TextStyle,
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: RESPONSIVE_SPACING.sm,
    marginTop: RESPONSIVE_SPACING.md,
    paddingTop: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  } as ViewStyle,
  actionBtn: {
    height: 44,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  } as ViewStyle,
  cancelBtn: {
    backgroundColor: COLORS.background.secondary,
  } as ViewStyle,
  saveBtn: {
    backgroundColor: COLORS.primary,
  } as ViewStyle,
  cancelText: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: RESPONSIVE_FONT_SIZES.md,
  } as TextStyle,
  saveText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: RESPONSIVE_FONT_SIZES.md,
  } as TextStyle,
  friendActionContainer: {
    marginTop: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  friendActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  addFriendButton: {
    backgroundColor: COLORS.primary,
  } as ViewStyle,
  friendButton: {
    backgroundColor: COLORS.darkGray,
  } as ViewStyle,
  pendingButton: {
    backgroundColor: COLORS.gray,
  } as ViewStyle,
  friendActionButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  followActionContainer: {
    marginTop: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  followActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    gap: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  followButton: {
    backgroundColor: COLORS.success,
  } as ViewStyle,
  unfollowButton: {
    backgroundColor: COLORS.accent.danger,
  } as ViewStyle,
  followActionButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    marginBottom: RESPONSIVE_SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  } as ViewStyle,
  friendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    marginRight: RESPONSIVE_SPACING.md,
  } as ImageStyle,
  friendAvatarPlaceholder: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  friendInfo: {
    flex: 1,
  } as ViewStyle,
  friendName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  } as TextStyle,
  friendBio: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
  } as TextStyle,
  unfriendButton: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  unfriendButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  groupItemAvatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  groupItemInfo: {
    flex: 1,
  } as ViewStyle,
  groupItemName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  } as TextStyle,
  groupItemMembers: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.gray,
    marginBottom: 4,
  } as TextStyle,
  groupItemAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
  } as ImageStyle,
  groupItemDescription: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  } as TextStyle,
  groupItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  groupItemPrivacy: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  } as TextStyle,
  groupItemSeparator: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    marginHorizontal: 6,
  } as TextStyle,
  groupItemDate: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  } as TextStyle,
  createGroupButton: {
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  createGroupButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RESPONSIVE_SPACING.xl * 2,
  } as ViewStyle,
});