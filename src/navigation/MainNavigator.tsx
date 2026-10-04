import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { tokens } from '../config/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findMostUrgentMaintenance } from '../services/kmAlerts';
import { findDanismanlikAlerts } from '../services/danismanlikAlerts';
import { getConfig, setConfig } from '../services/database';

// "Görüldü" takip anahtarları — rozet, kullanıcı ilgili sekmeye girip durumu
// gördüğünde söner (bakımın kendisi düzelmiş olmasa bile). Mevcut Mesajlar
// içi "okunmadı" noktasından (unread_suggestion_reply/unread_evaluation_reply)
// BİLEREK ayrı tutuldu — o, yalnızca Mesajlar açılınca söner; bu rozet ise
// sekmeye girince söner.
const SEEN_MAINTENANCE_KEY  = 'seenMaintenanceAlertKey';
const SEEN_SUGGESTION_KEY   = 'tabSeenSuggestion';
const SEEN_EVALUATION_KEY   = 'tabSeenEvaluation';

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
  'Yakıt':         'Yakıt Takip',
  'Araç Yönetimi': 'Araç Yönetimi',
  'Araç Öneri':    'Danışmanlık',
};

function TabItem({ name, focused, showAlertDot }: { name: keyof MainTabParamList; focused: boolean; showAlertDot?: boolean }) {
  const iconSource = TAB_ICONS[name];
  return (
    <View style={tab.item}>
      <View>
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
        {showAlertDot && <View style={tab.alertDot} />}
      </View>
      {/* Sekme çubuğu sabit bir alan; sistem yazı boyutu büyütülünce (erişilebilirlik)
          etiketler taşıp kesiliyordu ("Ana", "Yakıt", "Araç Yö"...). Native
          sekme çubukları da genelde bundan bağımsızdır — burada da sabit tutuyoruz. */}
      <Text
        style={[tab.label, focused && tab.labelActive]}
        allowFontScaling={false}
        numberOfLines={1}
      >
        {TAB_LABELS[name]}
      </Text>
    </View>
  );
}

function MainNavigatorInner() {
  const insets = useSafeAreaInsets();
  // İki sekme rozeti de aynı desenle çalışır: bir "acil durum" varsa VE
  // kullanıcı onu daha önce görmediyse (bkz. SEEN_*_KEY) kırmızı nokta yanar.
  // useFocusEffect burada çalışmaz (bu bileşen bir ekran değil, navigator'ın
  // kendisi) — bunun yerine her sekme değişiminde (screenListeners.focus)
  // tazelenir; ilgili sekmeye girildiğinde ise (Tab.Screen'in kendi
  // listeners.focus'u) "görüldü" olarak işaretlenip söner.
  const [hasMaintenanceAlert,  setHasMaintenanceAlert]  = useState(false);
  const [hasDanismanlikAlert, setHasDanismanlikAlert]   = useState(false);

  const refreshMaintenanceAlert = useCallback(() => {
    findMostUrgentMaintenance().then(async alert => {
      if (!alert) { setHasMaintenanceAlert(false); return; }
      const seenKey = await getConfig(SEEN_MAINTENANCE_KEY);
      setHasMaintenanceAlert(seenKey !== alert.key);
    }).catch(() => {});
  }, []);

  const markMaintenanceSeen = useCallback(() => {
    findMostUrgentMaintenance().then(alert => {
      if (alert) setConfig(SEEN_MAINTENANCE_KEY, alert.key).catch(() => {});
      setHasMaintenanceAlert(false);
    }).catch(() => {});
  }, []);

  const refreshDanismanlikAlert = useCallback(() => {
    findDanismanlikAlerts().then(async alerts => {
      let unseen = false;
      for (const a of alerts) {
        const key = a.target === 'suggestion' ? SEEN_SUGGESTION_KEY : SEEN_EVALUATION_KEY;
        const seen = await getConfig(key);
        if (seen !== a.requestId) { unseen = true; break; }
      }
      setHasDanismanlikAlert(unseen);
    }).catch(() => {});
  }, []);

  const markDanismanlikSeen = useCallback(() => {
    findDanismanlikAlerts().then(alerts => {
      alerts.forEach(a => {
        const key = a.target === 'suggestion' ? SEEN_SUGGESTION_KEY : SEEN_EVALUATION_KEY;
        setConfig(key, a.requestId).catch(() => {});
      });
      setHasDanismanlikAlert(false);
    }).catch(() => {});
  }, []);

  const refreshAll = useCallback(() => {
    refreshMaintenanceAlert();
    refreshDanismanlikAlert();
  }, [refreshMaintenanceAlert, refreshDanismanlikAlert]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenListeners={{ focus: refreshAll }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused }) => (
          <TabItem
            name={route.name as keyof MainTabParamList}
            focused={focused}
            showAlertDot={
              (route.name === 'Araç Yönetimi' && hasMaintenanceAlert) ||
              (route.name === 'Araç Öneri' && hasDanismanlikAlert)
            }
          />
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
      <Tab.Screen
        name="Araç Yönetimi"
        component={MaintenanceScreen}
        listeners={{ focus: markMaintenanceSeen }}
      />
      <Tab.Screen
        name="Araç Öneri"
        component={SuggestionsScreen}
        listeners={{ focus: markDanismanlikSeen }}
      />
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
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.color.danger.default,
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