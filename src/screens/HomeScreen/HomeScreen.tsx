import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHomeStats } from "../../hooks/useHomeStats";
import { MainTabParamList } from "../../navigation/types";
import { tokens } from "../../config/tokens";
import { styles, sk } from "./styles";
import PrivacyModal from "./PrivacyModal";

type NavigationProp = BottomTabNavigationProp<MainTabParamList>;

const t = tokens;

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
      <View style={sk.circle} />
      <View style={sk.lineWide} />
      <View style={sk.lineNarrow} />
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { carCount, recordCount, loading } = useHomeStats();
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerBrand}>
          <Text style={styles.brandName}>OtoHead</Text>
        </View>
        <Text style={styles.headerTagline}>
          Aracınızı takip edin, masrafları kontrol altında tutun
        </Text>
      </View>

      {/* ── STATS ── */}
      <View style={styles.statsRow}>
        {loading ? (
          <>
            <SkeletonCard />
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
              <Text style={styles.statIcon}>🚗</Text>
              <Text style={styles.statNumber}>{carCount}</Text>
              <Text style={styles.statLabel}>Araçlarınız</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.statCard,
                pressed && styles.statCardPressed,
              ]}
              onPress={() => navigation.navigate("Araç Yönetimi")}
            >
              <Text style={styles.statIcon}>🔧</Text>
              <Text style={styles.statNumber}>{recordCount}</Text>
              <Text style={styles.statLabel}>Bakım Kaydı</Text>
            </Pressable>
          </>
        )}
      </View>

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
