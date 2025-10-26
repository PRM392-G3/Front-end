import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES } from '@/constants/theme';
import { Users } from 'lucide-react-native';
import { PostResponse } from '@/services/api';
import { useRouter } from 'expo-router';

interface GroupPostHeaderProps {
  post: PostResponse;
}

export const GroupPostHeader: React.FC<GroupPostHeaderProps> = ({ post }) => {
  const router = useRouter();

  const handleGroupPress = () => {
    if (post.groupId && post.group) {
      console.log('🏠 [GroupPostHeader] Navigating to group:', post.group.name, 'ID:', post.groupId);
      router.push(`/group-detail?id=${post.groupId}` as any);
    }
  };

  if (!post.group || !post.groupId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.groupInfo}>
        <Users size={14} color={COLORS.accent.primary} />
        <Text style={styles.groupText}>
          <Text style={styles.userName}>{post.user.fullName}</Text>
          <Text style={styles.separator}> đã đăng trong </Text>
          <TouchableOpacity onPress={handleGroupPress} activeOpacity={0.7}>
            <Text style={styles.groupName}>{post.group.name}</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    marginLeft: RESPONSIVE_SPACING.xs,
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  separator: {
    color: COLORS.text.secondary,
  },
  groupName: {
    fontWeight: '600',
    color: COLORS.accent.primary,
    textDecorationLine: 'underline',
  },
});
