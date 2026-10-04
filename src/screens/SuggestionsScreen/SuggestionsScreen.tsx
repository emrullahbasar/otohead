import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, KeyboardAvoidingView, AppState,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../navigation/types';
import { useSuggestion, FUEL_TYPES, GEAR_TYPES } from '../../hooks/useSuggestion';
import { useSimpleRequest } from '../../hooks/useSimpleRequest';
import { useSellEstimate } from '../../hooks/useSellEstimate';
import { SelectionModal } from './components/SelectionModal';
import FindTab from './tabs/FindTab';
import EvaluateChooser from './tabs/EvaluateChooser';
import { styles } from './styles';
import { tokens } from '../../config/tokens';
import { ScreenHeader } from '../../components/ScreenHeader';

const t = tokens;
type TabType = 'find' | 'evaluate';

const TABS: { key: TabType; label: string }[] = [
  { key: 'find',     label: 'Kriterlere Göre Bul' },
  { key: 'evaluate', label: 'Araç Değerlendirme'  },
];

export default function SuggestionsScreen() {
  const route      = useRoute<RouteProp<MainTabParamList, 'Araç Öneri'>>();
  const [activeTab, setActiveTab] = useState<TabType>('find');
  const suggestion = useSuggestion();
  const evaluation = useSimpleRequest();
  const sell       = useSellEstimate();
  const navigation = useNavigation();

  useEffect(() => {
    if (activeTab === 'find' && suggestion.clientId) {
      suggestion.checkOnMount();
    }
  }, [activeTab, suggestion.clientId]);

  // Değerlendirme sekmesi ilk açıldığında bir kez sorgulanır — hem Alacağım
  // Araç (evaluation) hem Satacağım Araç (sell) için, EvaluateChooser hangi
  // alt akışı göstereceğine bu ikisinin sonucuna bakarak kendi karar verir.
  useEffect(() => {
    if (activeTab === 'evaluate' && evaluation.clientId) evaluation.checkOnMount();
  }, [activeTab, evaluation.clientId]);
  useEffect(() => {
    if (activeTab === 'evaluate' && sell.clientId) sell.checkOnMount();
  }, [activeTab, sell.clientId]);

  // Cevap beklerken sekmeye dönünce veya uygulama ön plana gelince bekleyen
  // istekleri otomatik tazele (her render'da yeniden tetiklenmesin diye ref).
  const pendingRef = useRef({ suggestion: false, evaluation: false, sell: false });
  pendingRef.current = {
    suggestion: suggestion.suggestion?.status === 'BEKLİYOR',
    evaluation: evaluation.result?.status === 'BEKLİYOR',
    sell:       sell.result?.status === 'BEKLİYOR',
  };
  const actionsRef = useRef({
    checkSuggestion: suggestion.checkStatus,
    checkEvaluation: evaluation.checkStatus,
    checkSell:       sell.checkStatus,
  });
  actionsRef.current = {
    checkSuggestion: suggestion.checkStatus,
    checkEvaluation: evaluation.checkStatus,
    checkSell:       sell.checkStatus,
  };

  const refreshPending = useCallback(() => {
    if (pendingRef.current.suggestion) actionsRef.current.checkSuggestion();
    if (pendingRef.current.evaluation) actionsRef.current.checkEvaluation();
    if (pendingRef.current.sell)       actionsRef.current.checkSell();
  }, []);

  useFocusEffect(refreshPending);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && navigation.isFocused()) refreshPending();
    });
    return () => sub.remove();
  }, [navigation, refreshPending]);

  // Uzman cevabı bildirimine dokunulunca ilgili sekmeye geç ve sonucu tazele.
  const targetTab = route.params?.tab;
  const targetStamp = route.params?.ts;
  useEffect(() => {
    if (!targetTab) return;
    if (targetTab === 'evaluate') {
      setActiveTab('evaluate');
      evaluation.forceCheck();
    } else if (targetTab === 'sell') {
      setActiveTab('evaluate');
      sell.forceCheck();
    } else {
      setActiveTab('find');
      suggestion.forceCheck();
    }
  }, [targetStamp]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="Araç Danışmanlık"
        subtitle="Uzman ekibimizden destek alın"
      />

      <View style={tabStyles.bar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[tabStyles.tab, activeTab === tab.key && tabStyles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[tabStyles.label, activeTab === tab.key && tabStyles.labelActive]}
              numberOfLines={2}
              allowFontScaling={false}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'find'     && <FindTab suggestion={suggestion} />}
        {activeTab === 'evaluate' && <EvaluateChooser evaluation={evaluation} sell={sell} />}
      </View>

      <SelectionModal
        modalType={suggestion.modalType}
        setModalType={suggestion.setModalType}
        fuelTypes={FUEL_TYPES}
        gearTypes={GEAR_TYPES}
        caseType={suggestion.caseType}
        setCaseType={suggestion.setCaseType}
        fuel={suggestion.fuel}
        setFuel={suggestion.setFuel}
        gear={suggestion.gear}
        setGear={suggestion.setGear}
        brands={suggestion.brands}
        brand={suggestion.brand}
        setBrand={suggestion.setBrand}
        touched={suggestion.touched}
      />
    </KeyboardAvoidingView>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: t.color.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: t.color.brand.primary,
  },
  label: {
    ...t.typography.bodySm,
    color: t.color.text.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelActive: {
    color: t.color.brand.primary,
    fontWeight: '600',
  },
});