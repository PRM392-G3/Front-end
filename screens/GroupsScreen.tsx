import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Plus, Users, Lock, Globe } from 'lucide-react-native';

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhóm</Text>
        <TouchableOpacity style={styles.createButton}>
          <Plus size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhóm của bạn</Text>

          <TouchableOpacity style={styles.groupCard}>
            <View style={styles.groupImage} />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>Cộng đồng React Native</Text>
              <View style={styles.groupMeta}>
                <Users size={14} color={COLORS.gray} />
                <Text style={styles.groupMetaText}>1,234 thành viên</Text>
              </View>
              <View style={styles.groupPrivacy}>
                <Globe size={14} color={COLORS.success} />
                <Text style={styles.groupPrivacyText}>Công khai</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupCard}>
            <View style={styles.groupImage} />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>Thiết kế UI/UX</Text>
              <View style={styles.groupMeta}>
                <Users size={14} color={COLORS.gray} />
                <Text style={styles.groupMetaText}>890 thành viên</Text>
              </View>
              <View style={styles.groupPrivacy}>
                <Lock size={14} color={COLORS.darkGray} />
                <Text style={styles.groupPrivacyText}>Riêng tư</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gợi ý nhóm</Text>

          <TouchableOpacity style={styles.groupCard}>
            <View style={styles.groupImage} />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>JavaScript Việt Nam</Text>
              <View style={styles.groupMeta}>
                <Users size={14} color={COLORS.gray} />
                <Text style={styles.groupMetaText}>5,678 thành viên</Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Tham gia</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupCard}>
            <View style={styles.groupImage} />
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>Cộng đồng lập trình viên</Text>
              <View style={styles.groupMeta}>
                <Users size={14} color={COLORS.gray} />
                <Text style={styles.groupMetaText}>3,456 thành viên</Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Tham gia</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.black,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    paddingVertical: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  groupCard: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.lightGray,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  groupMetaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  groupPrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  },
  groupPrivacyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkGray,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  joinButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
});
