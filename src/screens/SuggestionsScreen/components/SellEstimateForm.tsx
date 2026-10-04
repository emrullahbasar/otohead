import React, { useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { styles } from '../styles';
import { trUpper } from '../../../utils/textCase';
import { formatWholeNumberDisplay, parseWholeNumberInput } from '../../../utils/numberFormat';
import { SellPanelKey, SellPanelStatus, SellPanels, SELL_PANEL_KEYS } from '../../../services/suggestionApi';
import { CarDiagram } from './CarDiagram';
import { tokens } from '../../../config/tokens';

const t = tokens;

const PANEL_LABELS: Record<SellPanelKey, string> = {
  Kaput:            'Kaput',
  SolÖnÇamurluk:    'Sol Ön Çamurluk',
  SağÖnÇamurluk:    'Sağ Ön Çamurluk',
  SolÖnKapı:        'Sol Ön Kapı',
  SağÖnKapı:        'Sağ Ön Kapı',
  Tavan:            'Tavan',
  SolArkaKapı:       'Sol Arka Kapı',
  SağArkaKapı:       'Sağ Arka Kapı',
  SolArkaÇamurluk:  'Sol Arka Çamurluk',
  SağArkaÇamurluk:  'Sağ Arka Çamurluk',
  Bagaj:            'Bagaj Kapağı',
};

const PANEL_STATUSES: SellPanelStatus[] = ['Orijinal', 'Değişen', 'Boyalı'];

interface Props {
  name: string; setName: (v: string) => void;
  brand: string; model: string; year: string;
  pkg: string; setPkg: (v: string) => void;
  km: string; setKm: (v: string) => void;
  panels: SellPanels; setPanel: (key: SellPanelKey, status: SellPanelStatus) => void;
  heavyDamage: boolean; setHeavyDamage: (v: boolean) => void;
  loading: boolean; error: string;
  onSubmit: () => void;
  setModalType: (type: 'brand' | 'model' | 'year' | null) => void;
}

export const SellEstimateForm = ({
  name, setName,
  brand, model, year,
  pkg, setPkg,
  km, setKm,
  panels, setPanel,
  heavyDamage, setHeavyDamage,
  loading, error,
  onSubmit,
  setModalType,
}: Props) => {
  const pkgRef = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      {error !== '' && (
        <View style={[styles.errorBox, { marginBottom: 12, marginHorizontal: 0 }]}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <Text style={styles.label}>{trUpper('İsminiz (isteğe bağlı)')}</Text>
      <TextInput
        style={styles.input}
        placeholder="Size nasıl hitap edelim?"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={name}
        onChangeText={setName}
        maxLength={40}
        editable={!loading}
      />

      <Text style={styles.label}>{trUpper('Marka')}</Text>
      <Pressable style={styles.selector} onPress={() => setModalType('brand')} disabled={loading}>
        <Text style={brand ? styles.selectorText : styles.selectorPlaceholder}>{brand || 'Seçin'}</Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>{trUpper('Model')}</Text>
      <Pressable
        style={[styles.selector, !brand && { opacity: 0.5 }]}
        onPress={() => brand && setModalType('model')}
        disabled={loading || !brand}
      >
        <Text style={model ? styles.selectorText : styles.selectorPlaceholder}>{model || 'Önce marka seçin'}</Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>{trUpper('Motor seçeneği ve Araç paketi')}</Text>
      <TextInput
        ref={pkgRef}
        style={styles.input}
        placeholder="örn. 1.6 TDI Elegance"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={pkg}
        onChangeText={setPkg}
        maxLength={60}
        editable={!loading}
      />

      <Text style={styles.label}>{trUpper('Model yılı')}</Text>
      <Pressable style={styles.selector} onPress={() => setModalType('year')} disabled={loading}>
        <Text style={year ? styles.selectorText : styles.selectorPlaceholder}>{year || 'Seçin'}</Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>{trUpper('Kilometre')}</Text>
      <TextInput
        style={styles.input}
        placeholder="örn. 85.000"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={formatWholeNumberDisplay(km)}
        onChangeText={t => setKm(parseWholeNumberInput(t))}
        keyboardType="numeric"
        editable={!loading}
      />

      <Text style={[styles.label, { marginTop: t.spacing.lg }]}>
        {trUpper('Kaporta durumu (dokunulmayan parça Orijinal sayılır)')}
      </Text>
      <View style={panelListStyle}>
        {SELL_PANEL_KEYS.map(key => (
          <View key={key} style={panelRowStyle}>
            <Text style={panelNameStyle} numberOfLines={1}>{PANEL_LABELS[key]}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {PANEL_STATUSES.map(status => {
                const active = panels[key] === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => setPanel(key, status)}
                    disabled={loading}
                    style={{
                      paddingVertical: 6, paddingHorizontal: 10, borderRadius: t.radius.full,
                      backgroundColor: active
                        ? status === 'Değişen' ? t.color.danger.default
                          : status === 'Boyalı' ? t.color.info.default
                          : t.color.text.muted
                        : t.color.bg.base,
                      borderWidth: 1,
                      borderColor: active ? 'transparent' : t.color.border.default,
                    }}
                  >
                    <Text style={{
                      ...t.typography.caption,
                      fontWeight: '600',
                      color: active ? '#FFFFFF' : t.color.text.muted,
                    }}>
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <CarDiagram panels={panels} onPressPanel={key => {
        // Şemadan dokununca sırayla Orijinal → Değişen → Boyalı → Orijinal döner.
        const order: SellPanelStatus[] = ['Orijinal', 'Değişen', 'Boyalı'];
        const next = order[(order.indexOf(panels[key]) + 1) % order.length];
        setPanel(key, next);
      }} />

      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.lg, gap: t.spacing.sm }}
        onPress={() => setHeavyDamage(!heavyDamage)}
        disabled={loading}
      >
        <View style={{
          width: 24, height: 24, borderRadius: 6, borderWidth: 2,
          borderColor: heavyDamage ? t.color.danger.default : t.color.border.default,
          backgroundColor: heavyDamage ? t.color.danger.default : t.color.bg.base,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {heavyDamage && <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>✓</Text>}
        </View>
        <Text style={{ ...t.typography.bodySm, color: t.color.text.primary, fontWeight: '600' }}>
          Araç ağır hasar kayıtlı
        </Text>
      </Pressable>

      <Text style={styles.fieldHint}>
        Lütfen telefon numarası, adres gibi ek kişisel bilgi paylaşmayın.
      </Text>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Gönderiliyor...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Fiyat Tahmini İste</Text>
        )}
      </Pressable>
    </View>
  );
};

const panelListStyle = {
  borderWidth: 1,
  borderColor: t.color.border.default,
  borderRadius: t.radius.md,
  overflow: 'hidden' as const,
};
const panelRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingVertical: t.spacing.sm,
  paddingHorizontal: t.spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: t.color.border.divider,
  gap: t.spacing.sm,
};
const panelNameStyle = {
  ...t.typography.bodySm,
  color: t.color.text.primary,
  flexShrink: 1,
};
