import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { styles } from '../styles';
import { MaintenanceRecord } from '../../../types';
import { KM_INTERVALS } from '../../../notifications';
import {
  parseWholeNumberInput, formatWholeNumberDisplay,
  parseAmountInput, formatAmountDisplay,
} from '../../../utils/numberFormat';

// Km gibi tam sayı alanları için (yalnızca rakam; nokta/virgül ayıklanır, tr-TR
// binlik nokta ile gösterilir — kartlarla aynı biçim). İsimler geriye dönük
// uyumluluk için korunuyor, birçok ekran burdan import ediyor.
export const formatNumber = formatWholeNumberDisplay;
export const parseNumber  = parseWholeNumberInput;

// Ücret gibi ondalıklı alanlar için (virgül ondalık, nokta binlik — Türkçe kural).
export const formatAmount = formatAmountDisplay;
export const parseAmount  = parseAmountInput;

export const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const d = new Date(
      parseInt(parts[2], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10),
    );
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

export const formatDateToString = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

interface Props {
  detailRecord: MaintenanceRecord | null;
  setDetailRecord: (val: MaintenanceRecord | null) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  editType: string;     setEditType: (val: string) => void;
  editDate: string;     setEditDate: (val: string) => void;
  editNextDate: string; setEditNextDate: (val: string) => void;
  editKm: string;       setEditKm: (val: string) => void;
  editNextKm: string;   setEditNextKm: (val: string) => void;
  editNote: string;     setEditNote: (val: string) => void;
  editPrice: string;    setEditPrice: (val: string) => void;
  handleSaveEdit: () => void;
}

