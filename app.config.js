module.exports = {
  expo: {
    name: "Nexora",
    slug: "nexora-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "nexora",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourapp.nexora"
    },
    android: {
      package: "com.prm392.nexora",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#6366F1"
      },
      googleServicesFile: "./google-services.json",
      permissions: [
        "INTERNET",
        "POST_NOTIFICATIONS",
        "ACCESS_NETWORK_STATE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png",
      name: "Nexora",
      shortName: "Nexora",
      description: "Nexora - Social Platform",
      themeColor: "#6366F1",
      backgroundColor: "#F1F5F9"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#6366F1",
          sounds: []
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || 
                        "com.googleusercontent.apps.95566958301-tfjlc5pg05equv408pa9cigob1prg18v"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    notification: {
      icon: "./assets/images/icon.png",
      color: "#6366F1",
      androidMode: "default",
      androidCollapsedTitle: "Thông báo mới từ Nexora"
    },
    extra: {
      router: {},
      eas: {
        projectId: "a832d58b-7ca3-4343-8482-170368a9b89a"
      },
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || 
                      "95566958301-tfjlc5pg05equv408pa9cigob1prg18v.apps.googleusercontent.com",
      googleProjectId: process.env.EXPO_PUBLIC_GOOGLE_PROJECT_ID || 
                       "nexora-476313",
      googleRedirectURI: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ||
                         "https://auth.expo.io/@minhtri10504/nexora-app",
      // Backend API URL from env
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 
                  "https://2fefeca44269.ngrok-free.app/api"
    },
    owner: "minhtri10504"
  }
};

