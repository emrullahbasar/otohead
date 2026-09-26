import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens(true);

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initTables } from './src/services/database';
import { requestPermission } from './src/notifications';
import MainNavigator from './src/navigation/MainNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import NotificationRouter from './src/notifications/NotificationRouter';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [navReady, setNavReady] = useState(false);

  // Ekranlar veritabanı tabloları oluşmadan çizilirse (yeni kurulumda) ilk
  // sorgular hata verip sessizce boş kalıyordu — tablolar hazır olana kadar bekle.
  useEffect(() => {
    initTables()
      .catch(() => {})
      .finally(() => setDbReady(true));
  }, []);

  // Bildirim izni eskiden uygulama ekrana hiçbir şey çizmeden en baştan
  // isteniyordu (bağlamsız, kullanıcı henüz hiçbir şey yapmamışken) — ilk
  // ekran göründükten sonra istemek hem daha doğal hem daha yüksek kabul
  // oranı sağlar (App Store/Play Store da bu sırayı önerir).
  useEffect(() => {
    if (navReady) requestPermission();
  }, [navReady]);

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Uygulama her zaman açık temalı (userInterfaceStyle: light); durum
            çubuğu simgeleri de her zaman koyu olmalı. expo-status-bar kuruluydu
            ama hiç kullanılmıyordu — Android'de simgeler açık zeminde beyaz
            (fiilen görünmez) kalıyordu. */}
        <StatusBar style="dark" />
        <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
          <MainNavigator />
        </NavigationContainer>
        {navReady && <NotificationRouter />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}