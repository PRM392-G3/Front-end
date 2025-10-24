import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { FriendRequest, userAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { FriendRequestCard } from '@/components/FriendRequestCard';

export default function FriendRequestsScreen() {
  const { user: currentUser } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFriendRequests = useCallback(async () => {
    if (!currentUser?.id) {
      console.warn('⚠️ [FriendRequests] No current user ID');
      setLoading(false);
      return;
    }

    try {
      console.log(`🚀 [FriendRequests] Loading friend requests for user ${currentUser.id}`);
      const requests = await userAPI.getPendingFriendRequests(currentUser.id);
      console.log(`✅ [FriendRequests] Loaded ${requests.length} friend requests`);
      setFriendRequests(requests);
    } catch (error: any) {
      console.error('❌ [FriendRequests] Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadFriendRequests();
  }, [loadFriendRequests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFriendRequests();
    setRefreshing(false);
  };

  const handleRequestResponded = (requestId: number, accepted: boolean) => {
    // Remove the request from the list
    setFriendRequests((prevRequests) =>
      prevRequests.filter((req) => req.id !== requestId)
    );
  };

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <FriendRequestCard 
      friendRequest={item} 
      onRespond={handleRequestResponded}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Users size={64} color={COLORS.text.gray} />
      <Text style={styles.emptyTitle}>Không có lời mời kết bạn</Text>
      <Text style={styles.emptyText}>
        Khi có người gửi lời mời kết bạn, chúng sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
        <View style={styles.placeholder} />
      </View>

      {friendRequests.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {friendRequests.length} lời mời đang chờ
          </Text>
        </View>
      )}

      <FlatList
        data={friendRequests}
        renderItem={renderFriendRequest}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          friendRequests.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    backgroundColor: COLORS.background.secondary,
  } as ViewStyle,
  backButton: {
    padding: RESPONSIVE_SPACING.xs,
  } as ViewStyle,
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
  } as TextStyle,
  placeholder: {
    width: 40,
  } as ViewStyle,
  countContainer: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  } as ViewStyle,
  countText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  listContainer: {
    padding: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  emptyListContainer: {
    flex: 1,
  } as ViewStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.xl,
  } as ViewStyle,
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.xs,
  } as TextStyle,
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});

