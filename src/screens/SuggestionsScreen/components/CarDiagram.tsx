import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, Circle, Text as SvgText } from 'react-native-svg';
import { tokens } from '../../../config/tokens';
import { SellPanelKey, SellPanelStatus, SellPanels } from '../../../services/suggestionApi';

const t = tokens;

// Kuşbakışı araç şeması — kullanıcının attığı oto ekspertiz kaplama şablonu
// referans alınarak: kaput/tavan/bagaj ortada organik eğrilerle birleşik,
// çamurluklar tekerlek üstünde şişkin badem biçiminde, kapılar cam/kasa
// ayrım çizgisiyle. Her parça ayrı, dokunulabilir bir Path. Durum
// dokunulmadıysa (Orijinal) gri, Değişen kırmızı+D, Boyalı mavi+B.
// Koordinatlar elle ayarlanmış sabit bir ızgara (viewBox 0 0 300 450) —
// önden (üstten) arkaya doğru.

// Bağımsız köşe yarıçaplarıyla yuvarlatılmış dikdörtgen path'i üretir —
// RN-SVG'nin Rect'i tek rx/ry aldığı için kapı şeritlerinin sadece dış
// (gövdeye bakan) kenarını daha yuvarlak, iç kenarını daha düz göstermek
// için bunu kullanıyoruz (gerçek bir aracın gövde hattı gibi).
function roundedRectPath(
  x: number, y: number, w: number, h: number,
  rTL: number, rTR: number, rBR: number, rBL: number,
): string {
  return `M${x + rTL},${y} L${x + w - rTR},${y} Q${x + w},${y} ${x + w},${y + rTR} ` +
    `L${x + w},${y + h - rBR} Q${x + w},${y + h} ${x + w - rBR},${y + h} ` +
    `L${x + rBL},${y + h} Q${x},${y + h} ${x},${y + h - rBL} ` +
    `L${x},${y + rTL} Q${x},${y} ${x + rTL},${y} Z`;
}

// Çamurluk "kanca" path'i üretir — referans şablondaki gibi yalnızca TEK
// uçta (ön çamurlukta üstte, arka çamurlukta altta) teker kemerine doğru
// sivrilen bir kanca, diğer ucu kapıyla aynı tam genişlikte düz birleşir
// (aradaki bel/boğum yok, tek parça gibi akar). `point` sivri ucun üstte mi
// altta mı olacağını belirler.
function fenderPath(
  innerX: number, outerX: number, yTop: number, yBot: number,
  side: 'left' | 'right', point: 'top' | 'bottom',
): string {
  const nearInner = innerX + (side === 'left' ? -14 : 14); // kanca ucunun iç kenara yakın x'i
  const bulge = (yBot - yTop) * 0.4;
  if (point === 'top') {
    return `M${innerX},${yTop + 6} Q${innerX},${yTop} ${nearInner},${yTop} ` +
      `Q${(nearInner + outerX) / 2},${yTop} ${outerX},${yTop + bulge} ` +
      `L${outerX},${yBot} L${innerX},${yBot} Z`;
  }
  return `M${innerX},${yTop} L${outerX},${yTop} L${outerX},${yBot - bulge} ` +
    `Q${(nearInner + outerX) / 2},${yBot} ${nearInner},${yBot} ` +
    `Q${innerX},${yBot} ${innerX},${yBot - 6} Z`;
}

const CAR_OUTLINE =
  'M150,6 Q172,6 180,24 Q214,48 230,98 Q234,114 219,130 L219,320 ' +
  'Q234,336 230,352 Q214,402 180,426 Q172,444 150,444 ' +
  'Q128,444 120,426 Q86,402 70,352 Q66,336 81,320 L81,130 ' +
  'Q66,114 70,98 Q86,48 120,24 Q128,6 150,6 Z';

// Kaput/bagaj ucu referans şablondaki gibi tek sivri nokta değil, far/stop
// oyuklarının oluşturduğu hafif çift tümsek (M profili) ile çiziliyor.
const KAPUT_PATH =
  'M150,20 Q166,8 184,22 Q201,40 204,128 L96,128 Q99,40 116,22 Q134,8 150,20 Z';
const BAGAJ_PATH =
  'M96,312 L204,312 Q201,400 184,418 Q166,432 150,420 Q134,432 116,418 Q99,400 96,312 Z';
const TAVAN_PATH = 'M108,140 Q150,126 192,140 Q208,223 192,306 Q150,322 108,306 Q92,223 108,140 Z';

const SIDE_PANEL_PATHS: Record<
  'SolÖnÇamurluk' | 'SağÖnÇamurluk' | 'SolÖnKapı' | 'SağÖnKapı' |
  'SolArkaKapı' | 'SağArkaKapı' | 'SolArkaÇamurluk' | 'SağArkaÇamurluk',
  string
