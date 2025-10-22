import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, User, Lock, Bell, Shield, Circle as HelpCircle, Info, LogOut, ChevronRight, Eye, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <User size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Thông tin cá nhân</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Lock size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Đổi mật khẩu</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quyền riêng tư & Bảo mật</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Lock size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Tài khoản riêng tư</Text>
            </View>
            <Switch
              value={privateAccount}
              onValueChange={setPrivateAccount}
              trackColor={{ false: COLORS.border.primary, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Eye size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Ai có thể xem bài viết</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Bạn bè</Text>
              <ChevronRight size={20} color={COLORS.text.gray} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MessageCircle size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Ai có thể nhắn tin</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Mọi người</Text>
              <ChevronRight size={20} color={COLORS.text.gray} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Tài khoản bị chặn</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Bật thông báo</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border.primary, true: COLORS.primary }}
              thumbColor={COLORS.text.white}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Tùy chỉnh thông báo</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Trung tâm trợ giúp</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={20} color={COLORS.text.darkGray} />
              <Text style={styles.settingText}>Về chúng tôi</Text>
            </View>
            <ChevronRight size={20} color={COLORS.text.gray} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color={COLORS.accent.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingTop: 60,
    paddingBottom: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.background.secondary,
    marginBottom: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.gray,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
    flex: 1,
  },
  settingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.xs,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    marginTop: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.md,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.accent.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.gray,
    paddingVertical: RESPONSIVE_SPACING.lg,
  },
});
