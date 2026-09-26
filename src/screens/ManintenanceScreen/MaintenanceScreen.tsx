import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useMaintenanceReminders } from '../../hooks/useMaintenanceReminders';
import { MaintenanceRecord } from '../../types';
import { confirmKmJump } from '../../utils/kmGuard';
import { CarListView } from './CarListView';
import { CarDetailsView } from './CarDetailsView';
import { SelectionModal } from './components/SelectionModal';
import { RecordDetailModal } from './components/RecordDetailModal';

export default function MaintenanceScreen() {
  const maintenance = useMaintenance();
  const reminders   = useMaintenanceReminders();

  const {
    selectedCar,
    handleUpdateRecord,
    brands, models, loading,
    setBrand, setModel, setYear,
    setRecordType, loadModels,
    modalType, setModalType,
    recordType, recordDate, recordKm,
    setRecordNextKm, setRecordNextDate,
    ...restMaintenance
  } = maintenance;

  const [detailRecord,   setDetailRecord]   = useState<MaintenanceRecord | null>(null);
  const [isEditing,      setIsEditing]      = useState(false);
  const [editType,       setEditType]       = useState('');
  const [editDate,       setEditDate]       = useState('');
  const [editNextDate,   setEditNextDate]   = useState('');
  const [editKm,         setEditKm]         = useState('');
  const [editNextKm,     setEditNextKm]     = useState('');
  const [editNote,       setEditNote]       = useState('');
  const [editPrice,      setEditPrice]      = useState('');

  const carName = selectedCar
    ? selectedCar.nickname || `${selectedCar.brand} ${selectedCar.model}`
    : '';

  const openDetail = (record: MaintenanceRecord) => {
    setDetailRecord(record);
    setEditType(record.type);
    setEditDate(record.date);
    setEditNextDate(record.nextDate || '');
    setEditKm(record.km);
    setEditNextKm(record.nextKm || '');
    setEditNote(record.note || '');
    setEditPrice(record.price || '');
    setIsEditing(false);
  };

  const handleAddRecordWithReminder = async () => {
    // Önce zorunlu alan doğrulaması: geçmezse kimliği null döner ve buradan
    // çıkarız — hatırlatıcı KURULMADAN önce doğrulanmış olur. Eskiden doğrulama
    // hatırlatıcı kurulduktan sonra yapılıyordu; kaydedilmeyen (hatalı) bir
    // girişte bile "hayalet" alarm oluşuyordu.
    const recordId = restMaintenance.validateNewRecord();
    if (!recordId) return;

    // Hatırlatıcılar kurulmadan önce: aşırı büyük km atlamasında onay iste.
    if (selectedCar && !(await confirmKmJump(selectedCar.id, parseInt(recordKm, 10)))) return;

    const { nextDate, nextKm } = await reminders.scheduleForRecord(
      recordId, carName, recordType, recordDate, recordKm,
      restMaintenance.recordNextDate,
      restMaintenance.recordNextKm,
    );
    if (nextDate) setRecordNextDate(nextDate);
    if (nextKm)   setRecordNextKm(nextKm);
    await restMaintenance.handleAddRecord(recordId, nextDate, nextKm);
  };

  const handleSaveEdit = async () => {
    if (!detailRecord) return;
    if (!editType || !editDate || !editKm) {
      Alert.alert('Hata', 'Tür, tarih ve kilometre zorunludur.');
      return;
    }

    // Hatırlatmayı etkileyen hiçbir alan değişmediyse yeniden kurmaya gerek yok
    // — hem gereksiz "ticari araç mı?" sorusunu tekrarlamaz hem de eskiden her
    // "Kaydet" basışında (değişiklik olsun olmasın) hatırlatmaların çoğalmasına
    // yol açan asıl sebebi ortadan kaldırır.
    const remindableFieldsChanged =
      editType !== detailRecord.type ||
      editDate !== detailRecord.date ||
      editKm   !== detailRecord.km ||
      editNextDate !== (detailRecord.nextDate || '') ||
      editNextKm   !== (detailRecord.nextKm   || '');

    let nextDate = editNextDate;
    let nextKm   = editNextKm;
    if (remindableFieldsChanged) {
      const result = await reminders.scheduleForUpdate(
        detailRecord.id, carName, editType, editDate, editKm, editNextDate, editNextKm,
      );
      nextDate = result.nextDate;
      nextKm   = result.nextKm;
    }

    await handleUpdateRecord({
      ...detailRecord,
      type:     editType,
      date:     editDate,
      nextDate: nextDate || undefined,
      km:       editKm,
      nextKm:   nextKm   || undefined,
      note:     editNote  || undefined,
      price:    editPrice || undefined,
    });
    setDetailRecord(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {selectedCar ? (
        <CarDetailsView
          {...restMaintenance}
          recordType={recordType}
          recordDate={recordDate}
          recordKm={recordKm}
          setRecordNextKm={setRecordNextKm}
          setRecordNextDate={setRecordNextDate}
          selectedCar={selectedCar}
          setModalType={setModalType}
          openDetail={openDetail}
          handleAddRecord={handleAddRecordWithReminder}
        />
      ) : (
        <CarListView {...maintenance} />
      )}

      <SelectionModal
        modalType={modalType}
        setModalType={setModalType}
        loading={loading}
        brands={brands}
        models={models}
        setBrand={setBrand}
        setModel={setModel}
        setYear={setYear}
        setRecordType={setRecordType}
        loadModels={loadModels}
      />

      <RecordDetailModal
        detailRecord={detailRecord}
        setDetailRecord={setDetailRecord}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editType={editType}       setEditType={setEditType}
        editDate={editDate}       setEditDate={setEditDate}
        editNextDate={editNextDate} setEditNextDate={setEditNextDate}
        editKm={editKm}           setEditKm={setEditKm}
        editNextKm={editNextKm}   setEditNextKm={setEditNextKm}
        editNote={editNote}       setEditNote={setEditNote}
        editPrice={editPrice}     setEditPrice={setEditPrice}
        handleSaveEdit={handleSaveEdit}
      />
    </View>
  );
}