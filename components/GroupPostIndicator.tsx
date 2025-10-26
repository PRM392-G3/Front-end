import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES } from '@/constants/theme';
import { Users } from 'lucide-react-native';

interface GroupPostIndicatorProps {
  groupName: string;
  onGroupPress: () => void;
}

export const GroupPostIndicator: React.FC<GroupPostIndicatorProps> = ({
  groupName,
  onGroupPress
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onGroupPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Users size={14} color={COLORS.accent.primary} />
      </View>
      <Text style={styles.groupName}>{groupName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary + '15',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: 16,
    marginTop: RESPONSIVE_SPACING.xs,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: RESPONSIVE_SPACING.xs,
  },
  groupName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.accent.primary,
  },
});
