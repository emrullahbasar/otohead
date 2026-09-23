import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSuggestion, FUEL_TYPES, GEAR_TYPES } from '../../hooks/useSuggestion';
import { useSimpleRequest } from '../../hooks/useSimpleRequest';
import { SelectionModal } from './components/SelectionModal';
import FindTab from './tabs/FindTab';
import EvaluateTab from './tabs/EvaluateTab';
import { styles } from './styles';
import { tokens } from '../../config/tokens';

const t = tokens;
type TabType = 'find' | 'evaluate';

const TABS: { key: TabType; label: string }[] = [
  { key: 'find',     label: 'Araç Bul'      },
  { key: 'evaluate', label: 'Değerlendirme' },
];

export default function SuggestionsScreen() {
  const insets     = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('find');
  const suggestion = useSuggestion();
  const evaluation = useSimpleRequest();

  useEffect(() => {
    if (activeTab === 'find' && suggestion.clientId) {
      suggestion.checkOnMount();
    }
  }, [activeTab, suggestion.clientId]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerBox, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.header}>Araç Danışmanlık</Text>
        <Text style={styles.headerSub}>Uzman ekibimizden destek alın</Text>
      </View>

      <View style={tabStyles.bar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[tabStyles.tab, activeTab === tab.key && tabStyles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[tabStyles.label, activeTab === tab.key && tabStyles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {activeTab === 'find'     && <FindTab     suggestion={suggestion} />}
        {activeTab === 'evaluate' && <EvaluateTab evaluation={evaluation} />}
      </KeyboardAvoidingView>

      <SelectionModal
        modalType={suggestion.modalType}
        setModalType={suggestion.setModalType}
        fuelTypes={FUEL_TYPES}
        gearTypes={GEAR_TYPES}
        caseType={suggestion.caseType}
        setCaseType={suggestion.setCaseType}
        fuel={suggestion.fuel}
        setFuel={suggestion.setFuel}
        setGear={suggestion.setGear}
      />
    </View>
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
  },
  labelActive: {
    color: t.color.brand.primary,
    fontWeight: '600',
  },
});