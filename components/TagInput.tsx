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
      console.log('TagInput: Loading tags from API...');
      const tags = await tagAPI.getAllTags();
      console.log('TagInput: API response:', tags);
      console.log('TagInput: Tags count:', tags?.length);
      console.log('TagInput: Tags type:', typeof tags);
      
      if (Array.isArray(tags)) {
        setAllTags(tags);
        console.log('TagInput: Successfully loaded tags:', tags);
      } else {
        console.error('TagInput: Invalid response format, expected array but got:', typeof tags);
        setAllTags([]);
      }
    } catch (error) {
      console.error('TagInput: Error loading tags:', error);
      console.error('TagInput: Error details:', error);
      setAllTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length > 0) {
      const filtered = allTags.filter(tag => 
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag.name)
      );
      setSuggestions(filtered.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, allTags, selectedTags]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
  };

  const handleAddTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    // Check if tag already exists
    if (selectedTags.includes(trimmedTag)) {
      return;
    }
    
    // Check max tags limit
    if (selectedTags.length >= maxTags) {
      return;
    }
    
    // Add tag
    const newTags = [...selectedTags, trimmedTag];
    onTagsChange(newTags);
    
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleAddTag(inputValue.trim());
    }
  };

  const handleSuggestionPress = (tag: Tag) => {
    handleAddTag(tag.name);
  };

  const handleInputFocus = () => {
    if (inputValue.trim().length > 0) {
      setShowSuggestions(suggestions.length > 0);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion press
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const renderTag = (tag: string, index: number) => (
    <View key={index} style={styles.tagContainer}>
      <Hash size={12} color={COLORS.primary} />
      <Text style={styles.tagText}>{tag}</Text>
      {!disabled && (
        <TouchableOpacity
          style={styles.removeTagButton}
          onPress={() => handleRemoveTag(tag)}
        >
          <X size={12} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSuggestion = ({ item }: { item: Tag }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Hash size={16} color={COLORS.primary} />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.suggestionDescription}>{item.description}</Text>
        )}
      </View>
      <Text style={styles.suggestionUsage}>{item.usageCount} posts</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScrollView}
          >
            {selectedTags.map((tag, index) => renderTag(tag, index))}
          </ScrollView>
        </View>
      )}

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={inputValue}
          onChangeText={handleInputChange}
          onSubmitEditing={handleInputSubmit}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          editable={!disabled}
          maxLength={50}
          returnKeyType="done"
        />
        {inputValue.trim() && !disabled && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddTag(inputValue.trim())}
          >
            <Plus size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
            {suggestions.map((item) => (
              <View key={item.id.toString()}>
                {renderSuggestion({ item })}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Helper Text */}
      <View style={styles.helperContainer}>
        <Text style={styles.helperText}>
          {selectedTags.length}/{maxTags} tags
        </Text>
        {selectedTags.length >= maxTags && (
          <Text style={styles.warningText}>
            Đã đạt giới hạn số lượng tag
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: RESPONSIVE_SPACING.md,
  },
  selectedTagsContainer: {
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  tagsScrollView: {
    maxHeight: 40,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: RESPONSIVE_SPACING.sm,
    paddingVertical: RESPONSIVE_SPACING.xs,
    marginRight: RESPONSIVE_SPACING.xs,
    marginBottom: RESPONSIVE_SPACING.xs,
  },
  tagText: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: RESPONSIVE_SPACING.xs,
  },
  removeTagButton: {
    marginLeft: RESPONSIVE_SPACING.xs,
    padding: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text,
  },
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.gray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: RESPONSIVE_SPACING.sm,
    marginRight: RESPONSIVE_SPACING.sm,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginTop: RESPONSIVE_SPACING.xs,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  suggestionName: {
    fontSize: RESPONSIVE_FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  suggestionDescription: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  suggestionUsage: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  helperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: RESPONSIVE_SPACING.xs,
  },
  helperText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.gray,
  },
  warningText: {
    fontSize: RESPONSIVE_FONT_SIZES.xs,
    color: COLORS.error,
    fontWeight: '500',
  },
});
