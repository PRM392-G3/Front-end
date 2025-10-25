import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Users, Lock, Globe } from 'lucide-react-native';
import { groupAPI } from '@/services/api';
import { Group } from '@/services/api';

interface GroupSearchResultsProps {
  searchQuery: string;
  onGroupPress: (groupId: number) => void;
}

export function GroupSearchResults({ searchQuery, onGroupPress }: GroupSearchResultsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchGroups();
    } else {
      setGroups([]);
    }
  }, [searchQuery]);

  const searchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await groupAPI.searchGroups(searchQuery);
      setGroups(results);
    } catch (err: any) {
      console.error('Error searching groups:', err);
      setError(err.message || 'Không thể tìm kiếm nhóm');
    } finally {
      setLoading(false);
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => onGroupPress(item.id)}
    >
      <View style={styles.groupAvatar}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.groupStats}>
          <View style={styles.statItem}>
            <Users size={14} color={COLORS.text.gray} />
            <Text style={styles.statText}>{item.memberCount} thành viên</Text>
          </View>
          <View style={styles.statItem}>
            {item.privacy === 'private' ? (
              <Lock size={14} color={COLORS.text.gray} />
            ) : (
              <Globe size={14} color={COLORS.text.gray} />
            )}
            <Text style={styles.statText}>
              {item.privacy === 'private' ? 'Riêng tư' : 'Công khai'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={searchGroups}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (groups.length === 0 && searchQuery.trim()) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Không tìm thấy nhóm nào</Text>
        <Text style={styles.emptySubtext}>Thử tìm kiếm với từ khóa khác</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderGroupItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: RESPONSIVE_SPACING.md,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RESPONSIVE_SPACING.md,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
    marginBottom: RESPONSIVE_SPACING.xs,
    lineHeight: 18,
  },
  groupStats: {
    flexDirection: 'row',
    gap: RESPONSIVE_SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.gray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.gray,
    marginTop: RESPONSIVE_SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.lg,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.gray,
    textAlign: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.lightGray,
    textAlign: 'center',
  },
});
