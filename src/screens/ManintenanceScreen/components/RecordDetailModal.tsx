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

export const formatNumber = (value: string | number): string => {
  const raw = String(value).replace(/,/g, '');
  if (!raw) return '';
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

export const parseNumber = (value: string): string => value.replace(/,/g, '');

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

  const isPeriyodik = detailRecord.type === 'Periyodik Bakım';

  return (
    <Modal visible={!!detailRecord} transparent animationType="fade">
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
              showsVerticalScrollIndicator={false}
            >
              {isEditing ? (
                <>
                  <Text style={styles.detailLabel}>İşlem Türü</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={editType}
                    onChangeText={setEditType}
                    returnKeyType="next"
                    onSubmitEditing={() => noteRef.current?.focus()}
                    blurOnSubmit={false}
                    placeholderTextColor="#868686"
                  />

                  <Text style={styles.detailLabel}>Tarih</Text>
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
                      <Text style={styles.detailLabel}>Hatırlatma Tarihi</Text>
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

                  <Text style={styles.detailLabel}>Kilometre</Text>
                  <TextInput
                    ref={kmRef}
                    style={styles.detailInput}
                    value={formatNumber(editKm)}
                    onChangeText={(t) => setEditKm(parseNumber(t))}
                    keyboardType="numeric"
                    placeholderTextColor="#868686"
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      isPeriyodik ? nextKmRef.current?.focus() : noteRef.current?.focus()
                    }
                    blurOnSubmit={false}
                  />

                  {isPeriyodik && (
                    <>
                      <Text style={styles.detailLabel}>Sonraki Bakım Km</Text>
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

                  <Text style={styles.detailLabel}>Not</Text>
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

                  <Text style={styles.detailLabel}>Ücret (₺)</Text>
                  <TextInput
                    ref={priceRef}
                    style={styles.detailInput}
                    value={formatNumber(editPrice)}
                    onChangeText={(t) => setEditPrice(parseNumber(t))}
                    keyboardType="numeric"
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
                      <Text style={styles.detailRowValue}>{formatNumber(String(detailRecord.price))} ₺</Text>
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
                  <Pressable style={styles.detailCancelBtn} onPress={() => setIsEditing(false)}>
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
        pickerContainerStyleIOS={{ backgroundColor: '#1c1c1e' }}
        textColor="#FFFFFF"
        isDarkModeEnabled={true}
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
        pickerContainerStyleIOS={{ backgroundColor: '#1c1c1e' }}
        textColor="#FFFFFF"
        isDarkModeEnabled={true}
      />
    </Modal>
  );
};