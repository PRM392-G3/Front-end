import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';

export const ReloadHelper = () => {
  const showReloadInstructions = () => {
    Alert.alert(
      '🔄 Reload App Instructions',
      '1. Shake your device\n2. Tap "Reload"\n\nOr:\n1. Press "r" in Metro terminal\n2. Scan QR code again',
      [
        { text: 'OK' },
        { 
          text: 'Clear Cache & Reload', 
          onPress: () => {
            Alert.alert(
              'Clear Cache',
              'In Metro terminal, press Ctrl+C then run:\nnpx expo start --clear',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔄 Reload Helper</Text>
      <Text style={styles.subtitle}>Nếu không thấy thay đổi, hãy reload app</Text>
      
      <TouchableOpacity style={styles.button} onPress={showReloadInstructions}>
        <Text style={styles.buttonText}>Show Reload Instructions</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        💡 Hot reload có thể không hoạt động với một số thay đổi lớn
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.info + '20',
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.info,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  note: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    fontWeight: '500',
    textAlign: 'center',
  },
});
