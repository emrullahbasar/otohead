import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Text as SvgText } from 'react-native-svg';
import { tokens } from '../../../config/tokens';
import { SellPanelKey, SellPanelStatus, SellPanels } from '../../../services/suggestionApi';

const t = tokens;

// Kuşbakışı araç şeması — her kaporta parçası ayrı, dokunulabilir bir dikdörtgen.
// Durum dokunulmadıysa (Orijinal) gri, Değişen kırmızı+D, Boyalı mavi+B.
// Koordinatlar elle ayarlanmış sabit bir ızgara (viewBox 0 0 300 460) —
// önden (üstten) arkaya: çamurluk/kapı şeritleri yanlarda, kaput/tavan/bagaj
// ortada; köşelerdeki daireler tekerlek, yalnızca görsel (tıklanamaz).
const PANEL_RECTS: Record<SellPanelKey, { x: number; y: number; w: number; h: number }> = {
  Kaput:            { x: 100, y: 20,  w: 100, h: 130 },
  Tavan:            { x: 100, y: 150, w: 100, h: 150 },
  Bagaj:            { x: 100, y: 300, w: 100, h: 120 },
  SolÖnÇamurluk:    { x: 20,  y: 20,  w: 80,  h: 100 },
  SağÖnÇamurluk:    { x: 200, y: 20,  w: 80,  h: 100 },
  SolÖnKapı:        { x: 20,  y: 120, w: 80,  h: 100 },
  SağÖnKapı:        { x: 200, y: 120, w: 80,  h: 100 },
  SolArkaKapı:       { x: 20,  y: 220, w: 80,  h: 100 },
  SağArkaKapı:       { x: 200, y: 220, w: 80,  h: 100 },
  SolArkaÇamurluk:  { x: 20,  y: 320, w: 80,  h: 100 },
  SağArkaÇamurluk:  { x: 200, y: 320, w: 80,  h: 100 },
};

const WHEELS = [
  { cx: 20,  cy: 95  }, { cx: 280, cy: 95  },
  { cx: 20,  cy: 345 }, { cx: 280, cy: 345 },
];

const FILL: Record<SellPanelStatus, string> = {
  Orijinal: t.color.bg.muted,
  Değişen:  t.color.danger.default,
  Boyalı:   t.color.info.default,
};
const LABEL: Partial<Record<SellPanelStatus, string>> = { Değişen: 'D', Boyalı: 'B' };

interface Props {
  panels:    SellPanels;
  onPressPanel: (key: SellPanelKey) => void;
}

export function CarDiagram({ panels, onPressPanel }: Props) {
  return (
    <View style={s.wrap}>
      <Svg width="100%" height={280} viewBox="0 0 300 460">
        {WHEELS.map((w, i) => (
          <Circle key={i} cx={w.cx} cy={w.cy} r={16} fill={t.color.text.primary} opacity={0.25} />
        ))}
        {(Object.keys(PANEL_RECTS) as SellPanelKey[]).map(key => {
          const r = PANEL_RECTS[key];
          const status = panels[key];
          const label = LABEL[status];
          return (
            <React.Fragment key={key}>
              <Rect
                x={r.x} y={r.y} width={r.w} height={r.h} rx={10}
                fill={FILL[status]}
                stroke={t.color.bg.surface}
                strokeWidth={3}
                onPress={() => onPressPanel(key)}
              />
              {label && (
                <SvgText
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 + 8}
                  fontSize={28}
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={s.legend}>
        <LegendDot color={t.color.bg.muted} label="Orijinal" />
        <LegendDot color={t.color.danger.default} label="Değişen (D)" />
        <LegendDot color={t.color.info.default} label="Boyalı (B)" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: t.spacing.md,
    marginTop: t.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...t.typography.caption,
    color: t.color.text.muted,
  },
});
