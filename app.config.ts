import 'dotenv/config';

export default {
  expo: {
    name: 'OtoHead',
    slug: 'otohead',
    scheme: 'otohead',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#062651',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.emrullah4.otohead',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Yakıt fişini taramak için kamera gereklidir.',
        NSPhotoLibraryUsageDescription: 'Yakıt fişi fotoğrafı seçmek için galeri erişimi gereklidir.',
      },
    },
    android: {
      package: 'com.emrullah4.otohead',
      // Repoda tutulmaz (.gitignore); EAS derlemesinde GOOGLE_SERVICES_JSON dosya değişkeni olarak gelir.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      allowBackup: false,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#062651',
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_IMAGES',
      ],
      // Expo'nun varsayılan şablon manifest'i bunu otomatik ekliyor ama
      // uygulamada hiçbir overlay/floating-window özelliği yok — engelle (SEC-015).
      blockedPermissions: ['android.permission.SYSTEM_ALERT_WINDOW'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      '@react-native-community/datetimepicker',
      'expo-sqlite',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          cameraPermission: 'Yakıt fişini taramak için kamera gereklidir.',
          microphonePermission: false,
          photosPermission: 'Yakıt fişi fotoğrafı seçmek için galeri erişimi gereklidir.',
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '16.0',
          },
          android: {
            minSdkVersion: 24,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'f818d42e-093d-4891-bb05-9527743cc774',
      },
    },
  },
};
