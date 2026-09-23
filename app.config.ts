import 'dotenv/config';

export default {
  expo: {
    name: 'ArabamCepte',
    slug: 'arabamcepte',
    scheme: 'arabamcepte',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F0F0F0',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.emrullah4.arabamcepte',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Yakıt fişini taramak için kamera gereklidir.',
        NSPhotoLibraryUsageDescription: 'Yakıt fişi fotoğrafı seçmek için galeri erişimi gereklidir.',
      },
    },
    android: {
      package: 'com.emrullah4.arabamcepte',
      allowBackup: false,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F0F0F0',
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
        projectId: 'ccd47d7f-a085-4f9c-8beb-e7045ec2c347',
      },
    },
  },
};
