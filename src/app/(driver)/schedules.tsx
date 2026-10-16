import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform, KeyboardAvoidingView, Vibration, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTranslation } from 'react-i18next';
import { useAlerts } from '../../context/AlertsContext';
import { useSchedules } from '../../context/SchedulesContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SchedulesScreen() {
  const { t } = useTranslation();
  const { addAlert } = useAlerts();
  const { schedules: Schedules, setSchedules, updateSchedule, addSchedule, deleteSchedule, clearSchedules } = useSchedules();

  const [activeTab, setActiveTab] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 60000)); // Default to 1 min in the future
  const [hasDate, setHasDate] = useState(true);
  const [hasTime, setHasTime] = useState(true);
  const [isReminderToggle, setIsReminderToggle] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [activeAlarm, setActiveAlarm] = useState<any>(null);
  const timeoutRef = useRef<any | null>(null);

  const playAlarmSound = () => {
    // Gentle vibration pattern
    Vibration.vibrate([1000, 500, 1000, 500], true);
  };

  const stopAlarmSound = () => {
    Vibration.cancel();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.setNotificationCategoryAsync('Schedule_ALARM', [
        { identifier: 'MARK_DONE', buttonTitle: t('d_sched_mark_done', 'Mark as Done'), options: { opensAppToForeground: true } },
        { identifier: 'IGNORE', buttonTitle: t('common_ignore', 'Ignore'), options: { isDestructive: true, opensAppToForeground: false } },
      ]).catch(() => {});
    }

    const sub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data && data.ScheduleId) {
        // Play gentle sound
        playAlarmSound();
        setActiveAlarm(notification.request.content);
        
        // Auto-ignore after 30 seconds
        timeoutRef.current = setTimeout(() => {
          handleAlarmResponse(data.ScheduleId as string, 'ignored');
        }, 30000);
      }
    });

    const resSub = Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      if (data && data.ScheduleId) {
        if (actionIdentifier === 'MARK_DONE') {
          handleAlarmResponse(data.ScheduleId as string, 'completed');
        } else if (actionIdentifier === 'IGNORE') {
          handleAlarmResponse(data.ScheduleId as string, 'ignored');
        }
      }
    });

    return () => {
      sub?.remove?.();
      resSub?.remove?.();
      stopAlarmSound();
    };
  }, []);

  const handleAlarmResponse = (id: string, newStatus: string) => {
    stopAlarmSound();
    setSchedules(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setActiveAlarm(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewTitle('');
    setNewDescription('');
    setDate(new Date(Date.now() + 60000));
    setHasDate(true);
    setHasTime(true);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setNewTitle('');
    setNewDescription('');
    setDate(new Date(Date.now() + 60000));
    setHasDate(true);
    setHasTime(true);
  };

  const handleEditSchedule = (rem: any) => {
    setEditingId(rem.id);
    setNewTitle(rem.title);
    setNewDescription(rem.description || '');
    if (rem.timestamp) {
      setDate(new Date(rem.timestamp));
      setHasDate(rem.hasDate !== false);
      setHasTime(rem.hasTime !== false);
    } else {
      setDate(new Date(Date.now() + 60000));
      setHasDate(false);
      setHasTime(false);
    }
    setIsReminderToggle(rem.isReminder || false);
    setIsModalVisible(true);
  };

  const handleConfirmDate = (selectedDate: Date) => {
    setShowDatePicker(false);
    const currentDate = date;
    selectedDate.setHours(currentDate.getHours());
    selectedDate.setMinutes(currentDate.getMinutes());
    setDate(selectedDate);
  };

  const handleConfirmTime = (selectedDate: Date) => {
    setShowTimePicker(false);
    const newDate = new Date(date);
    newDate.setHours(selectedDate.getHours());
    newDate.setMinutes(selectedDate.getMinutes());
    setDate(newDate);
  };

  const getUrgencyColor = (days: number, status: string) => {
    if (status === 'completed') return '#10B981'; // Green
    if (status === 'ignored') return '#9CA3AF'; // Gray
    if (days <= 7) return '#EF4444'; // Red
    if (days <= 30) return '#F59E0B'; // Amber
    return '#10B981'; // Green
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Schedules',
      'Are you sure you want to clear all Schedules?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => clearSchedules() }
      ]
    );
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSchedule(id) }
      ]
    );
  };

  const handleAddSchedule = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a Schedule title.');
      return;
    }

    if (!hasDate && !hasTime) {
      Alert.alert('Error', 'Please select at least a date or time to set an alert.');
      return;
    }

    let finalDate = new Date(date);
    let isScheduled = isReminderToggle;
    
    if (hasDate && !hasTime) {
      finalDate.setHours(9, 0, 0, 0);
    } else if (!hasDate && hasTime) {
      const now = new Date();
      finalDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      if (finalDate.getTime() < Date.now()) {
        finalDate.setDate(finalDate.getDate() + 1);
      }
    }

    const timeDiff = (finalDate.getTime() - Date.now()) / 1000;
    if (timeDiff <= 0) {
      Alert.alert('Error', 'Please select a future date and time for the alert.');
      return;
    }

    let dueDateStr = 'Anytime';
    if (hasDate && hasTime) dueDateStr = finalDate.toLocaleDateString() + ' ' + finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    else if (hasDate) dueDateStr = finalDate.toLocaleDateString();
    else if (hasTime) dueDateStr = 'By ' + finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRem = {
      id: editingId || Math.random().toString(),
      title: newTitle,
      description: newDescription,
      dueDate: dueDateStr,
      daysLeft: isScheduled ? Math.max(1, Math.ceil(timeDiff / (60 * 60 * 24))) : 0,
      type: 'Personal',
      icon: 'alarm',
      status: 'active',
      timestamp: finalDate.getTime(),
      hasDate,
      hasTime,
      isReminder: isReminderToggle
    };

    if (editingId) {
      updateSchedule(editingId, newRem);
    } else {
      addSchedule(newRem);
      addAlert(`New Schedule: ${newTitle}`, `You have set a schedule for ${dueDateStr}`, 'schedule');
    }
    
    closeModal();

    if (isScheduled) {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow notifications to receive alerts.');
          return;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Driver Schedule: ${newRem.title}`,
            body: newDescription ? newDescription : `Due: ${newRem.dueDate}`,
            sound: true,
            categoryIdentifier: 'Schedule_ALARM',
            priority: Notifications.AndroidNotificationPriority.MAX,
            interruptionLevel: 'timeSensitive',
            data: { ScheduleId: newRem.id, title: newRem.title },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor(timeDiff),
          },
        });
      }

      Alert.alert(editingId ? 'Schedule Updated!' : 'Schedule Set!', `An alert has been scheduled for ${newRem.dueDate}.`);
    } else {
      Alert.alert(editingId ? 'Schedule Updated' : 'Schedule Saved', 'Saved without an alert schedule.');
    }
  };

  const filteredSchedules = useMemo(() => {
    if (activeTab === 'All') return Schedules;
    return Schedules.filter(r => r.status.toLowerCase() === activeTab.toLowerCase());
  }, [Schedules, activeTab]);

  const activeCount = Schedules.filter(r => r.status === 'active').length;
  const ignoredCount = Schedules.filter(r => r.status === 'ignored').length;
  const completedCount = Schedules.filter(r => r.status === 'completed').length;
  const totalCount = Schedules.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('d_sched_upcoming', 'Upcoming Schedules')}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>{t('d_sched_add', 'Add Schedule')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
              <Ionicons name="flash" size={18} color="#34D399" />
            </View>
            <Text style={styles.summaryCount}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>{t('d_sched_active', 'Active')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
              <Ionicons name="checkmark-done" size={18} color="#60A5FA" />
            </View>
            <Text style={styles.summaryCount}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>{t('d_sched_done', 'Done')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(248, 113, 113, 0.2)' }]}>
              <Ionicons name="notifications-off" size={18} color="#F87171" />
            </View>
            <Text style={styles.summaryCount}>{ignoredCount}</Text>
            <Text style={styles.summaryLabel}>{t('d_sched_ignored', 'Ignored')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <Ionicons name="layers" size={18} color="#fff" />
            </View>
            <Text style={styles.summaryCount}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>{t('d_sched_total', 'Total')}</Text>
          </View>
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>{t('d_sched_all_list', 'All Schedules')}</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.clearBtnText}>{t('d_sched_clear_all', 'Clear All')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
          {['All', 'Active', 'Ignored', 'Completed'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {t(`d_sched_tab_${tab.toLowerCase()}`, tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredSchedules.sort((a, b) => a.daysLeft - b.daysLeft).map((rem) => (
          <View key={rem.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Ionicons name={rem.icon as any} size={22} color="#043094" />
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.remTitle}>{rem.title}</Text>
                <Text style={styles.remType}>{rem.type} • {t('d_sched_due', 'Due:')} {rem.dueDate}</Text>
                {!!rem.description && <Text style={styles.remDesc} numberOfLines={1}>{rem.description}</Text>}
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.daysBadge, { backgroundColor: getUrgencyColor(rem.daysLeft, rem.status) + '15' }]}>
                <Text style={[styles.daysText, { color: getUrgencyColor(rem.daysLeft, rem.status) }]}>
                  {rem.status === 'completed' ? t('d_sched_done', 'Done') : rem.status === 'ignored' ? t('d_sched_ignored', 'Ignored') : `${rem.daysLeft} ${rem.daysLeft === 1 ? t('common_day', 'day') : t('common_days', 'days')}`}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {rem.status === 'active' && (
                  <>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEditSchedule(rem)}>
                      <Ionicons name="pencil" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.editBtn, { marginLeft: 8, backgroundColor: '#10B98115' }]} onPress={() => handleAlarmResponse(rem.id, 'completed')}>
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity style={[styles.editBtn, { marginLeft: 8, backgroundColor: '#EF444415' }]} onPress={() => handleDeleteSchedule(rem.id)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {filteredSchedules.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>{t('d_sched_empty', 'No Schedules found.')}</Text>
        )}
      </ScrollView>

      {/* Add/Edit Schedule Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? t('d_sched_edit', 'Edit Schedule') : t('d_sched_new_title', 'New Schedule')}</Text>
              
              <Text style={styles.label}>{t('d_sched_lbl_task', 'Schedule Task *')}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={t('d_sched_task_ph', 'e.g. Call Dispatch')}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>{t('d_sched_lbl_desc', 'Description')}</Text>
              <TextInput 
                style={[styles.input, { minHeight: 80 }]} 
                placeholder={t('d_sched_desc_ph', 'Optional details...')}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>{t('d_sched_lbl_datetime', 'Due Date & Time * (Select at least one)')}</Text>
              <View style={styles.dateTimeRow}>
                {hasDate ? (
                  <View style={styles.dateTimeBtnWrapper}>
                    <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                      <Ionicons name="calendar-outline" size={18} color="#043094" />
                      <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.clearDateTimeBtn} onPress={() => setHasDate(false)}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.dateTimeBtnEmpty} onPress={() => setHasDate(true)}>
                    <Ionicons name="add" size={18} color="#6B7280" />
                    <Text style={styles.dateTimeTextEmpty}>{t('d_sched_add_date', 'Add Date')}</Text>
                  </TouchableOpacity>
                )}
                
                {hasTime ? (
                  <View style={styles.dateTimeBtnWrapper}>
                    <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                      <Ionicons name="time-outline" size={18} color="#043094" />
                      <Text style={styles.dateTimeText} numberOfLines={1}>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.clearDateTimeBtn} onPress={() => setHasTime(false)}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.dateTimeBtnEmpty} onPress={() => setHasTime(true)}>
                    <Ionicons name="add" size={18} color="#6B7280" />
                    <Text style={styles.dateTimeTextEmpty}>{t('d_sched_add_time', 'Add Time')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={date}
                minimumDate={new Date()}
                onConfirm={handleConfirmDate}
                onCancel={() => setShowDatePicker(false)}
              />
              
              <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                date={date}
                onConfirm={handleConfirmTime}
                onCancel={() => setShowTimePicker(false)}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 10, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>{t('d_sched_set_reminder', 'Set as Reminder')}</Text>
                <Switch 
                  value={isReminderToggle} 
                  onValueChange={setIsReminderToggle}
                  trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
                  thumbColor={isReminderToggle ? '#3B82F6' : '#9CA3AF'}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>{t('common_cancel', 'Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddSchedule}>
                  <Text style={styles.saveBtnText}>{editingId ? t('d_sched_update_btn', 'Update Schedule') : t('d_sched_save_btn', 'Save & Set Alert')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Screen In-App Alarm Modal (Gentle Theme) */}
      <Modal visible={!!activeAlarm} animationType="fade" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="calendar" size={50} color="#3B82F6" />
          </View>
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#1E3A8A', textAlign: 'center', marginBottom: 12 }}>
            {activeAlarm?.title}
          </Text>
          <Text style={{ fontSize: 18, color: '#3B82F6', textAlign: 'center', marginBottom: 50 }}>
            {activeAlarm?.body}
          </Text>
          
          <TouchableOpacity 
            style={{ backgroundColor: '#2563EB', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#2563EB', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
            onPress={() => handleAlarmResponse(activeAlarm?.data?.ScheduleId as string, 'completed')}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{t('d_sched_mark_done', 'Mark as Done')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ backgroundColor: 'transparent', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' }}
            onPress={() => handleAlarmResponse(activeAlarm?.data?.ScheduleId as string, 'ignored')}
          >
            <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '600' }}>{t('d_sched_dismiss', 'Dismiss')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', flex: 1, flexWrap: 'wrap' },
  addBtn: { flexDirection: 'row', backgroundColor: '#043094', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  summaryCard: { 
    flexDirection: 'row', 
    backgroundColor: '#043094', 
    borderRadius: 24, 
    paddingVertical: 24,
    paddingHorizontal: 16, 
    marginBottom: 28,
    shadowColor: '#043094',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryCount: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2, textAlign: 'center' },
  summaryLabel: { fontSize: 11, color: '#E0E7FF', textAlign: 'center', fontWeight: '500' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: '75%', alignSelf: 'center' },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  clearBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  tabsScroll: { marginBottom: 16, maxHeight: 36 },
  tabsContainer: { gap: 8, paddingBottom: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#043094' },
  tabText: { color: '#4B5563', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardDetails: { flex: 1, paddingRight: 10 },
  remTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  remType: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  remDesc: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  daysBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  daysText: { fontSize: 13, fontWeight: '700' },
  editBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 },
  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dateTimeBtnWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dateTimeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 10, gap: 4 },
  dateTimeText: { color: '#043094', fontWeight: '600', fontSize: 13 },
  clearDateTimeBtn: { padding: 4, marginLeft: 4 },
  dateTimeBtnEmpty: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8, padding: 10, gap: 4 },
  dateTimeTextEmpty: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: '#043094', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});



