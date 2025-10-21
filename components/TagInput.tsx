import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { X, Hash } from 'lucide-react-native';
import { tagAPI, Tag } from '@/services/api';

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagInput({ 
  selectedTags, 
  onTagsChange, 
  placeholder = "Thêm tag...",
  maxTags = 5 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load available tags on component mount
  useEffect(() => {
    loadAvailableTags();
  }, []);

  const loadAvailableTags = async () => {
    try {
      setIsLoading(true);
      console.log('TagInput: Loading available tags...');
      
      // Try to load tags from API
      const tags = await tagAPI.getAllTags();
      console.log('TagInput: Loaded tags:', tags.length);
      setAvailableTags(tags);
    } catch (error) {
      console.error('TagInput: Error loading tags:', error);
      // If API fails, use empty array - this is handled gracefully in tagAPI
      setAvailableTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tagText: string) => {
    if (!tagText.trim()) return;
    
    const cleanTag = tagText.trim().replace(/^#/, ''); // Remove # if present
    const newTag = `#${cleanTag}`;
    
    if (selectedTags.includes(newTag)) return;
    if (selectedTags.length >= maxTags) return;
    
    onTagsChange([...selectedTags, newTag]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleInputSubmit = () => {
    addTag(inputValue);
  };

  const handleTagPress = (tag: Tag) => {
    addTag(tag.name);
  };

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.includes(`#${tag.name}`)
  );

  return (
    <View style={styles.container}>
      {/* Selected Tags */}
      <View style={styles.selectedTagsContainer}>
        {selectedTags.map((tag, index) => (
          <View key={index} style={styles.selectedTag}>
            <Text style={styles.selectedTagText}>{tag}</Text>
            <TouchableOpacity 
              onPress={() => removeTag(tag)}
              style={styles.removeTagButton}
            >
              <X size={14} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <Hash size={16} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          onSubmitEditing={handleInputSubmit}
          returnKeyType="done"
          maxLength={20}
        />
      </View>

      {/* Available Tags Suggestions */}
      {inputValue.length > 0 && filteredTags.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Gợi ý:</Text>
          <FlatList
            data={filteredTags.slice(0, 5)} // Limit to 5 suggestions
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.suggestionItem}
                onPress={() => handleTagPress(item)}
              >
                <Text style={styles.suggestionText}>#{item.name}</Text>
                <Text style={styles.suggestionCount}>({item.usageCount})</Text>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <Text style={styles.loadingText}>Đang tải tags...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: RESPONSIVE_SPACING.sm,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  selectedTagText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    fontWeight: '500',
  },
  removeTagButton: {
    marginLeft: RESPONSIVE_SPACING.xs,
    padding: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    marginLeft: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.black,
  },
  suggestionsContainer: {
    marginTop: RESPONSIVE_SPACING.sm,
  },
  suggestionsTitle: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: RESPONSIVE_SPACING.xs,
  },
  suggestionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.black,
    fontWeight: '500',
  },
  suggestionCount: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  loadingText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.sm,
  },
});
