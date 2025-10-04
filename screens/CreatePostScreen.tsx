import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Image as ImageIcon, Video, Smile, MapPin, ChevronDown, X, Sparkles, Send } from 'lucide-react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreatePostScreen() {
  const [privacy, setPrivacy] = useState('Công khai');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton}>
            <X size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Sparkles size={20} color={COLORS.white} />
            <Text style={styles.headerTitle}>Tạo bài viết</Text>
          </View>
          
          <TouchableOpacity style={styles.postButton}>
            <Send size={18} color={COLORS.white} />
            <Text style={styles.postButtonText}>Đăng</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.userSection}>
          <View style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Nguyễn Văn A</Text>
            <TouchableOpacity style={styles.privacyButton}>
              <Text style={styles.privacyText}>{privacy}</Text>
              <ChevronDown size={16} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="Bạn đang nghĩ gì?"
          placeholderTextColor={COLORS.gray}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.mediaPreview}>
          <View style={styles.mediaPlaceholder} />
          <TouchableOpacity style={styles.removeMediaButton}>
            <X size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.addOptionsContainer}>
          <Text style={styles.addOptionsTitle}>Thêm vào bài viết</Text>
          <View style={styles.addOptions}>
            <TouchableOpacity style={styles.optionButton}>
              <ImageIcon size={24} color={COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Video size={24} color={COLORS.error} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Smile size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <MapPin size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  postButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkGray,
    marginRight: 4,
  },
  textInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    minHeight: 120,
    marginBottom: SPACING.md,
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  mediaPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
  },
  removeMediaButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionsContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  addOptionsTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  addOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  optionButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
