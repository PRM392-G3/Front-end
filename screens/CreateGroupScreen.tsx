import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { ArrowLeft, Camera, Image as ImageIcon, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { groupAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import SimpleImageUploader from '@/components/SimpleImageUploader';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả nhóm');
      return;
    }

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng');
      return;
    }

    setLoading(true);
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        avatarUrl: avatarUrl || '',
        coverImageUrl: coverImageUrl || '',
        createdById: user.id,
        privacy: privacy
      };

      console.log('Creating group with data:', groupData);
      const newGroup = await groupAPI.createGroup(groupData);
      
      Alert.alert(
        'Thành công', 
        'Nhóm đã được tạo thành công!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push(`/group-detail?id=${newGroup.id}`);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating group:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo nhóm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm mới</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Avatar */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Ảnh đại diện nhóm</Text>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.previewImage} />
          ) : null}
          <SimpleImageUploader
            folder="avatars"
            onUploadComplete={(res: any) => {
              console.log('CreateGroupScreen: Avatar upload response:', res);
              const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
              console.log('CreateGroupScreen: Extracted avatar URL:', url);
              if (url) {
                setAvatarUrl(url);
              } else {
                console.error('CreateGroupScreen: No URL found in avatar upload response');
              }
            }}
            onUploadError={(error: any) => {
              console.error('CreateGroupScreen: Avatar upload error:', error);
              Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện');
            }}
          />
        </View>

        {/* Group Cover */}
        <View style={styles.coverSection}>
          <Text style={styles.sectionTitle}>Ảnh bìa nhóm</Text>
          {coverImageUrl ? (
            <Image source={{ uri: coverImageUrl }} style={styles.previewCover} />
          ) : null}
          <SimpleImageUploader
            folder="covers"
            onUploadComplete={(res: any) => {
              console.log('CreateGroupScreen: Cover upload response:', res);
              const url = Array.isArray(res) ? res[0]?.publicUrl : res?.publicUrl;
              console.log('CreateGroupScreen: Extracted cover URL:', url);
              if (url) {
                setCoverImageUrl(url);
              } else {
                console.error('CreateGroupScreen: No URL found in cover upload response');
              }
            }}
            onUploadError={(error: any) => {
              console.error('CreateGroupScreen: Cover upload error:', error);
              Alert.alert('Lỗi', 'Không thể tải lên ảnh bìa');
            }}
          />
        </View>

        {/* Group Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Tên nhóm *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tên nhóm"
            placeholderTextColor={COLORS.text.gray}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
          <Text style={styles.characterCount}>{groupName.length}/50</Text>
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Mô tả *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Mô tả về nhóm của bạn"
            placeholderTextColor={COLORS.text.gray}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Privacy Setting */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Quyền riêng tư</Text>
          <View style={styles.privacyOptions}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacy === 'public' && styles.privacyOptionSelected
              ]}
              onPress={() => setPrivacy('public')}
            >
              <Users size={20} color={privacy === 'public' ? COLORS.white : COLORS.text.gray} />
              <View style={styles.privacyInfo}>
                <Text style={[
                  styles.privacyTitle,
                  privacy === 'public' && styles.privacyTitleSelected
                ]}>
                  Công khai
                </Text>
                <Text style={[
                  styles.privacyDescription,
                  privacy === 'public' && styles.privacyDescriptionSelected
                ]}>
                  Mọi người có thể tìm thấy và tham gia
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyOption,
                privacy === 'private' && styles.privacyOptionSelected
              ]}
              onPress={() => setPrivacy('private')}
            >
              <Users size={20} color={privacy === 'private' ? COLORS.white : COLORS.text.gray} />
              <View style={styles.privacyInfo}>
                <Text style={[
                  styles.privacyTitle,
                  privacy === 'private' && styles.privacyTitleSelected
                ]}>
                  Riêng tư
                </Text>
                <Text style={[
                  styles.privacyDescription,
                  privacy === 'private' && styles.privacyDescriptionSelected
                ]}>
                  Chỉ thành viên được mời mới có thể tham gia
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.createButtonText}>Tạo nhóm</Text>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingBottom: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    padding: RESPONSIVE_SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: RESPONSIVE_SPACING.md,
  },
  avatarSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  coverSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  inputSection: {
    marginBottom: RESPONSIVE_SPACING.lg,
  },
  textInput: {
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
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.gray,
    textAlign: 'right',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  privacyOptions: {
    gap: RESPONSIVE_SPACING.sm,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  privacyOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  privacyInfo: {
    marginLeft: RESPONSIVE_SPACING.sm,
    flex: 1,
  },
  privacyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  privacyTitleSelected: {
    color: COLORS.white,
  },
  privacyDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.gray,
  },
  privacyDescriptionSelected: {
    color: COLORS.white,
  },
  bottomContainer: {
    padding: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: COLORS.text.lightGray,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.lightGray,
  },
  previewCover: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
    backgroundColor: COLORS.lightGray,
  },
});