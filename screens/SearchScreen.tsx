import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Search, TrendingUp, Filter, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { UserSearchResults } from '@/components/UserSearchResults';
import { SuggestedUsers } from '@/components/SuggestedUsers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'groups' | 'events'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <View style={styles.content}>
            {searchQuery.trim() ? (
                   <UserSearchResults 
                     searchQuery={searchQuery}
                     onUserPress={(userId) => {
                       // Navigate to user profile test screen
                       console.log(`🎯 [SearchScreen] UserSearchResults onUserPress called with userId: ${userId}`);
                       console.log(`🎯 [SearchScreen] About to navigate to /profile-test?userId=${userId}`);
                       router.push(`/profile-test?userId=${userId}`);
                       console.log(`✅ [SearchScreen] Navigation command sent`);
                     }}
                   />
            ) : (
                     <SuggestedUsers 
                       limit={20}
                       onUserPress={(userId) => {
                         // Navigate to user profile test screen
                         console.log(`🎯 [SearchScreen] SuggestedUsers onUserPress called with userId: ${userId}`);
                         console.log(`🎯 [SearchScreen] About to navigate to /profile-test?userId=${userId}`);
                         router.push(`/profile-test?userId=${userId}`);
                         console.log(`✅ [SearchScreen] Navigation command sent`);
                       }}
                     />
            )}
          </View>
        );
      case 'posts':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bài viết nổi bật</Text>
              <View style={styles.trendingCard}>
                <View style={styles.trendingImage} />
                <View style={styles.trendingContent}>
                  <Text style={styles.trendingTitle}>
                    Sự kiện công nghệ lớn nhất năm 2024
                  </Text>
                  <Text style={styles.trendingStats}>1.2K lượt thích • 234 bình luận</Text>
                </View>
              </View>
              <View style={styles.trendingCard}>
                <View style={styles.trendingImage} />
                <View style={styles.trendingContent}>
                  <Text style={styles.trendingTitle}>
                    Những xu hướng thiết kế mới nhất
                  </Text>
                  <Text style={styles.trendingStats}>890 lượt thích • 156 bình luận</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      case 'groups':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nhóm phổ biến</Text>
              <Text style={styles.comingSoon}>Chức năng đang phát triển</Text>
            </View>
          </ScrollView>
        );
      case 'events':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
              <Text style={styles.comingSoon}>Chức năng đang phát triển</Text>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 60 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Sparkles size={24} color={COLORS.white} />
              <Text style={styles.logoText}>Tìm kiếm</Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm người dùng, bài viết, nhóm..."
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Người dùng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Bài viết
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Nhóm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Sự kiện
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  header: {
    paddingTop: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    height: 48,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  suggestionAvatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.sm,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  suggestionMutual: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  trendingCard: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  trendingImage: {
    width: 100,
    height: 80,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.sm,
  },
  trendingContent: {
    flex: 1,
    justifyContent: 'center',
  },
  trendingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  trendingStats: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  comingSoon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    padding: SPACING.xl,
    fontStyle: 'italic',
  },
});
