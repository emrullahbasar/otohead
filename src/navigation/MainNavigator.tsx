import React from 'react';
import { Text, View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { tokens } from '../config/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen        from '../screens/HomeScreen/HomeScreen';
import FuelScreen        from '../screens/FuelScreen/FuelScreen';
import MaintenanceScreen from '../screens/ManintenanceScreen/MaintenanceScreen';
import SuggestionsScreen from '../screens/SuggestionsScreen/SuggestionsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const t   = tokens;

const TAB_ICONS: Record<keyof MainTabParamList, ImageSourcePropType | null> = {
  'Ana Sayfa':     require('../../assets/icons/home.png'),
  'Yakıt':         require('../../assets/icons/fuel.png'),
  'Araç Yönetimi': require('../../assets/icons/maintenance.png'),
  'Araç Öneri':    require('../../assets/icons/consulting.png'),
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  'Ana Sayfa':     'Ana Sayfa',
  'Yakıt':         'Yakıt',
  'Araç Yönetimi': 'Yönetim',
  'Araç Öneri':    'Danışmanlık',
};

function TabItem({ name, focused }: { name: keyof MainTabParamList; focused: boolean }) {
  const iconSource = TAB_ICONS[name];
  return (
    <View style={tab.item}>
      {iconSource ? (
        <Image
          source={iconSource}
          style={[tab.iconImage, { tintColor: focused ? t.color.brand.primary : t.color.text.muted }]}
          resizeMode="contain"
        />
      ) : (
        <Text style={[tab.iconEmoji, focused && tab.iconActive]}>
        </Text>
      )}
      <Text style={[tab.label, focused && tab.labelActive]}>
        {TAB_LABELS[name]}
      </Text>
    </View>
  );
}

function MainNavigatorInner() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused }) => (
          <TabItem name={route.name as keyof MainTabParamList} focused={focused} />
        ),
        tabBarStyle: [
          tab.bar,
          {
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
          }
        ],
        tabBarItemStyle: tab.wrapper,
      })}
    >
      <Tab.Screen name="Ana Sayfa"     component={HomeScreen} />
      <Tab.Screen name="Yakıt"         component={FuelScreen} />
      <Tab.Screen name="Araç Yönetimi" component={MaintenanceScreen} />
      <Tab.Screen name="Araç Öneri"    component={SuggestionsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return <MainNavigatorInner />;
}

const tab = StyleSheet.create({
  bar: {
    backgroundColor: t.color.bg.surface,
    borderTopWidth: 1,
    borderTopColor: t.color.border.divider,
    shadowColor: '#0D1520',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 4,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 25,
    width: 80,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  iconEmoji: {
    fontSize: 20,
    color: t.color.text.muted,
  },
  iconActive: {
    color: t.color.brand.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: t.color.text.muted,
    textAlign: 'center',
    includeFontPadding: false,
    width: 72,
  },
  labelActive: {
    color: t.color.brand.primary,
    fontWeight: '600',
  },
});