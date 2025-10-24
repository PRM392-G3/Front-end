import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Story {
  id: string;
  username: string;
  hasUnseenStory: boolean;
}

const SAMPLE_STORIES: Story[] = [
  { id: '1', username: 'Bạn', hasUnseenStory: false },
  { id: '2', username: 'nguyenvana', hasUnseenStory: true },
  { id: '3', username: 'tranthib', hasUnseenStory: true },
  { id: '4', username: 'lequangc', hasUnseenStory: true },
  { id: '5', username: 'phamthid', hasUnseenStory: false },
  { id: '6', username: 'hoangvane', hasUnseenStory: true },
  { id: '7', username: 'doquynhf', hasUnseenStory: false },
];

export default function StoryBar() {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add story button */}
        <TouchableOpacity style={styles.storyItem}>
          <View style={styles.addStoryContainer}>
            <View style={styles.addStoryAvatar}>
              <Text style={styles.avatarText}>B</Text>
            </View>
            <View style={styles.addButton}>
              <Plus size={16} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.storyUsername}>Tạo story</Text>
        </TouchableOpacity>

        {/* Stories */}
        {SAMPLE_STORIES.slice(1).map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyItem}>
            <View style={styles.storyContainer}>
              {story.hasUnseenStory ? (
                <LinearGradient
                  colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storyGradient}
                >
                  <View style={styles.storyAvatarContainer}>
                    <View style={styles.storyAvatar}>
                      <Text style={styles.avatarText}>
                        {story.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.seenStoryBorder}>
                  <View style={styles.storyAvatar}>
                    <Text style={styles.avatarText}>
                      {story.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  scrollContent: {
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    gap: RESPONSIVE_SPACING.sm,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  addStoryContainer: {
    position: 'relative',
  },
  addStoryAvatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  storyContainer: {
    marginBottom: 4,
  },
  storyGradient: {
    width: 68,
    height: 68,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenStoryBorder: {
    width: 68,
    height: 68,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  storyUsername: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.black,
    marginTop: 4,
    textAlign: 'center',
  },
});

