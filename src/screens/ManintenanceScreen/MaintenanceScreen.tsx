import React, { useState } from 'react';
import { View } from 'react-native';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useMaintenanceReminders } from '../../hooks/useMaintenanceReminders';
import { MaintenanceRecord } from '../../types';
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
    const { nextDate, nextKm } = await reminders.scheduleForRecord(
      carName, recordType, recordDate, recordKm,
      restMaintenance.recordNextDate,
      restMaintenance.recordNextKm,
    );
    if (nextDate) setRecordNextDate(nextDate);
    if (nextKm)   setRecordNextKm(nextKm);
    await restMaintenance.handleAddRecord(nextDate, nextKm);
  };

  const handleSaveEdit = async () => {
    if (!detailRecord) return;
    const { nextDate, nextKm } = await reminders.scheduleForUpdate(
      carName, editType, editDate, editKm, editNextDate, editNextKm,
    );
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