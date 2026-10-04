import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeStats } from "../../hooks/useHomeStats";
import { useMaintenanceAlert } from "../../hooks/useMaintenanceAlert";
import { MainTabParamList } from "../../navigation/types";
import { styles, sk } from "./styles";
import PrivacyModal from "./PrivacyModal";
import { ScreenHeader } from "../../components/ScreenHeader";

type NavigationProp = BottomTabNavigationProp<MainTabParamList>;

const MENU_ITEMS: {
  tab: keyof MainTabParamList;
  icon: any;
  title: string;
  sub: string;
}[] = [
  {
    tab: "Yakıt",
    icon: require("../../../assets/icons/fuel.png"),
    title: "Yakıt Takip",
    sub: "Yakıt tüketimi ve maliyet analizi",
  },
  {
    tab: "Araç Yönetimi",
    icon: require("../../../assets/icons/maintenance.png"),
    title: "Araç Yönetimi",
    sub: "Bakım, muayene, sigorta ve kasko takibi",
  },
  {
    tab: "Araç Öneri",
    icon: require("../../../assets/icons/consulting.png"),
    title: "Danışmanlık",
    sub: "Uzman ekibimizden araç önerisi ve değerlendirme alın",
  },
];

function SkeletonCard() {
  return (
    <View style={styles.statCard}>
      <View style={sk.numberBlock} />
      <View style={sk.labelBlock} />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { carCount, fuelCars, loading } = useHomeStats();
  const maintenanceAlert = useMaintenanceAlert();
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ── */}
      <ScreenHeader
        title="OtoHead"
        subtitle="Aracınızı takip edin, masrafları kontrol altında tutun"
      />

      {/* ── STATS ── */}
      <View style={styles.statsRow}>
        {loading ? (
          <>
            <SkeletonCard />
            <View style={styles.statDivider} />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.statCardPressed,
              ]}
              onPress={() => navigation.navigate("Araç Yönetimi")}
            >
              <Text style={styles.statNumber}>{carCount}</Text>
              <Text style={styles.statLabel} allowFontScaling={false} numberOfLines={1}>
                ARAÇLARINIZ
              </Text>
            </Pressable>

            <View style={styles.statDivider} />

            <View style={styles.statCardRight}>
              {fuelCars.length === 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.fuelFill,
                    pressed && styles.statCardPressed,
                  ]}
                  onPress={() => navigation.navigate("Araç Yönetimi")}
                >
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel} allowFontScaling={false} numberOfLines={1}>
                    YAKIT KAYDI
                  </Text>
                </Pressable>
              )}

              {fuelCars.length === 1 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.fuelFill,
                    pressed && styles.statCardPressed,
                  ]}
                  onPress={() => navigation.navigate("Yakıt", { carId: fuelCars[0].id, ts: Date.now() })}
                >
                  <Text style={styles.fuelCarNameSingle} allowFontScaling={false} numberOfLines={1}>
                    {fuelCars[0].name}
                  </Text>
                  <Text style={styles.statNumber}>{fuelCars[0].count}</Text>
                  <Text style={styles.statLabel} allowFontScaling={false} numberOfLines={1}>
                    YAKIT KAYDI
                  </Text>
                </Pressable>
              )}

              {fuelCars.length > 1 && (
                <View style={styles.fuelGrid}>
                  {fuelCars.map(car => (
                    <Pressable
                      key={car.id}
                      style={({ pressed }) => [
                        styles.fuelGridCell,
                        pressed && styles.statCardPressed,
                      ]}
                      onPress={() => navigation.navigate("Yakıt", { carId: car.id, ts: Date.now() })}
                    >
                      <Text style={styles.fuelGridCarName} allowFontScaling={false} numberOfLines={1}>
                        {car.name}
                      </Text>
                      <Text style={styles.fuelGridCount} allowFontScaling={false}>
                        {car.count}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* ── Hoş geldin (hiç araç yoksa) ── */}
      {!loading && carCount === 0 && (
        <Pressable
          style={({ pressed }) => [styles.welcomeBanner, pressed && styles.bannerPressed]}
          onPress={() => navigation.navigate("Araç Yönetimi")}
        >
          <Text style={styles.welcomeTitle}>👋 Hoş geldiniz!</Text>
          <Text style={styles.welcomeText}>
            Başlamak için ilk aracınızı ekleyin — bakım ve yakıt takibi hemen aktif olsun.
          </Text>
        </Pressable>
      )}

      {/* ── Yaklaşan bakım uyarısı ── */}
      {maintenanceAlert && (
        <Pressable
          style={({ pressed }) => [styles.alertBanner, pressed && styles.bannerPressed]}
          onPress={() => navigation.navigate("Araç Yönetimi", { carId: maintenanceAlert.carId, ts: Date.now() })}
        >
          <Text style={styles.alertTitle}>🔧 Yaklaşan Bakım</Text>
          <Text style={styles.alertText}>
            {maintenanceAlert.carName} — {maintenanceAlert.type}:{' '}
            {maintenanceAlert.kind === 'km' ? (
              (maintenanceAlert.remainingKm ?? 0) <= 0
                ? `hedef kilometre geçildi (${Math.abs(maintenanceAlert.remainingKm ?? 0).toLocaleString('tr-TR')} km önce)`
                : `${(maintenanceAlert.remainingKm ?? 0).toLocaleString('tr-TR')} km kaldı`
            ) : (
              (maintenanceAlert.remainingDays ?? 0) <= 0
                ? `tarihi geçti (${Math.abs(maintenanceAlert.remainingDays ?? 0)} gün önce)`
                : `${maintenanceAlert.remainingDays} gün kaldı`
            )}
          </Text>
        </Pressable>
      )}

      {/* ── DIVIDER ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>HİZMETLER</Text>
      </View>

      {/* ── MENU ── */}
      <View style={styles.menuList}>
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.tab}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
              index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => navigation.navigate(item.tab)}
          >
            <View style={styles.menuIconWrap}>
              <Image source={item.icon} style={styles.menuIcon} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* ── FOOTER ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => setShowPrivacy(true)}
          hitSlop={12}
          style={{ paddingVertical: 12, paddingHorizontal: 8 }}
        >
          <Text style={[styles.footerText, { textDecorationLine: "underline" }]}>
            Gizlilik ve Veriler
          </Text>
        </Pressable>
        <Text style={styles.footerText}>
          OtoHead • Türkiye'nin Araç Yönetim Uygulaması
        </Text>
      </View>
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </ScrollView>
  );
}
