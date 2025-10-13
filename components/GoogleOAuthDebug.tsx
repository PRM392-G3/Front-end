import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, RESPONSIVE_SPACING, BORDER_RADIUS, RESPONSIVE_FONT_SIZES } from '@/constants/theme';
import { googleSignInService } from '@/services/googleSignIn';
import Constants from 'expo-constants';

export default function GoogleOAuthDebug() {
  const testGoogleOAuth = async () => {
    try {
      console.log('Testing Google OAuth...');
      
      const result = await googleSignInService.signIn();
      
      console.log('Google OAuth Result:', result);
      
      Alert.alert(
        'Google OAuth Success', 
        `User: ${result.user.name}\nEmail: ${result.user.email}\nID Token: ${result.idToken?.substring(0, 50)}...`
      );
    } catch (error: any) {
      console.error('Google OAuth Error:', error);
      
      Alert.alert(
        'Google OAuth Error', 
        `Error: ${error.message}\n\nCheck console for details.`
      );
    }
  };

  const showConfigInfo = () => {
    const envClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const envRedirectURI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
    const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
    
    const configClientId = Constants.expoConfig?.extra?.googleClientId;
    const configRedirectURI = Constants.expoConfig?.extra?.googleRedirectURI;
    const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
    
    const info = `
Environment Variables:
- Client ID: ${envClientId ? envClientId.substring(0, 20) + '...' : 'Not set'}
- Redirect URI: ${envRedirectURI || 'Not set'}
- API URL: ${envApiUrl ? envApiUrl.substring(0, 30) + '...' : 'Not set'}

App Config:
- Client ID: ${configClientId ? configClientId.substring(0, 20) + '...' : 'Not set'}
- Redirect URI: ${configRedirectURI || 'Not set'}
- API URL: ${configApiUrl ? configApiUrl.substring(0, 30) + '...' : 'Not set'}
    `.trim();
    
    console.log('Config Info:', info);
    
    Alert.alert('Configuration Info', info);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google OAuth Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={testGoogleOAuth}>
        <Text style={styles.buttonText}>Test Google OAuth</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={showConfigInfo}>
        <Text style={styles.buttonText}>Show Config Info</Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        Kiểm tra console để xem chi tiết lỗi OAuth
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    margin: RESPONSIVE_SPACING.sm,
  },
  title: {
    fontSize: RESPONSIVE_FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: RESPONSIVE_SPACING.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: RESPONSIVE_SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: RESPONSIVE_SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: RESPONSIVE_FONT_SIZES.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  info: {
    fontSize: RESPONSIVE_FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: RESPONSIVE_SPACING.sm,
  },
});
