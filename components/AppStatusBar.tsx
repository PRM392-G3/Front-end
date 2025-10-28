import React from 'react';
import { StatusBar, Platform } from 'react-native';

interface AppStatusBarProps {
  barStyle?: 'dark-content' | 'light-content';
  backgroundColor?: string;
  translucent?: boolean;
}

/**
 * Component chuẩn hóa StatusBar cho toàn bộ app
 * Tự động xử lý transparent status bar trên Android
 */
export default function AppStatusBar({ 
  barStyle = 'dark-content',
  backgroundColor = 'transparent',
  translucent = Platform.OS === 'android'
}: AppStatusBarProps) {
  return (
    <StatusBar
      barStyle={barStyle}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
}

