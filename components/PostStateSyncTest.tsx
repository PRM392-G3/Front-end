import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { usePostContext } from '@/contexts/PostContext';
import { PostResponse, postAPI } from '@/services/api';

interface PostStateSyncTestProps {
  testPostId?: number;
}

export const PostStateSyncTest: React.FC<PostStateSyncTestProps> = ({ testPostId = 1 }) => {
  const {
    updatePostLike,
    updatePostShare,
    updatePostComment,
    getPostLikeState,
    getPostShareState,
    getPostCommentState,
    syncPostState,
    getSyncedPost,
    clearStates
  } = usePostContext();

  const [testPost, setTestPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTestPost();
  }, [testPostId]);

  const loadTestPost = async () => {
    try {
      setLoading(true);
      const posts = await postAPI.getAllPostsWithLikes();
      const post = posts.find(p => p.id === testPostId) || posts[0];
      if (post) {
        setTestPost(post);
        // Initialize state in context
        syncPostState(post.id, {
          isLiked: post.isLiked,
          isShared: post.isShared,
          likeCount: post.likeCount,
          shareCount: post.shareCount,
          commentCount: post.commentCount
        });
      }
    } catch (error) {
      console.error('Error loading test post:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết test');
    } finally {
      setLoading(false);
    }
  };

  const testLikeToggle = () => {
    if (!testPost) return;
    
    const currentLikeState = getPostLikeState(testPost.id);
    const newIsLiked = !currentLikeState?.isLiked;
    
    updatePostLike(testPost.id, newIsLiked);
    
    Alert.alert(
      'Test Like Toggle',
      `Post ${testPost.id} like state changed to: ${newIsLiked}`,
      [{ text: 'OK' }]
    );
  };

  const testShareToggle = () => {
    if (!testPost) return;
    
    const currentShareState = getPostShareState(testPost.id);
    const newIsShared = !currentShareState?.isShared;
    
    updatePostShare(testPost.id, newIsShared);
    
    Alert.alert(
      'Test Share Toggle',
      `Post ${testPost.id} share state changed to: ${newIsShared}`,
      [{ text: 'OK' }]
    );
  };

  const testCommentUpdate = () => {
    if (!testPost) return;
    
    const currentCommentState = getPostCommentState(testPost.id);
    const newCommentCount = (currentCommentState?.commentCount || testPost.commentCount) + 1;
    
    updatePostComment(testPost.id, newCommentCount);
    
    Alert.alert(
      'Test Comment Update',
      `Post ${testPost.id} comment count updated to: ${newCommentCount}`,
      [{ text: 'OK' }]
    );
  };

  const testStateSync = () => {
    if (!testPost) return;
    
    const syncedPost = getSyncedPost(testPost.id);
    const likeState = getPostLikeState(testPost.id);
    const shareState = getPostShareState(testPost.id);
    const commentState = getPostCommentState(testPost.id);
    
    const message = `
Post ${testPost.id} State Sync Test:
- Original: Like: ${testPost.isLiked}, Share: ${testPost.isShared}, Comments: ${testPost.commentCount}
- Synced: Like: ${syncedPost?.isLiked}, Share: ${syncedPost?.isShared}, Comments: ${syncedPost?.commentCount}
- Like State: ${JSON.stringify(likeState)}
- Share State: ${JSON.stringify(shareState)}
- Comment State: ${JSON.stringify(commentState)}
    `;
    
    Alert.alert('State Sync Test', message, [{ text: 'OK' }]);
  };

  const clearAllStates = async () => {
    await clearStates();
    Alert.alert('States Cleared', 'All post states have been cleared from context and storage');
  };

  if (loading || !testPost) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading test post...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Post State Sync Test</Text>
      
      <View style={styles.postInfo}>
        <Text style={styles.postTitle}>Test Post: {testPost.id}</Text>
        <Text style={styles.postContent}>{testPost.content.substring(0, 100)}...</Text>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            Likes: {getPostLikeState(testPost.id)?.likeCount || testPost.likeCount}
          </Text>
          <Text style={styles.statText}>
            Shares: {getPostShareState(testPost.id)?.shareCount || testPost.shareCount}
          </Text>
          <Text style={styles.statText}>
            Comments: {getPostCommentState(testPost.id)?.commentCount || testPost.commentCount}
          </Text>
        </View>
      </View>

      <View style={styles.testButtons}>
        <TouchableOpacity style={styles.testButton} onPress={testLikeToggle}>
          <Text style={styles.testButtonText}>Test Like Toggle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testShareToggle}>
          <Text style={styles.testButtonText}>Test Share Toggle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testCommentUpdate}>
          <Text style={styles.testButtonText}>Test Comment Update</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testStateSync}>
          <Text style={styles.testButtonText}>Test State Sync</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.testButton, styles.clearButton]} onPress={clearAllStates}>
          <Text style={styles.testButtonText}>Clear All States</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instructionText}>
        Instructions:
        {'\n'}1. Test each button to see state changes
        {'\n'}2. Navigate to other screens and return
        {'\n'}3. Check if states persist across screens
        {'\n'}4. Reload the app to test storage persistence
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.lg,
  },
  postInfo: {
    backgroundColor: COLORS.background.secondary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  postTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  postContent: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: RESPONSIVE_SPACING.sm,
  },
  statText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.accent.primary,
    fontWeight: '500',
  },
  testButtons: {
    gap: RESPONSIVE_SPACING.sm,
  },
  testButton: {
    backgroundColor: COLORS.accent.primary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: COLORS.error,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: RESPONSIVE_SPACING.lg,
    lineHeight: 20,
  },
});

export default PostStateSyncTest;
