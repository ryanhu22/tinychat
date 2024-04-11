// import "dotenv/config";

export default {
  expo: {
    name: "tinychat",
    slug: "tinychat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.tinychat",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "app.tinychat",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiKey: process.env.EXPO_API_KEY,
      authDomain: process.env.EXPO_AUTH_DOMAIN,
      eas: {
        projectId: "2be1115d-d728-4204-9a7b-a21f5e3ee5d1",
      },
      projectId: process.env.EXPO_PROJECT_ID,
      storageBucket: process.env.EXPO_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_APP_ID,
    },
    plugins: [
      [
        "@react-native-voice/voice",
        {
          microphonePermission: "Permission to use Mic",
          speechRecognitionPermission: "Permission to use Speech Rec.",
        },
      ],
    ],
  },
};
