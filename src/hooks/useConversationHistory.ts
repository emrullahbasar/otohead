import { useState, useCallback, useRef } from 'react';
import {
  fetchSuggestionHistory, fetchEvaluationHistory,
  SuggestionHistoryItem, EvaluationHistoryItem,
} from '../services/suggestionApi';

export type ConversationTarget = 'suggestion' | 'evaluation';

export interface ConversationMessage {
  key:    string;
  sender: 'user' | 'expert';
  text:   string;
  date:   string | null;
}

export interface ConversationEntry {
  key:      string;
  messages: ConversationMessage[];
  // Son mesaj kullanıcının bir takip mesajıysa ve uzman henüz yanıtlamadıysa
  // (durum tekrar BEKLİYOR'a döndüğü için) true olur — sohbette bir "yanıt
  // bekleniyor" satırı gösterilir.
  waiting:  boolean;
}

// Kullanıcının Mesajlar ekranından gönderdiği her takip mesajı, apps-script/
// Code.gs#handleFollowUp tarafından açıklama/mesaj hücresine
// "\n\n[Takip mesajı - <tarih>]\n<mesaj>" biçiminde eklenir. Bu işaretleyiciyi
// arayarak orijinal istek + her takip mesajını ayrı, gerçek tarihli birer
// sohbet balonuna bölebiliyoruz — aksi halde hepsi tek bir metin yığını
// olarak görünüp üst üste yazılmış gibi hissettiriyordu.
const FOLLOWUP_MARKER = /\[Takip mesajı - ([^\]]+)\]\n/g;

function splitUserBlocks(text: string, firstDate: string): { text: string; date: string }[] {
  if (!text) return [];
  const cuts: { start: number; end: number; date: string }[] = [];
  let match: RegExpExecArray | null;
  FOLLOWUP_MARKER.lastIndex = 0;
  while ((match = FOLLOWUP_MARKER.exec(text))) {
    cuts.push({ start: match.index, end: match.index + match[0].length, date: match[1] });
  }
  if (cuts.length === 0) {
    const trimmed = text.trim();
    return trimmed ? [{ text: trimmed, date: firstDate }] : [];
  }
  const blocks: { text: string; date: string }[] = [];
  const first = text.slice(0, cuts[0].start).trim();
  if (first) blocks.push({ text: first, date: firstDate });
  cuts.forEach((cut, i) => {
    const end = i + 1 < cuts.length ? cuts[i + 1].start : text.length;
    const blockText = text.slice(cut.end, end).trim();
    if (blockText) blocks.push({ text: blockText, date: cut.date });
  });
  return blocks;
}

// Uzman tarafında programatik bir işaretleyici yok — cevap doğrudan Sheets
// hücresine elle yazılıyor. Alışkanlık (bkz. Code.gs yorumları), yeni bir
// yanıtı eskisinin ÜZERİNE değil ALTINA, boş satır bırakarak eklemek; bu
// yüzden boş satırla ayrılmış her paragraf ayrı bir mesaj balonu sayılır.
function splitExpertBlocks(text: string): string[] {
  if (!text) return [];
  return text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
}

function interleave(userBlocks: { text: string; date: string }[], expertBlocks: string[]): ConversationMessage[] {
  const out: ConversationMessage[] = [];
  const n = Math.max(userBlocks.length, expertBlocks.length);
  for (let i = 0; i < n; i++) {
    if (userBlocks[i]) out.push({ key: `u${i}`, sender: 'user', text: userBlocks[i].text, date: userBlocks[i].date });
    if (expertBlocks[i]) out.push({ key: `e${i}`, sender: 'expert', text: expertBlocks[i], date: null });
  }
  return out;
}

const toEntry = (target: ConversationTarget, item: SuggestionHistoryItem | EvaluationHistoryItem): ConversationEntry => {
  if (target === 'suggestion') {
    const s = item as SuggestionHistoryItem;
    const summary = `${s.budget || ''} TL${s.yearMin ? ` • ${s.yearMin}-${s.yearMax}` : ''}${s.brand && s.brand !== 'Belirtilmedi' ? ` • ${s.brand}` : ''}${s.fuel ? ` • ${s.fuel}` : ''}`;
    const userBlocks = splitUserBlocks(s.description || '', s.createdAt);
    if (userBlocks.length > 0) userBlocks[0] = { ...userBlocks[0], text: `${summary}\n\n${userBlocks[0].text}` };
    else userBlocks.push({ text: summary, date: s.createdAt });
    const expertBlocks = splitExpertBlocks(s.recommendation || '');
    return {
      key: s.requestId,
      messages: interleave(userBlocks, expertBlocks),
      waiting: s.status === 'BEKLİYOR',
    };
  }
  const e = item as EvaluationHistoryItem;
  const label = e.ilanNo && e.ilanNo !== 'Belirtilmedi' ? `İlan No: ${e.ilanNo}` : null;
  const userBlocks = splitUserBlocks(e.message || '', e.createdAt);
  if (label && userBlocks.length > 0) userBlocks[0] = { ...userBlocks[0], text: `${label}\n\n${userBlocks[0].text}` };
  const expertBlocks = splitExpertBlocks(e.answer || '');
  return {
    key: e.requestId,
    messages: interleave(userBlocks, expertBlocks),
    waiting: e.status === 'BEKLİYOR',
  };
};

export const useConversationHistory = (target: ConversationTarget) => {
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState('');
  const loadedRef = useRef(false);

  const load = useCallback(async (force = false) => {
    if (loadedRef.current && !force) return;
    setLoading(true);
    setError('');
    try {
      const items = target === 'suggestion'
        ? await fetchSuggestionHistory()
        : await fetchEvaluationHistory();
      // Sunucu en yeniyi ilk sırada döndürür; sohbet ekranında en yeni mesaj
      // EN ALTTA görünmeli (gerçek mesajlaşma uygulamaları gibi), bu yüzden
      // ters çevriliyor — eskiler yukarıda, en yeni en altta.
      setEntries(items.map(item => toEntry(target, item)).reverse());
      loadedRef.current = true;
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geçmiş yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [target]);

  return { entries, loading, loaded, error, load };
};
