import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { X, Users, Camera, Lock, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }

    // TODO: Call API to create group
    Alert.alert('Thành công', 'Nhóm đã được tạo', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const canCreate = groupName.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <X size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm mới</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCreateGroup}
          disabled={!canCreate}
        >
          <Text
            style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
          >
            Tạo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverImageUpload}>
          <Camera size={32} color={COLORS.gray} />
          <Text style={styles.uploadText}>Thêm ảnh bìa nhóm</Text>
        </TouchableOpacity>

        {/* Group Icon */}
        <View style={styles.iconSection}>
          <TouchableOpacity style={styles.groupIcon}>
            <Users size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Tên nhóm *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên nhóm..."
            placeholderTextColor={COLORS.gray}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{groupName.length}/100</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Mô tả nhóm</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả về nhóm của bạn..."
            placeholderTextColor={COLORS.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Privacy Setting */}
        <View style={styles.section}>
          <View style={styles.privacyHeader}>
            <View style={styles.privacyInfo}>
              {isPrivate ? (
                <Lock size={20} color={COLORS.text.primary} />
              ) : (
                <Globe size={20} color={COLORS.text.primary} />
              )}
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>
                  {isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}
                </Text>
                <Text style={styles.privacyDescription}>
                  {isPrivate
                    ? 'Chỉ thành viên mới xem được nội dung'
                    : 'Mọi người đều có thể xem và tham gia'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: COLORS.gray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Sau khi tạo nhóm, bạn có thể mời bạn bè tham gia và bắt đầu trò chuyện.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    backgroundColor: COLORS.background.primary,
  },
  headerButton: {
    minWidth: 50,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  coverImageUpload: {
    height: 180,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: RESPONSIVE_SPACING.sm,
  },
  uploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  iconSection: {
    alignItems: 'center',
    marginTop: -32,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background.primary,
  },
  section: {
    paddingHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: RESPONSIVE_SPACING.sm,
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  privacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: RESPONSIVE_SPACING.sm,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  infoBox: {
    marginHorizontal: RESPONSIVE_SPACING.md,
    marginBottom: RESPONSIVE_SPACING.lg,
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});