> = {
  SolÖnÇamurluk:    fenderPath(100, 18, 18, 118, 'left', 'top'),
  SağÖnÇamurluk:    fenderPath(200, 282, 18, 118, 'right', 'top'),
  SolÖnKapı:        roundedRectPath(14,  118, 86, 100, 6,  6, 6,  6),
  SağÖnKapı:        roundedRectPath(200, 118, 86, 100, 6,  6, 6, 6),
  SolArkaKapı:       roundedRectPath(14,  218, 86, 100, 6,  6, 6, 6),
  SağArkaKapı:       roundedRectPath(200, 218, 86, 100, 6,  6, 6,  6),
  SolArkaÇamurluk:  fenderPath(100, 18, 318, 418, 'left', 'bottom'),
  SağArkaÇamurluk:  fenderPath(200, 282, 318, 418, 'right', 'bottom'),
};

// Kapı camı oyuğu — referans şablondaki gibi kapının üst kısmında, dış
// kenara doğru yuvarlatılmış açık renkli bir dikdörtgen; yalnızca görsel.
const DOOR_WINDOWS = [
  roundedRectPath(22,  124, 70, 40, 4, 16, 4, 4),
  roundedRectPath(208, 124, 70, 40, 16, 4, 4, 4),
  roundedRectPath(22,  224, 70, 40, 4, 16, 4, 4),
  roundedRectPath(208, 224, 70, 40, 16, 4, 4, 4),
];

const PANEL_LABEL_POS: Record<SellPanelKey, { x: number; y: number }> = {
  Kaput:            { x: 150, y: 80  },
  Tavan:            { x: 150, y: 224 },
  Bagaj:            { x: 150, y: 368 },
  SolÖnÇamurluk:    { x: 55,  y: 62  },
  SağÖnÇamurluk:    { x: 245, y: 62  },
  SolÖnKapı:        { x: 57,  y: 184 },
  SağÖnKapı:        { x: 243, y: 184 },
  SolArkaKapı:       { x: 57,  y: 284 },
  SağArkaKapı:       { x: 243, y: 284 },
  SolArkaÇamurluk:  { x: 55,  y: 374 },
  SağArkaÇamurluk:  { x: 245, y: 374 },
};

const WHEELS = [
  { cx: 12,  cy: 62  }, { cx: 288, cy: 62  },
  { cx: 12,  cy: 374 }, { cx: 288, cy: 374 },
];

const LIGHTS = [
  { cx: 118, cy: 32  }, { cx: 182, cy: 32  }, // far
  { cx: 118, cy: 408 }, { cx: 182, cy: 408 }, // stop lambası
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
  const renderLabel = (key: SellPanelKey) => {
    const status = panels[key];
    const label = LABEL[status];
    if (!label) return null;
    const pos = PANEL_LABEL_POS[key];
    return (
      <SvgText
        key={`${key}-label`}
        x={pos.x} y={pos.y + 8}
        fontSize={24}
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {label}
      </SvgText>
    );
  };

  const renderPanel = (key: SellPanelKey, d: string) => (
    <Path
      key={key}
      d={d}
      fill={FILL[panels[key]]}
      stroke={t.color.bg.surface}
      strokeWidth={3}
      strokeLinejoin="round"
      onPress={() => onPressPanel(key)}
    />
  );

  return (
    <View style={s.wrap}>
      <Svg width="100%" height={300} viewBox="0 0 300 450">
        <Path d={CAR_OUTLINE} fill={t.color.bg.base} stroke={t.color.border.default} strokeWidth={2} />

        {WHEELS.map((w, i) => (
          <Circle key={i} cx={w.cx} cy={w.cy} r={17} fill={t.color.text.primary} opacity={0.22} />
        ))}

        {renderPanel('SolÖnÇamurluk', SIDE_PANEL_PATHS.SolÖnÇamurluk)}
        {renderPanel('SağÖnÇamurluk', SIDE_PANEL_PATHS.SağÖnÇamurluk)}
        {renderPanel('SolÖnKapı', SIDE_PANEL_PATHS.SolÖnKapı)}
        {renderPanel('SağÖnKapı', SIDE_PANEL_PATHS.SağÖnKapı)}
        {renderPanel('SolArkaKapı', SIDE_PANEL_PATHS.SolArkaKapı)}
        {renderPanel('SağArkaKapı', SIDE_PANEL_PATHS.SağArkaKapı)}
        {renderPanel('SolArkaÇamurluk', SIDE_PANEL_PATHS.SolArkaÇamurluk)}
        {renderPanel('SağArkaÇamurluk', SIDE_PANEL_PATHS.SağArkaÇamurluk)}
        {renderPanel('Kaput', KAPUT_PATH)}
        {renderPanel('Tavan', TAVAN_PATH)}
        {renderPanel('Bagaj', BAGAJ_PATH)}

        {DOOR_WINDOWS.map((d, i) => (
          <Path key={i} d={d} fill={t.color.bg.base} opacity={0.55} />
        ))}

        {LIGHTS.map((l, i) => (
          <Ellipse key={i} cx={l.cx} cy={l.cy} rx={11} ry={7} fill={t.color.bg.base} opacity={0.9} />
        ))}

        {(Object.keys(PANEL_LABEL_POS) as SellPanelKey[]).map(key => renderLabel(key))}
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
