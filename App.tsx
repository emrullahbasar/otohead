import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens(true);

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
    requestPermission();
    initTables()
      .catch(() => {})
      .finally(() => setDbReady(true));
  }, []);

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
          <MainNavigator />
        </NavigationContainer>
        {navReady && <NotificationRouter />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}