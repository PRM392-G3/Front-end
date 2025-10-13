import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS, SAFE_AREA, DIMENSIONS } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoogleOAuthDebug from '@/components/GoogleOAuthDebug';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Content Feed */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        contentInsetAdjustmentBehavior="automatic"
        bounces={true}
        alwaysBounceVertical={false}
      >
        <View style={styles.storiesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TouchableOpacity key={item} style={styles.storyItem}>
                <View style={styles.storyAvatar} />
                <Text style={styles.storyText}>Story {item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Debug Section */}
        <GoogleOAuthDebug />

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Bài viết mới nhất</Text>
          <PostCard 
            showImage={true} 
            imageUrl="https://picsum.photos/400/300?random=1"
            postData={{
              id: 1,
              content: "Hôm nay thật tuyệt vời! Cảm ơn mọi người đã ủng hộ. 🌟 #nexora #happiness",
              imageUrl: "https://picsum.photos/400/300?random=1",
              user: {
                fullName: "Nguyễn Văn A",
                avatarUrl: "https://picsum.photos/100/100?random=1"
              },
              createdAt: new Date().toISOString(),
              likesCount: 24,
              commentsCount: 8,
              isLiked: false
            }}
          />
          <PostCard 
            showImage={false}
            postData={{
              id: 2,
              content: "Chia sẻ một số suy nghĩ về cuộc sống và công việc. Hy vọng mọi người sẽ thích! 💭",
              user: {
                fullName: "Trần Thị B",
                avatarUrl: "https://picsum.photos/100/100?random=2"
              },
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              likesCount: 15,
              commentsCount: 5,
              isLiked: true
            }}
          />
          <PostCard 
            showImage={true}
            imageUrl="https://picsum.photos/400/300?random=3"
            postData={{
              id: 3,
              content: "Bữa tối ngon tuyệt! 🍽️ #food #delicious",
              imageUrl: "https://picsum.photos/400/300?random=3",
              user: {
                fullName: "Lê Văn C",
                avatarUrl: "https://picsum.photos/100/100?random=3"
              },
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              likesCount: 42,
              commentsCount: 12,
              isLiked: false
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: RESPONSIVE_SPACING.xl,
    paddingTop: RESPONSIVE_SPACING.md,
  },
  storiesSection: {
    backgroundColor: COLORS.white,
    paddingVertical: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  storiesScroll: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.md,
    width: DIMENSIONS.isLargeDevice ? 80 : 70,
  },
  storyAvatar: {
    width: DIMENSIONS.isLargeDevice ? 70 : 60,
    height: DIMENSIONS.isLargeDevice ? 70 : 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginBottom: RESPONSIVE_SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  storyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  postsSection: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.md,
    marginTop: RESPONSIVE_SPACING.sm,
  },
});