export const RecordDetailModal = ({
  detailRecord,
  setDetailRecord,
  isEditing,
  setIsEditing,
  editType,     setEditType,
  editDate,     setEditDate,
  editNextDate, setEditNextDate,
  editKm,       setEditKm,
  editNextKm,   setEditNextKm,
  editNote,     setEditNote,
  editPrice,    setEditPrice,
  handleSaveEdit,
}: Props) => {
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditNextDatePicker, setShowEditNextDatePicker] = useState(false);

  const kmRef = useRef<TextInput>(null);
  const nextKmRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);

  if (!detailRecord) return null;

  const isDateType =
    detailRecord.type === 'Muayene' ||
    detailRecord.type === 'Sigorta' ||
    detailRecord.type === 'Kasko';

  const interval = KM_INTERVALS[editType || detailRecord.type];

  return (
    <Modal
      visible={!!detailRecord}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Android'de donanım "Geri" tuşu — düzenleme modundaysa "Vazgeç" gibi
        // davranır (değişiklikleri at, görünüm moduna dön); değilse pencereyi kapatır.
        if (isEditing) {
          setEditType(detailRecord.type);
          setEditDate(detailRecord.date);
          setEditNextDate(detailRecord.nextDate || '');
          setEditKm(detailRecord.km);
          setEditNextKm(detailRecord.nextKm || '');
          setEditNote(detailRecord.note || '');
          setEditPrice(detailRecord.price || '');
          setIsEditing(false);
        } else {
          setDetailRecord(null);
        }
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>

            <View style={styles.detailHeader}>
              <Text style={styles.detailType}>
                {isEditing ? 'Düzenle' : detailRecord.type}
              </Text>
              <Pressable onPress={() => { setDetailRecord(null); setIsEditing(false); }}>
                <Text style={styles.detailClose}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.detailContent}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              // iOS numeric/decimal klavyede Bitti tuşu yok; kullanıcı klavyeyi kaydırarak kapatabilsin.
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {isEditing ? (
                <>
                  <Text style={styles.detailLabel}>İŞLEM TÜRÜ</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={editType}
                    onChangeText={setEditType}
                    returnKeyType="next"
                    onSubmitEditing={() => noteRef.current?.focus()}
                    blurOnSubmit={false}
                    placeholderTextColor="#868686"
                  />

                  <Text style={styles.detailLabel}>TARİH</Text>
                  <Pressable
                    style={styles.detailInput}
                    onPress={() => setShowEditDatePicker(true)}
                  >
                    <Text style={{ color: editDate ? '#050404' : '#ff0000' }}>
                      {editDate || 'Tarih Seçin'}
                    </Text>
                  </Pressable>

                  {isDateType && (
                    <>
                      <Text style={styles.detailLabel}>HATIRLATMA TARİHİ</Text>
                      <Pressable
                        style={styles.detailInput}
                        onPress={() => setShowEditNextDatePicker(true)}
                      >
                        <Text style={{ color: editNextDate ? '#050404' : '#ff0000' }}>
                          {editNextDate || 'Hatırlatma Tarihi Seçin'}
                        </Text>
                      </Pressable>
                    </>
                  )}

                  <Text style={styles.detailLabel}>KİLOMETRE</Text>
                  <TextInput
                    ref={kmRef}
                    style={styles.detailInput}
                    value={formatNumber(editKm)}
                    onChangeText={(t) => setEditKm(parseNumber(t))}
                    keyboardType="numeric"
                    placeholderTextColor="#868686"
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      interval ? nextKmRef.current?.focus() : noteRef.current?.focus()
                    }
                    blurOnSubmit={false}
                  />

                  {interval && (
                    <>
                      <Text style={styles.detailLabel}>SONRAKİ BAKIM KM</Text>
                      <TextInput
                        ref={nextKmRef}
                        style={styles.detailInput}
                        value={formatNumber(editNextKm)}
                        onChangeText={(t) => setEditNextKm(parseNumber(t))}
                        keyboardType="numeric"
                        placeholderTextColor="#868686"
                        returnKeyType="next"
                        onSubmitEditing={() => noteRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </>
                  )}

                  <Text style={styles.detailLabel}>NOT</Text>
                  <TextInput
                    ref={noteRef}
                    style={styles.detailInput}
                    value={editNote}
                    onChangeText={setEditNote}
                    placeholderTextColor="#868686"
                    returnKeyType="next"
                    onSubmitEditing={() => priceRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  <Text style={styles.detailLabel}>ÜCRET (₺)</Text>
                  <TextInput
                    ref={priceRef}
                    style={styles.detailInput}
                    value={formatAmount(editPrice)}
                    onChangeText={(t) => setEditPrice(parseAmount(t))}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#868686"
                    returnKeyType="done"
                  />
                </>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>📅 Tarih</Text>
                    <Text style={styles.detailRowValue}>{detailRecord.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>🚗 Kilometre</Text>
                    <Text style={styles.detailRowValue}>{formatNumber(String(detailRecord.km))} km</Text>
                  </View>
                  {detailRecord.nextKm ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>🔔 Sonraki Bakım</Text>
                      <Text style={styles.detailRowValue}>{formatNumber(String(detailRecord.nextKm))} km</Text>
                    </View>
                  ) : null}
                  {detailRecord.nextDate ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>📆 Sonraki Tarih</Text>
                      <Text style={styles.detailRowValue}>{detailRecord.nextDate}</Text>
                    </View>
                  ) : null}
                  {detailRecord.price ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>💰 Ücret</Text>
                      <Text style={styles.detailRowValue}>{formatAmount(String(detailRecord.price))} ₺</Text>
                    </View>
                  ) : null}
                  {detailRecord.note ? (
                    <View style={styles.detailNoteBox}>
                      <Text style={styles.detailRowLabel}>📝 Not</Text>
                      <Text style={styles.detailNote}>{detailRecord.note}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>

            <View style={styles.detailActions}>
              {isEditing ? (
                <>
                  <Pressable style={styles.detailSaveBtn} onPress={handleSaveEdit}>
                    <Text style={styles.detailSaveBtnText}>Kaydet</Text>
                  </Pressable>
                  <Pressable
                    style={styles.detailCancelBtn}
                    onPress={() => {
                      // Yazılmış ama kaydedilmemiş değişiklikleri at, kayıtlı hale dön
                      // (eskiden "Vazgeç" alanları sıfırlamıyordu; tekrar Düzenle'ye
                      // girince yarım kalmış metinler öylece duruyordu).
                      setEditType(detailRecord.type);
                      setEditDate(detailRecord.date);
                      setEditNextDate(detailRecord.nextDate || '');
                      setEditKm(detailRecord.km);
                      setEditNextKm(detailRecord.nextKm || '');
                      setEditNote(detailRecord.note || '');
                      setEditPrice(detailRecord.price || '');
                      setIsEditing(false);
                    }}
                  >
                    <Text style={styles.detailCancelBtnText}>Vazgeç</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.detailEditBtn} onPress={() => setIsEditing(true)}>
                  <Text style={styles.detailEditBtnText}>Düzenle</Text>
                </Pressable>
              )}
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={showEditDatePicker}
        mode="date"
        date={parseDateString(editDate)}
        display="inline"
        onConfirm={(date: Date) => {
          setEditDate(formatDateToString(date));
          setShowEditDatePicker(false);
        }}
        onCancel={() => setShowEditDatePicker(false)}
        confirmTextIOS="Tamam"
        cancelTextIOS="Vazgeç"
        pickerContainerStyleIOS={{ backgroundColor: '#FFFFFF' }}
        textColor="#0D1520"
        isDarkModeEnabled={false}
      />

      <DateTimePickerModal
        isVisible={showEditNextDatePicker}
        mode="date"
        date={parseDateString(editNextDate)}
        display="inline"
        onConfirm={(date: Date) => {
          setEditNextDate(formatDateToString(date));
          setShowEditNextDatePicker(false);
        }}
        onCancel={() => setShowEditNextDatePicker(false)}
        confirmTextIOS="Tamam"
        cancelTextIOS="Vazgeç"
        pickerContainerStyleIOS={{ backgroundColor: '#FFFFFF' }}
        textColor="#0D1520"
        isDarkModeEnabled={false}
      />
    </Modal>
  );
};