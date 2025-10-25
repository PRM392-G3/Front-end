import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { X, Check, Users, FileText, Users2 } from 'lucide-react-native';

interface FilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  category: 'all' | 'users' | 'posts' | 'groups';
  sortBy: 'relevance' | 'date' | 'popularity';
  timeRange: 'all' | 'today' | 'week' | 'month';
}

const categoryOptions: FilterOption[] = [
  { id: 'all', label: 'Tất cả', icon: <FileText size={20} color={COLORS.gray} /> },
  { id: 'users', label: 'Người dùng', icon: <Users size={20} color={COLORS.gray} /> },
  { id: 'posts', label: 'Bài viết', icon: <FileText size={20} color={COLORS.gray} /> },
  { id: 'groups', label: 'Nhóm', icon: <Users2 size={20} color={COLORS.gray} /> },
];

const sortOptions = [
  { id: 'relevance', label: 'Liên quan nhất' },
  { id: 'date', label: 'Mới nhất' },
  { id: 'popularity', label: 'Phổ biến nhất' },
];

const timeRangeOptions = [
  { id: 'all', label: 'Tất cả thời gian' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const handleCategoryChange = (category: FilterState['category']) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleTimeRangeChange = (timeRange: FilterState['timeRange']) => {
    setFilters(prev => ({ ...prev, timeRange }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      category: 'all',
      sortBy: 'relevance',
      timeRange: 'all',
    };
    setFilters(defaultFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Bộ lọc</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Đặt lại</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <View style={styles.optionsContainer}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    filters.category === option.id && styles.selectedOption,
                  ]}
                  onPress={() => handleCategoryChange(option.id as FilterState['category'])}
                >
                  <View style={styles.optionContent}>
                    {option.icon}
                    <Text
                      style={[
                        styles.optionText,
                        filters.category === option.id && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {filters.category === option.id && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
            <View style={styles.optionsContainer}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    filters.sortBy === option.id && styles.selectedOption,
                  ]}
                  onPress={() => handleSortChange(option.id as FilterState['sortBy'])}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filters.sortBy === option.id && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {filters.sortBy === option.id && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Range Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian</Text>
            <View style={styles.optionsContainer}>
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    filters.timeRange === option.id && styles.selectedOption,
                  ]}
                  onPress={() => handleTimeRangeChange(option.id as FilterState['timeRange'])}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filters.timeRange === option.id && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {filters.timeRange === option.id && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
    paddingVertical: RESPONSIVE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    padding: RESPONSIVE_SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.black,
  },
  resetButton: {
    padding: RESPONSIVE_SPACING.sm,
  },
  resetText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: RESPONSIVE_SPACING.md,
  },
  section: {
    marginTop: RESPONSIVE_SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.md,
  },
  optionsContainer: {
    gap: RESPONSIVE_SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    marginLeft: RESPONSIVE_SPACING.sm,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE_SPACING.md,
    paddingVertical: RESPONSIVE_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    backgroundColor: COLORS.white,
    gap: RESPONSIVE_SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: RESPONSIVE_SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  applyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
});
