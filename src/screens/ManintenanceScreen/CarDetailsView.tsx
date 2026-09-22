import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Car, MaintenanceRecord } from "../../types";
import { styles } from "./styles";
import { RecordCard } from "./components/RecordCard";
import {
  formatNumber,
  parseNumber,
  parseDateString,
  formatDateToString,
} from "./components/RecordDetailModal";

interface Props {
  selectedCar:       Car;
  setSelectedCar:    (car: Car | null) => void;
  showRecordForm:    boolean;
  setShowRecordForm: (val: boolean) => void;
  recordType:        string;
  recordDate:        string;  setRecordDate:     (val: string) => void;
  recordKm:          string;  setRecordKm:       (val: string) => void;
  recordNextKm:      string;  setRecordNextKm:   (val: string) => void;
  recordNextDate:    string;  setRecordNextDate:  (val: string) => void;
  recordNote:        string;  setRecordNote:     (val: string) => void;
  recordPrice:       string;  setRecordPrice:    (val: string) => void;
  setModalType:      (val: "brand" | "model" | "year" | "recordType" | null) => void;
  handleAddRecord:   () => void;
  handleDeleteRecord:(id: string) => void;
  openDetail:        (record: MaintenanceRecord) => void;
}

export const CarDetailsView = ({
  selectedCar, setSelectedCar,
  showRecordForm, setShowRecordForm,
  recordType,
  recordDate, setRecordDate,
  recordKm, setRecordKm,
  recordNextKm, setRecordNextKm,
  recordNextDate, setRecordNextDate,
  recordNote, setRecordNote,
  recordPrice, setRecordPrice,
  setModalType,
  handleAddRecord, handleDeleteRecord, openDetail,
}: Props) => {
  const insets = useSafeAreaInsets();
  const [showDatePicker,     setShowDatePicker]     = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const kmRef     = useRef<TextInput>(null);
  const nextKmRef = useRef<TextInput>(null);
  const noteRef   = useRef<TextInput>(null);
  const priceRef  = useRef<TextInput>(null);

  const isDateType  = ["Muayene", "Sigorta", "Kasko"].includes(recordType);
  const isPeriyodik = recordType === "Periyodik Bakım";

  return (
    <View style={{ flex: 1 }}>
      {/* Header — ScrollView dışında sabit kalır */}
      <View style={[styles.container, { flex: 1 }]}>
        <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => setSelectedCar(null)} hitSlop={12}>
            <Text style={styles.backButton}>← Geri</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerCarName}>
              {selectedCar.nickname || `${selectedCar.brand} ${selectedCar.model}`}
            </Text>
            <Text style={styles.headerCarSub}>
              {selectedCar.brand} {selectedCar.model} • {selectedCar.year}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {selectedCar.records.length === 0 && !showRecordForm && (
            <Text style={styles.empty}>Henüz işlem kaydı yok.</Text>
          )}

          {selectedCar.records.map(record => (
            <RecordCard
              key={record.id}
              record={record}
              onPress={openDetail}
              onDelete={handleDeleteRecord}
            />
          ))}

          {showRecordForm && (
            <View style={styles.form}>
              <Pressable
                style={styles.selector}
                onPress={() => setModalType("recordType")}
              >
                <Text style={recordType ? styles.selectorText : styles.selectorPlaceholder}>
                  {recordType || "İşlem türü seçin"}
                </Text>
                <Text style={styles.selectorArrow}>›</Text>
              </Pressable>

              <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: recordDate ? "#020202" : "#52525B" }}>
                  {recordDate || "📅 İşlem Tarihi Seçin"}
                </Text>
              </Pressable>

              <TextInput
                ref={kmRef}
                style={styles.input}
                placeholder="Aracın Kilometresi"
                placeholderTextColor="#52525B"
                value={formatNumber(recordKm)}
                onChangeText={t => setRecordKm(parseNumber(t))}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => isPeriyodik ? nextKmRef.current?.focus() : noteRef.current?.focus()}
                blurOnSubmit={false}
              />

              {isPeriyodik && (
                <TextInput
                  ref={nextKmRef}
                  style={styles.input}
                  placeholder="Sonraki Bakım Km (İsteğe bağlı)"
                  placeholderTextColor="#52525B"
                  value={formatNumber(recordNextKm)}
                  onChangeText={t => setRecordNextKm(parseNumber(t))}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => noteRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}

              {isDateType && (
                <Pressable style={styles.input} onPress={() => setShowNextDatePicker(true)}>
                  <Text style={{ color: recordNextDate ? "#020202" : "#52525B" }}>
                    {recordNextDate || `📆 Sonraki ${recordType} Tarihi (otomatik hesaplanır)`}
                  </Text>
                </Pressable>
              )}

              <TextInput
                ref={noteRef}
                style={styles.input}
                placeholder="Not (isteğe bağlı)"
                placeholderTextColor="#52525B"
                value={recordNote}
                onChangeText={setRecordNote}
                returnKeyType="next"
                onSubmitEditing={() => priceRef.current?.focus()}
                blurOnSubmit={false}
              />

              <TextInput
                ref={priceRef}
                style={styles.input}
                placeholder="Ödenilen Ücret (isteğe bağlı)"
                placeholderTextColor="#52525B"
                value={formatNumber(recordPrice)}
                onChangeText={t => setRecordPrice(parseNumber(t))}
                keyboardType="numeric"
                returnKeyType="done"
              />

              <Pressable style={styles.button} onPress={handleAddRecord}>
                <Text style={styles.buttonText}>Kaydet</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setShowRecordForm(false)}>
                <Text style={styles.cancelText}>İptal</Text>
              </Pressable>
            </View>
          )}

          {!showRecordForm && (
            <Pressable style={styles.button} onPress={() => setShowRecordForm(true)}>
              <Text style={styles.buttonText}>+ İşlem Ekle</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={parseDateString(recordDate)}
        display="inline"
        onConfirm={(date: Date) => { setRecordDate(formatDateToString(date)); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
        confirmTextIOS="Tamam"
        cancelTextIOS="Vazgeç"
        pickerContainerStyleIOS={{ backgroundColor: "#1c1c1e" }}
        textColor="#FFFFFF"
        isDarkModeEnabled
      />

      <DateTimePickerModal
        isVisible={showNextDatePicker}
        mode="date"
        date={parseDateString(recordNextDate)}
        display="inline"
        onConfirm={(date: Date) => { setRecordNextDate(formatDateToString(date)); setShowNextDatePicker(false); }}
        onCancel={() => setShowNextDatePicker(false)}
        confirmTextIOS="Tamam"
        cancelTextIOS="Vazgeç"
        pickerContainerStyleIOS={{ backgroundColor: "#1c1c1e" }}
        textColor="#FFFFFF"
        isDarkModeEnabled
      />
    </View>
  );
};