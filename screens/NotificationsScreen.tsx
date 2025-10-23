import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import NotificationItem from '@/components/NotificationItem';
import { Settings, Sparkles, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bell size={24} color={COLORS.text.white} />
            <Text style={styles.headerTitle}>Thông báo</Text>
          </View>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color={COLORS.text.white} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationStats}>
          <Text style={styles.statsText}>Bạn có 3 thông báo mới</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Chưa đọc</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notifications}>
        <NotificationItem type="like" isRead={false} />
        <NotificationItem type="comment" isRead={false} />
        <NotificationItem type="friend" isRead={true} />
        <NotificationItem type="event" isRead={true} />
        <NotificationItem type="like" isRead={true} />
        <NotificationItem type="comment" isRead={true} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  } as ViewStyle,
  headerGradient: {
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.lg,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.md,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text.white,
    letterSpacing: 0.5,
  } as TextStyle,
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  notificationStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  statsText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  } as ViewStyle,
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  } as ViewStyle,
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.gray,
    fontWeight: '500',
  } as TextStyle,
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  } as TextStyle,
  notifications: {
    flex: 1,
  } as ViewStyle,
});
