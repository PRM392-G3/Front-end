import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { X, Hash, Plus } from 'lucide-react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { tagAPI, Tag } from '@/services/api';

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export default function TagInput({
  selectedTags,
  onTagsChange,
  placeholder = 'Thêm hashtag...',
  maxTags = 10,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Load all available tags on component mount
  useEffect(() => {
    loadAllTags();
  }, []);

  const loadAllTags = async () => {
    try {
      setIsLoading(true);
      const tags = await tagAPI.getAllTags();
      setAllTags(tags);
      console.log('TagInput: Loaded', tags.length, 'tags');
    } catch (error) {
      console.error('TagInput: Error loading tags:', error);
      setAllTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    if (text.trim()) {
      // Filter suggestions based on input
      const filteredTags = allTags.filter(tag =>
        tag.name.toLowerCase().includes(text.toLowerCase()) &&
        !selectedTags.includes(tag.name)
      );
      setSuggestions(filteredTags.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addTag = (tagName: string) => {
    const cleanTag = tagName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    
    if (cleanTag && !selectedTags.includes(cleanTag) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, cleanTag]);
      setInputValue('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
  };

  const handleSuggestionPress = (tag: Tag) => {
    addTag(tag.name);
  };

  const handleInputFocus = () => {
    if (inputValue.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion press
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Selected Tags */}
      <View style={styles.selectedTagsContainer}>
        {selectedTags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Hash size={12} color={COLORS.accent.primary} />
            <Text style={styles.tagText}>{tag}</Text>
            {!disabled && (
              <TouchableOpacity
                style={styles.removeTagButton}
                onPress={() => removeTag(tag)}
              >
                <X size={12} color={COLORS.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {selectedTags.length < maxTags && (
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={() => inputRef.current?.focus()}
            disabled={disabled}
          >
            <Plus size={16} color={COLORS.accent.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Input Field */}
      {selectedTags.length < maxTags && (
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.input, disabled && styles.inputDisabled]}
            value={inputValue}
            onChangeText={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor={COLORS.text.secondary}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {inputValue.trim() && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={disabled}
            >
              <Text style={styles.submitButtonText}>Thêm</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(tag)}
              >
                <Hash size={14} color={COLORS.accent.primary} />
                <Text style={styles.suggestionText}>{tag.name}</Text>
                <Text style={styles.suggestionCount}>
                  {tag.usageCount} bài viết
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải hashtag...</Text>
        </View>
      )}

      {/* Tag Count */}
      <Text style={styles.tagCount}>
        {selectedTags.length}/{maxTags} hashtag
      </Text>
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
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary + '20',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  tagText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.accent.primary,
    fontWeight: '500',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  removeTagButton: {
    marginLeft: RESPONSIVE_SPACING.xs,
    padding: 2,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text.primary,
    paddingVertical: RESPONSIVE_SPACING.sm,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  submitButtonText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    maxHeight: 200,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.secondary,
  },
  suggestionText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.primary,
    marginLeft: RESPONSIVE_SPACING.xs,
    flex: 1,
  },
  suggestionCount: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  loadingContainer: {
    paddingVertical: RESPONSIVE_SPACING.sm,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  tagCount: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'right',
  },
});